import {
  Change,
  ChangeRoomName,
  CreateArea,
  CreateRoom,
  DeleteArea,
  DeleteExit,
  DeleteMapLabel,
  DeleteMapUserData,
  DeleteRoom,
  DeleteRoomUserData,
  DeleteSpecialExit,
  LockSpecialExit,
  ModifyExitWeight,
  ModifyRoomExit,
  ModifyRoomUserData,
  ModifySpecialExit,
  ModifySpecialExitWeight,
  RenameArea,
  SetExitDoor,
  SetMapLabel,
  SetMapUserData,
  SetRoomArea,
  SetRoomCoordinates,
  SetRoomEnvironment,
  SetRoomHash,
  SetRoomSymbol,
  SetRoomWeight,
  UnlockSpecialExit,
} from "./change.js";

export interface ChangeReconciliation {
  changeId: string;
  reason?: string;
  status: "pending" | "resolved" | "upstream-conflict";
}

const lookup = <T>(record: Record<string | number, T>, key: string | number) =>
  (record as Partial<Record<string | number, T>>)[key];

const room = (
  map: Mudlet.MudletMap,
  roomNumber: number,
): MudletRoom | undefined => lookup(map.rooms, roomNumber);

const roomHash = (map: Mudlet.MudletMap, roomNumber: number): string | null => {
  if (!room(map, roomNumber)) return null;
  return (
    Object.entries(map.mpRoomDbHashToRoomId).find(
      ([, mappedRoomNumber]) => mappedRoomNumber === roomNumber,
    )?.[0] ?? null
  );
};

export const changeTargetState = (
  change: Change,
  map: Mudlet.MudletMap,
): unknown => {
  switch (change.type) {
    case "create-room":
    case "delete-room":
      return Boolean(room(map, (change as CreateRoom | DeleteRoom).roomNumber));
    case "create-area": {
      const typed = change as CreateArea;
      return {
        exists: Boolean(lookup(map.areas, typed.areaId)),
        name: lookup(map.areaNames, typed.areaId) ?? null,
      };
    }
    case "rename-area":
      return lookup(map.areaNames, (change as RenameArea).areaId) ?? null;
    case "delete-area":
      return Boolean(lookup(map.areas, (change as DeleteArea).areaId));
    case "room-name": {
      const typed = change as ChangeRoomName;
      return room(map, typed.roomNumber)?.name ?? null;
    }
    case "set-room-coordinates": {
      const typed = change as SetRoomCoordinates;
      const target = room(map, typed.roomNumber);
      return target ? [target.x, target.y, target.z] : null;
    }
    case "set-room-area": {
      const typed = change as SetRoomArea;
      return room(map, typed.roomNumber)?.area ?? null;
    }
    case "set-room-environment": {
      const typed = change as SetRoomEnvironment;
      return room(map, typed.roomNumber)?.environment ?? null;
    }
    case "set-room-weight": {
      const typed = change as SetRoomWeight;
      return room(map, typed.roomNumber)?.weight ?? null;
    }
    case "set-room-symbol": {
      const typed = change as SetRoomSymbol;
      return room(map, typed.roomNumber)?.symbol ?? null;
    }
    case "set-room-hash": {
      const typed = change as SetRoomHash;
      return roomHash(map, typed.roomNumber);
    }
    case "modify-exit":
    case "delete-exit": {
      const typed = change as ModifyRoomExit | DeleteExit;
      const target = room(map, typed.roomNumber);
      return target ? target[typed.direction] : null;
    }
    case "modify-exit-weight": {
      const typed = change as ModifyExitWeight;
      return (
        lookup(
          room(map, typed.roomNumber)?.exitWeights ?? {},
          typed.direction,
        ) ?? 0
      );
    }
    case "modify-special-exit":
    case "delete-special-exit": {
      const typed = change as ModifySpecialExit | DeleteSpecialExit;
      return (
        lookup(
          room(map, typed.roomNumber)?.mSpecialExits ?? {},
          typed.exitCommand,
        ) ?? null
      );
    }
    case "modify-special-exit-weight": {
      const typed = change as ModifySpecialExitWeight;
      return (
        lookup(
          room(map, typed.roomNumber)?.exitWeights ?? {},
          typed.exitCommand,
        ) ?? null
      );
    }
    case "lock-special-exit":
    case "unlock-special-exit": {
      const typed = change as LockSpecialExit | UnlockSpecialExit;
      const target = room(map, typed.roomNumber);
      return target
        ? target.mSpecialExitLocks.includes(typed.exitCommand)
        : null;
    }
    case "modify-room-user-data":
    case "delete-room-user-data": {
      const typed = change as ModifyRoomUserData | DeleteRoomUserData;
      return (
        lookup(room(map, typed.roomNumber)?.userData ?? {}, typed.key) ?? null
      );
    }
    case "set-exit-door": {
      const typed = change as SetExitDoor;
      return (
        lookup(room(map, typed.roomNumber)?.doors ?? {}, typed.direction) ?? 0
      );
    }
    case "set-map-user-data":
    case "delete-map-user-data": {
      const typed = change as SetMapUserData | DeleteMapUserData;
      return lookup(map.mUserData, typed.key) ?? null;
    }
    case "set-map-label":
    case "delete-map-label": {
      const typed = change as SetMapLabel | DeleteMapLabel;
      return (
        lookup(map.labels, typed.areaId)?.find(
          ({ id }) => id === typed.labelId,
        ) ?? null
      );
    }
  }
};

