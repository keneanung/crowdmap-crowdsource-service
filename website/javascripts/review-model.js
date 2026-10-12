const model = (() => {
  "use strict";

  function targetKey(change) {
    switch (change.type) {
      case "create-area":
        return "area:" + change.areaId;
      case "rename-area":
        return "area:" + change.areaId + ":name";
      case "delete-area":
        return "area:" + change.areaId + ":delete";
      case "create-room":
        return "room:" + change.roomNumber + ":create";
      case "delete-room":
        return "room:" + change.roomNumber + ":delete";
      case "room-name":
        return "room:" + change.roomNumber + ":name";
      case "set-room-coordinates":
        return "room:" + change.roomNumber + ":coordinates";
      case "set-room-area":
        return "room:" + change.roomNumber + ":area";
      case "set-room-environment":
        return "room:" + change.roomNumber + ":environment";
      case "set-room-weight":
        return "room:" + change.roomNumber + ":weight";
      case "set-room-symbol":
        return "room:" + change.roomNumber + ":symbol";
      case "set-room-hash":
        return "room:" + change.roomNumber + ":hash";
      case "modify-room-user-data":
      case "delete-room-user-data":
        return "room:" + change.roomNumber + ":data:" + change.key;
      case "modify-special-exit":
      case "delete-special-exit":
        return (
          "room:" +
          change.roomNumber +
          ":special:" +
          change.exitCommand +
          ":destination"
        );
      case "lock-special-exit":
      case "unlock-special-exit":
        return (
          "room:" +
          change.roomNumber +
          ":special:" +
          change.exitCommand +
          ":lock"
        );
      case "modify-special-exit-weight":
        return (
          "room:" +
          change.roomNumber +
          ":special:" +
          change.exitCommand +
          ":weight"
        );
      case "modify-exit":
      case "delete-exit":
        return (
          "room:" +
          change.roomNumber +
          ":exit:" +
          change.direction +
          ":destination"
        );
      case "modify-exit-weight":
        return (
          "room:" + change.roomNumber + ":exit:" + change.direction + ":weight"
        );
      case "set-exit-door":
        return (
          "room:" + change.roomNumber + ":exit:" + change.direction + ":door"
        );
      case "set-map-user-data":
      case "delete-map-user-data":
        return "map:data:" + change.key;
      case "set-map-label":
      case "delete-map-label":
        return "area:" + change.areaId + ":label:" + change.labelId;
      default:
        return "change:" + change.changeId;
    }
  }

  function targetDescription(change) {
    if (change.type.indexOf("map-user-data") !== -1) {
      return "map user data ‘" + change.key + "’";
    }
    if (change.type.indexOf("map-label") !== -1) {
      return "label " + change.labelId + " in area " + change.areaId;
    }
    if (
      change.type === "create-area" ||
      change.type === "rename-area" ||
      change.type === "delete-area"
    ) {
      return "area " + change.areaId;
    }
    if (change.type.indexOf("special-exit") !== -1) {
      return (
        "the ‘" +
        change.exitCommand +
        "’ special exit from room " +
        change.roomNumber
      );
    }
    if (change.type.indexOf("exit") !== -1) {
      return "the " + change.direction + " exit from room " + change.roomNumber;
    }
    return "room " + change.roomNumber;
  }

  function relationBetween(left, right) {
    if (targetKey(left) === targetKey(right)) {
      return (
        "Both reports change " +
        targetDescription(left) +
        " in incompatible ways."
      );
    }

    var sameRoom =
      left.roomNumber !== undefined && left.roomNumber === right.roomNumber;
    if (
      sameRoom &&
      (left.type === "delete-room" || right.type === "delete-room")
    ) {
      return (
        "The deletion of room " +
        left.roomNumber +
        " also removes the related reported change."
      );
    }
    if (
      sameRoom &&
      (left.type === "create-room" || right.type === "create-room")
    ) {
      return (
        "One report creates room " +
        left.roomNumber +
        "; the related change depends on that room existing."
      );
    }

    var leftExit = left.type.indexOf("exit") !== -1;
    var rightExit = right.type.indexOf("exit") !== -1;
    if (
      sameRoom &&
      leftExit &&
      rightExit &&
      left.direction &&
      left.direction === right.direction
    ) {
      return (
        "Both reports affect the " +
        left.direction +
        " exit from room " +
        left.roomNumber +
        "."
      );
    }
    if (
      sameRoom &&
      leftExit &&
      rightExit &&
      left.exitCommand &&
      left.exitCommand === right.exitCommand
    ) {
      return (
        "Both reports affect the ‘" +
        left.exitCommand +
        "’ special exit from room " +
        left.roomNumber +
        "."
      );
    }

    if (left.type === "delete-room" && right.destination === left.roomNumber) {
      return (
        "The reported exit leads to room " +
        left.roomNumber +
        ", while another report deletes that room."
      );
    }
    if (right.type === "delete-room" && left.destination === right.roomNumber) {
      return (
        "The reported exit leads to room " +
        right.roomNumber +
        ", while another report deletes that room."
      );
    }

    var leftArea = left.areaId;
    var rightArea = right.areaId;
    if (
      leftArea !== undefined &&
      leftArea === rightArea &&
      (left.type.indexOf("area") !== -1 || right.type.indexOf("area") !== -1)
    ) {
      return "Both reports depend on the state of area " + leftArea + ".";
    }
    return null;
  }

  function typeLabel(type) {
    return type
      .split("-")
      .map(function (part) {
        return part.charAt(0).toUpperCase() + part.slice(1);
      })
      .join(" ");
  }

  function changeSummary(change) {
    var location =
      change.roomNumber !== undefined
        ? "Room " + change.roomNumber
        : change.areaId !== undefined
          ? "Area " + change.areaId
          : "Map";
    var omitted = new Set([
      "changeId",
      "reporters",
      "roomNumber",
      "areaId",
      "type",
      "upstreamConflict",
      "upstreamResolved",
    ]);
    var details = Object.keys(change)
      .filter(function (key) {
        return !omitted.has(key);
      })
      .map(function (key) {
        return key + ": " + String(change[key]);
      });
    return location + (details.length ? " · " + details.join(" · ") : "");
  }

  function groupChanges(changes) {
    var relationships = new Map();
    changes.forEach(function (change) {
      relationships.set(change.changeId, []);
    });
    changes.forEach(function (change, index) {
      changes.slice(index + 1).forEach(function (other) {
        var reason = relationBetween(change, other);
        if (!reason) return;
        relationships
          .get(change.changeId)
          .push({ change: other, reason: reason });
        relationships
          .get(other.changeId)
          .push({ change: change, reason: reason });
      });
    });
    return relationships;
  }

  // Change IDs are UUIDv7: their leading 48 bits encode report creation time.
  function changeTime(change) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      change.changeId,
    )
      ? new Date(parseInt(change.changeId.slice(0, 13).replace("-", ""), 16))
      : null;
  }

  function groupChangesByLocation(changes, context = {}, allChanges = changes) {
    var rooms = context.rooms || new Map();
    var areas = context.areas || new Map();
    var groups = new Map();
    var roomAssignments = new Map();
    allChanges.forEach(function (item) {
      if (item.roomNumber === undefined || typeof item.areaId !== "number")
        return;
      if (!roomAssignments.has(item.roomNumber))
        roomAssignments.set(item.roomNumber, new Set());
      roomAssignments.get(item.roomNumber).add(item.areaId);
    });
    changes.forEach(function (change) {
      var roomId = change.roomNumber;
      var target = rooms.get(roomId);
      // Keep moves with the room's baseline area. Only infer an absent room's
      // proposed area when every area assignment agrees.
      var assignments = roomAssignments.get(roomId) || new Set();
      var areaId =
        roomId === undefined
          ? change.areaId
          : target
            ? target.areaId
            : assignments.size === 1
              ? Array.from(assignments)[0]
              : undefined;
      var key =
        areaId !== undefined
          ? "area:" + areaId
          : roomId !== undefined
            ? "unknown"
            : "map";
      var area = areas.get(areaId);
      if (!groups.has(key))
        groups.set(key, {
          key: key,
          areaId: areaId,
          label:
            areaId !== undefined
              ? "Area " +
                areaId +
                (area && area.name ? " · " + area.name : "") +
                (context.loaded && (!area || area.absent)
                  ? " · absent from baseline"
                  : "")
              : key === "unknown"
                ? "Rooms with unknown area"
                : "Map-wide changes",
          rooms: new Map(),
        });
      var group = groups.get(key);
      var roomKey = roomId === undefined ? "general" : "room:" + roomId;
      if (!group.rooms.has(roomKey))
        group.rooms.set(roomKey, {
          roomId: roomId,
          label:
            roomId === undefined
              ? areaId === undefined
                ? "Map changes"
                : "Area-wide changes"
              : "Room " +
                roomId +
                (target && target.name ? " · " + target.name : "") +
                (context.loaded && (!target || target.absent)
                  ? " · absent from baseline"
                  : ""),
          changes: [],
        });
      group.rooms.get(roomKey).changes.push(change);
    });
    return Array.from(groups.values())
      .sort(function (a, b) {
        return (
          (a.areaId === undefined) - (b.areaId === undefined) ||
          (a.areaId !== undefined
            ? a.areaId - b.areaId
            : a.key.localeCompare(b.key))
        );
      })
      .map(function (group) {
        return {
          ...group,
          rooms: Array.from(group.rooms.values())
            .sort(function (a, b) {
              return (
                (a.roomId !== undefined) - (b.roomId !== undefined) ||
                (a.roomId || 0) - (b.roomId || 0)
              );
            })
            .map(function (room) {
              return {
                ...room,
                changes: room.changes.sort(function (a, b) {
                  var left = changeTime(a),
                    right = changeTime(b);
                  return left && right
                    ? left - right || a.changeId.localeCompare(b.changeId)
                    : 0;
                }),
              };
            }),
        };
      });
  }

  function isRelated(change, groups) {
    return (groups.get(change.changeId) || []).length > 0;
  }

  function relationshipDetails(change, groups) {
    return groups.get(change.changeId) || [];
  }

  function filterChanges(changes, groups, filter, search, selected) {
    var query = search.toLowerCase();
    return changes.filter(function (change) {
      if (filter === "conflicts" && !isRelated(change, groups)) return false;
      if (filter === "upstream" && !change.upstreamConflict) return false;
      if (filter === "selected" && !selected.has(change.changeId)) return false;
      return (
        !query ||
        (
          typeLabel(change.type) +
          " " +
          changeSummary(change) +
          " " +
          change.changeId +
          " " +
          (change.upstreamConflict ? change.upstreamConflict.reason : "")
        )
          .toLowerCase()
          .includes(query)
      );
    });
  }

  function canApply(rawVersion, apiKey) {
    return Boolean(rawVersion && apiKey.trim());
  }

  function unselectedChangeIds(changes, selected) {
    return changes
      .filter(function (change) {
        return !selected.has(change.changeId);
      })
      .map(function (change) {
        return change.changeId;
      });
  }

  return {
    changeTime: changeTime,
    groupChangesByLocation: groupChangesByLocation,
    canApply: canApply,
    changeSummary: changeSummary,
    filterChanges: filterChanges,
    groupChanges: groupChanges,
    isRelated: isRelated,
    relationBetween: relationBetween,
    relationshipDetails: relationshipDetails,
    targetKey: targetKey,
    typeLabel: typeLabel,
    unselectedChangeIds: unselectedChangeIds,
  };
})();

if (typeof window !== "undefined") {
  window.CrowdmapReviewModel = model;
}

export const {
  changeTime,
  groupChangesByLocation,
  canApply,
  changeSummary,
  filterChanges,
  groupChanges,
  isRelated,
  relationBetween,
  relationshipDetails,
  targetKey,
  typeLabel,
  unselectedChangeIds,
} = model;
