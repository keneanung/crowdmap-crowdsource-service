import * as model from "./review-model.js";

(function () {
  "use strict";

  var state = {
    activeId: null,
    changes: [],
    filter: "all",
    groups: new Map(),
    rawVersion: "",
    search: "",
    selected: new Set(),
  };

  var elements = {
    apiKey: document.querySelector("#api-key"),
    apply: document.querySelector("#apply-update"),
    baselineVersion: document.querySelector("#baseline-version"),
    changeList: document.querySelector("#change-list"),
    conflictCount: document.querySelector("#conflict-count"),
    filters: document.querySelectorAll(".filter"),
    blink: document.querySelector("#blink-toggle"),
    differenceMode: document.querySelector("#difference-mode"),
    notice: document.querySelector("#notice"),
    pendingCount: document.querySelector("#pending-count"),
    previewDescription: document.querySelector("#preview-description"),
    previewMarked: document.querySelector("#show-marked"),
    previewTitle: document.querySelector("#preview-title"),
    comparisonSideBySide: document.querySelector("#comparison-side-by-side"),
    comparisonWipe: document.querySelector("#comparison-wipe"),
    queueStatus: document.querySelector("#queue-status"),
    refresh: document.querySelector("#refresh"),
    search: document.querySelector("#search"),
    selectedCount: document.querySelector("#selected-count"),
    showBaseline: document.querySelector("#show-baseline"),
    showAllDetails: document.querySelector("#show-all-details"),
    roomDiffDetails: document.querySelector("#room-diff-details"),
    roomDiffSummary: document.querySelector("#room-diff-summary"),
    roomDiffTitle: document.querySelector("#room-diff-title"),
    upstreamConflictCount: document.querySelector("#upstream-conflict-count"),
    wipePosition: document.querySelector("#wipe-position"),
  };

  function isRelated(change) {
    return model.isRelated(change, state.groups);
  }

  function makeBadge(text, className) {
    var badge = document.createElement("span");
    badge.className = "badge" + (className ? " " + className : "");
    badge.textContent = text;
    return badge;
  }

  function visibleChanges() {
    return model.filterChanges(
      state.changes,
      state.groups,
      state.filter,
      state.search,
      state.selected,
    );
  }

  function updateActions() {
    var count = state.selected.size;
    elements.selectedCount.textContent = String(count);
    elements.previewMarked.disabled = count === 0;
    elements.apply.disabled = !model.canApply(
      state.rawVersion,
      elements.apiKey.value,
    );
  }

  function renderList() {
    elements.changeList.replaceChildren();
    var changes = visibleChanges();
    elements.queueStatus.textContent =
      changes.length + " of " + state.changes.length + " changes shown";
    if (changes.length === 0) {
      var empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent =
        state.changes.length === 0
          ? "No pending changes."
          : "No changes match this view.";
      elements.changeList.appendChild(empty);
      return;
    }

    changes.forEach(function (change) {
      var card = document.createElement("div");
      card.className =
        "change-card" + (state.activeId === change.changeId ? " active" : "");
      card.dataset.changeId = change.changeId;

      var checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = state.selected.has(change.changeId);
      checkbox.setAttribute(
        "aria-label",
        "Mark " + model.typeLabel(change.type) + " as incorporated upstream",
      );
      checkbox.addEventListener("click", function (event) {
        event.stopPropagation();
        if (checkbox.checked) state.selected.add(change.changeId);
        else state.selected.delete(change.changeId);
        updateActions();
        if (state.filter === "selected") renderList();
      });

      var content = document.createElement("div");
      var heading = document.createElement("div");
      heading.className = "change-heading";
      var label = document.createElement("span");
      label.className = "change-type";
      label.textContent = model.typeLabel(change.type);
      heading.appendChild(label);
      var summary = document.createElement("p");
      summary.className = "change-summary";
      summary.textContent = model.changeSummary(change);
      var badges = document.createElement("div");
      badges.className = "badges";
      badges.appendChild(
        makeBadge(
          change.reporters +
            (change.reporters === 1 ? " reporter" : " reporters"),
        ),
      );
      if (isRelated(change))
        badges.appendChild(makeBadge("Related edits", "badge-warning"));
      if (change.upstreamConflict)
        badges.appendChild(makeBadge("Upstream conflict", "badge-danger"));
      badges.appendChild(makeBadge(change.changeId.slice(-8), "badge-id"));
      content.append(heading, summary, badges);
      if (change.upstreamConflict) {
        var conflict = document.createElement("p");
        conflict.className = "upstream-conflict";
        conflict.textContent = change.upstreamConflict.reason;
        content.appendChild(conflict);
      }
      var relationships = model.relationshipDetails(change, state.groups);
      var relationshipDetailsElement;
      if (relationships.length > 0) {
        relationshipDetailsElement = document.createElement("details");
        relationshipDetailsElement.className = "relationship-details";
        var detailsSummary = document.createElement("summary");
        detailsSummary.textContent =
          "Why related · " +
          relationships.length +
          (relationships.length === 1 ? " change" : " changes");
        var relationshipList = document.createElement("ul");
        relationships.forEach(function (relationship) {
          var item = document.createElement("li");
          var related = relationship.change;
          item.textContent =
            model.typeLabel(related.type) +
            " · " +
            model.changeSummary(related) +
            " · " +
            related.changeId.slice(-8) +
            " — " +
            relationship.reason;
          relationshipList.appendChild(item);
        });
        relationshipDetailsElement.append(detailsSummary, relationshipList);
      }
      var previewButton = document.createElement("button");
      previewButton.type = "button";
      previewButton.className = "change-preview";
      previewButton.setAttribute(
        "aria-label",
        "Preview " +
          model.typeLabel(change.type) +
          " for " +
          model.changeSummary(change),
      );
      previewButton.appendChild(content);
      previewButton.addEventListener("click", function () {
        previewChanges([change.changeId], change);
      });
      card.append(checkbox, previewButton);
      if (relationshipDetailsElement)
        card.appendChild(relationshipDetailsElement);
      elements.changeList.appendChild(card);
    });
  }

  function previewChanges(ids, activeChange) {
    state.activeId = activeChange ? activeChange.changeId : null;
    elements.previewTitle.textContent = activeChange
      ? model.typeLabel(activeChange.type)
      : "Marked changes";
    elements.previewDescription.textContent = activeChange
      ? model.changeSummary(activeChange)
      : ids.length + " marked changes applied to the baseline preview.";
    window.CrowdmapReviewMap.show(
      ids,
      state.changes.filter(function (change) {
        return ids.includes(change.changeId);
      }),
      activeChange && activeChange.roomNumber,
    );
    renderList();
  }

  function displayValue(value) {
    if (value === undefined) return "—";
    if (value === null) return "none";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  }

  function addPropertyRow(container, label, before, after, roomNumber) {
    var row = document.createElement("button");
    row.type = "button";
    row.className = "property-diff-row";
    row.innerHTML = "<span></span><span></span>";
    row.children[0].textContent = label;
    row.children[1].textContent = displayValue(before) + " → " + displayValue(after);
    row.addEventListener("click", function () {
      window.CrowdmapReviewMap.focus(roomNumber);
    });
    container.appendChild(row);
  }

  function addSummaryRow(container, label, before, after, roomNumber) {
    var row = document.createElement("button");
    row.type = "button";
    row.className = "property-summary-row";
    var name = document.createElement("span");
    name.textContent = "Changed: " + label;
    var values = document.createElement("span");
    values.textContent = displayValue(before) + " → " + displayValue(after);
    row.append(name, values);
    row.addEventListener("click", function () {
      window.CrowdmapReviewMap.focus(roomNumber);
    });
    container.appendChild(row);
  }

  function renderRoomDiff(roomNumber) {
    var comparison = window.CrowdmapReviewMap.getRoomComparison(roomNumber);
    var before = comparison.baseline;
    var after = comparison.candidate;
    var relatedChanges = comparison.changes;
    elements.roomDiffDetails.replaceChildren();
    elements.roomDiffSummary.replaceChildren();
    elements.showAllDetails.disabled = !before && !after;
    elements.showAllDetails.textContent = "Show all details";
    elements.roomDiffDetails.hidden = true;
    elements.roomDiffTitle.textContent = "Room " + roomNumber;
    if (!before || !after) {
      var presence = document.createElement("p");
      presence.className = "property-presence " + (!before ? "addition" : "removal");
      presence.textContent = !before
        ? "Added in the candidate map."
        : "Removed from the candidate map.";
      elements.roomDiffSummary.appendChild(presence);
      return;
    }
    var changed = [];
    [
      ["name", "Name"],
      ["env", "Environment"],
      ["area", "Area"],
      ["x", "X coordinate"],
      ["y", "Y coordinate"],
      ["z", "Level"],
      ["weight", "Weight"],
      ["roomChar", "Symbol"],
      ["hash", "Hash"],
    ].forEach(function (field) {
      if (before[field[0]] !== after[field[0]]) {
        changed.push({
          key: field[0],
          label: field[1],
          before: before[field[0]],
          after: after[field[0]],
        });
      }
    });
    var exits = new Set(Object.keys(before.exits || {}).concat(Object.keys(after.exits || {})));
    exits.forEach(function (direction) {
      if ((before.exits || {})[direction] !== (after.exits || {})[direction]) {
        changed.push({
          key: "exit:" + direction,
          label: direction + " exit",
          before: (before.exits || {})[direction],
          after: (after.exits || {})[direction],
        });
      }
    });
    var userDataKeys = new Set(Object.keys(before.userData || {}).concat(Object.keys(after.userData || {})));
    var userDataChanges = Array.from(userDataKeys).filter(function (key) {
      return (before.userData || {})[key] !== (after.userData || {})[key];
    });
    changed.slice(0, 3).forEach(function (field) {
      addSummaryRow(elements.roomDiffSummary, field.label, field.before, field.after, roomNumber);
    });
    if (changed.length > 3) {
      var remaining = document.createElement("p");
      remaining.className = "property-summary-note";
      remaining.textContent = (changed.length - 3) + " more changed value" + (changed.length === 4 ? "." : "s.");
      elements.roomDiffSummary.appendChild(remaining);
    }
    if (changed.length === 0) {
      var noDirectDiff = document.createElement("p");
      noDirectDiff.className = "property-summary-note";
      noDirectDiff.textContent = relatedChanges.length
        ? "This report targets the room without changing a compact room property."
        : "No changed room properties are visible at this target.";
      elements.roomDiffSummary.appendChild(noDirectDiff);
    }
    changed.forEach(function (field) {
      addPropertyRow(elements.roomDiffDetails, field.label, field.before, field.after, roomNumber);
    });
    if (userDataChanges.length) {
      var data = document.createElement("details");
      data.className = "property-details-list";
      var summary = document.createElement("summary");
      summary.textContent = userDataChanges.length + " changed user-data value" + (userDataChanges.length === 1 ? "" : "s");
      data.appendChild(summary);
      userDataChanges.forEach(function (key) {
        addPropertyRow(data, "User data · " + key, (before.userData || {})[key], (after.userData || {})[key], roomNumber);
      });
      elements.roomDiffDetails.appendChild(data);
    }
    var unchanged = ["name", "env", "area", "x", "y", "z", "weight", "roomChar", "hash"].filter(function (key) {
      return before[key] === after[key];
    }).length +
      Array.from(exits).filter(function (direction) {
        return (before.exits || {})[direction] === (after.exits || {})[direction];
      }).length +
      Array.from(userDataKeys).filter(function (key) {
        return (before.userData || {})[key] === (after.userData || {})[key];
      }).length;
    var note = document.createElement("p");
    note.className = "unchanged-note";
    note.textContent = "Unchanged properties: " + unchanged + " hidden.";
    elements.roomDiffSummary.appendChild(note);
    var detailsNote = document.createElement("p");
    detailsNote.className = "unchanged-note";
    detailsNote.textContent = "Long exit and user-data lists remain independently expandable.";
    elements.roomDiffDetails.appendChild(detailsNote);
  }

  function showNotice(message, isError) {
    elements.notice.textContent = message;
    elements.notice.classList.toggle("error", Boolean(isError));
    elements.notice.hidden = false;
    window.clearTimeout(showNotice.timeout);
    showNotice.timeout = window.setTimeout(function () {
      elements.notice.hidden = true;
    }, 6000);
  }

  async function loadChanges() {
    elements.refresh.disabled = true;
    elements.queueStatus.textContent = "Loading pending changes…";
    try {
      var response = await fetch("change?timesSeen=0", {
        headers: { Accept: "application/json" },
      });
      if (!response.ok)
        throw new Error(
          "Could not load changes (HTTP " + response.status + ")",
        );
      state.changes = await response.json();
      state.rawVersion = response.headers.get("X-Map-Version-Raw") || "";
      state.selected.clear();
      state.activeId = null;
      state.groups = model.groupChanges(state.changes);
      var relatedCount = state.changes.filter(isRelated).length;
      elements.pendingCount.textContent = String(state.changes.length);
      elements.conflictCount.textContent = String(relatedCount);
      elements.upstreamConflictCount.textContent = String(
        state.changes.filter(function (change) {
          return Boolean(change.upstreamConflict);
        }).length,
      );
      elements.baselineVersion.textContent = state.rawVersion || "Unavailable";
      renderList();
      updateActions();
    } catch (error) {
      elements.queueStatus.textContent = error.message;
      showNotice(error.message, true);
    } finally {
      elements.refresh.disabled = false;
    }
  }

  async function applyUpdate() {
    var selectedIds = Array.from(state.selected);
    var removal =
      selectedIds.length === 0
        ? " without removing any pending changes"
        : " and remove " +
          selectedIds.length +
          " incorporated change" +
          (selectedIds.length === 1 ? "" : "s");
    var confirmed = window.confirm(
      "Apply the newly published upstream baseline" + removal + "?",
    );
    if (!confirmed) return;

    elements.apply.disabled = true;
    elements.apply.textContent = "Applying…";
    try {
      var response = await fetch("change/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": elements.apiKey.value,
        },
        body: JSON.stringify({
          version: state.rawVersion,
          obsoleteChanges: selectedIds,
        }),
      });
      if (!response.ok) {
        var body = await response.json().catch(function () {
          return {};
        });
        throw new Error(
          body.message || "Update failed (HTTP " + response.status + ")",
        );
      }
      var result = await response.json().catch(function () {
        return {};
      });
      var automaticallyResolved = result.automaticallyResolved || 0;
      var conflicts = result.upstreamConflicts || 0;
      showNotice(
        "Baseline updated. " +
          automaticallyResolved +
          " report" +
          (automaticallyResolved === 1 ? " was" : "s were") +
          " resolved automatically; " +
          conflicts +
          " upstream conflict" +
          (conflicts === 1 ? " was" : "s were") +
          " flagged.",
        false,
      );
      await loadChanges();
      previewChanges([], null);
    } catch (error) {
      showNotice(error.message, true);
    } finally {
      elements.apply.textContent = "Apply baseline update";
      updateActions();
    }
  }

  elements.search.addEventListener("input", function () {
    state.search = elements.search.value;
    renderList();
  });
  elements.filters.forEach(function (filter) {
    filter.addEventListener("click", function () {
      state.filter = filter.dataset.filter;
      elements.filters.forEach(function (item) {
        item.classList.toggle("active", item === filter);
      });
      renderList();
    });
  });
  elements.apiKey.addEventListener("input", updateActions);
  elements.refresh.addEventListener("click", loadChanges);
  elements.previewMarked.addEventListener("click", function () {
    previewChanges(Array.from(state.selected));
  });
  elements.showBaseline.addEventListener("click", function () {
    state.activeId = null;
    elements.previewTitle.textContent = "Baseline map";
    elements.previewDescription.textContent =
      "No pending changes are applied in this view.";
    window.CrowdmapReviewMap.show([], [], undefined);
    renderList();
  });
  elements.differenceMode.addEventListener("change", function () {
    window.CrowdmapReviewMap.setDifferenceMode(elements.differenceMode.checked);
  });
  elements.comparisonSideBySide.addEventListener("click", function () {
    elements.comparisonSideBySide.classList.add("active");
    elements.comparisonWipe.classList.remove("active");
    window.CrowdmapReviewMap.setWipeMode(false);
  });
  elements.comparisonWipe.addEventListener("click", function () {
    elements.comparisonWipe.classList.add("active");
    elements.comparisonSideBySide.classList.remove("active");
    window.CrowdmapReviewMap.setWipeMode(true);
  });
  elements.wipePosition.addEventListener("input", function () {
    window.CrowdmapReviewMap.setWipe(Number(elements.wipePosition.value));
  });
  elements.blink.addEventListener("click", function () {
    elements.blink.textContent = window.CrowdmapReviewMap.toggleBlink()
      ? "Stop blinking"
      : "Blink candidate";
  });
  elements.showAllDetails.addEventListener("click", function () {
    elements.roomDiffDetails.hidden = !elements.roomDiffDetails.hidden;
    elements.showAllDetails.textContent = elements.roomDiffDetails.hidden
      ? "Show all details"
      : "Hide details";
  });
  window.addEventListener("crowdmapreview:roomselect", function (event) {
    renderRoomDiff(event.detail.roomId);
  });
  elements.apply.addEventListener("click", applyUpdate);
  loadChanges().then(function () {
    window.CrowdmapReviewMap.show([], [], undefined);
  });
})();