export const desiredChangeState = (change: Change): unknown => {
  switch (change.type) {
    case "create-room":
      return true;
    case "delete-room":
    case "delete-area":
      return false;
    case "create-area": {
      const typed = change as CreateArea;
      return { exists: true, name: typed.name };
    }
    case "rename-area":
      return (change as RenameArea).name;
    case "room-name":
      return (change as ChangeRoomName).name;
    case "set-room-coordinates": {
      const typed = change as SetRoomCoordinates;
      return [typed.x, typed.y, typed.z];
    }
    case "set-room-area":
      return (change as SetRoomArea).areaId;
    case "set-room-environment":
      return (change as SetRoomEnvironment).environmentId;
    case "set-room-weight":
      return (change as SetRoomWeight).weight;
    case "set-room-symbol":
      return (change as SetRoomSymbol).symbol;
    case "set-room-hash":
      return (change as SetRoomHash).hash;
    case "modify-exit":
      return (change as ModifyRoomExit).destination;
    case "delete-exit":
      return -1;
    case "modify-exit-weight":
      return (change as ModifyExitWeight).weight;
    case "modify-special-exit":
      return (change as ModifySpecialExit).destination;
    case "delete-special-exit":
      return null;
    case "modify-special-exit-weight":
      return (change as ModifySpecialExitWeight).weight;
    case "lock-special-exit":
      return true;
    case "unlock-special-exit":
      return false;
    case "modify-room-user-data":
      return (change as ModifyRoomUserData).value;
    case "delete-room-user-data":
      return null;
    case "set-exit-door":
      return (change as SetExitDoor).status;
    case "set-map-user-data":
      return (change as SetMapUserData).value;
    case "delete-map-user-data":
    case "delete-map-label":
      return null;
    case "set-map-label": {
      const typed = change as SetMapLabel;
      return {
        id: typed.labelId,
        labelId: typed.labelId,
        areaId: typed.areaId,
        pos: [typed.label.x, typed.label.y, typed.label.z],
        size: [typed.label.width, typed.label.height],
        text: typed.label.text,
        fgColor: { spec: 1, pad: 0, ...typed.label.fgColor },
        bgColor: { spec: 1, pad: 0, ...typed.label.bgColor },
        pixMap: "",
        noScaling: typed.label.noScaling,
        showOnTop: typed.label.showOnTop,
      };
    }
  }
};

const sameState = (left: unknown, right: unknown): boolean =>
  JSON.stringify(left) === JSON.stringify(right);

const describe = (value: unknown): string => JSON.stringify(value);

export const reconcileChange = (
  change: Change,
  oldMap: Mudlet.MudletMap,
  newMap: Mudlet.MudletMap,
): ChangeReconciliation => {
  if (change.type === "modify-exit-weight") {
    const typed = change as ModifyExitWeight;
    const targetRoom = room(newMap, typed.roomNumber);
    if (!targetRoom || targetRoom[typed.direction] === -1) {
      // A weight has no meaning after its room or exit is removed. Treat the
      // report as obsolete instead of retaining an unresolvable conflict.
      return { changeId: change.changeId, status: "resolved" };
    }
  }
  const oldState = changeTargetState(change, oldMap);
  const newState = changeTargetState(change, newMap);
  const desired = desiredChangeState(change);
  if (sameState(newState, desired)) {
    return { changeId: change.changeId, status: "resolved" };
  }
  if (!sameState(oldState, newState)) {
    return {
      changeId: change.changeId,
      reason: `Upstream changed this target from ${describe(oldState)} to ${describe(newState)}; the report expects ${describe(desired)}.`,
      status: "upstream-conflict",
    };
  }
  return { changeId: change.changeId, status: "pending" };
};
