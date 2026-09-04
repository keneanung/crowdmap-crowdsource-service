import {
  Change,
  ChangeRoomName,
  ChangeType,
  CreateArea,
  CreateRoom,
  DeleteExit,
  DeleteRoomUserData,
  DeleteSpecialExit,
  LockSpecialExit,
  ModifyExitWeight,
  ModifyRoomExit,
  ModifyRoomUserData,
  ModifySpecialExit,
  ModifySpecialExitWeight,
  SetRoomArea,
  SetRoomCoordinates,
  SetRoomEnvironment,
  UnlockSpecialExit,
} from "./change";

type DataProperties<T extends Change> = T extends Change
  ? Omit<T, "apply" | "getIdentifyingParts">
  : never;

export type MapWorkerChange = DataProperties<Change>;

const changePrototypes: Record<ChangeType, object> = {
  "room-name": ChangeRoomName.prototype,
  "modify-exit": ModifyRoomExit.prototype,
  "modify-special-exit": ModifySpecialExit.prototype,
  "lock-special-exit": LockSpecialExit.prototype,
  "unlock-special-exit": UnlockSpecialExit.prototype,
  "delete-special-exit": DeleteSpecialExit.prototype,
  "create-room": CreateRoom.prototype,
  "set-room-coordinates": SetRoomCoordinates.prototype,
  "create-area": CreateArea.prototype,
  "set-room-area": SetRoomArea.prototype,
  "delete-exit": DeleteExit.prototype,
  "modify-exit-weight": ModifyExitWeight.prototype,
  "modify-special-exit-weight": ModifySpecialExitWeight.prototype,
  "set-room-environment": SetRoomEnvironment.prototype,
  "modify-room-user-data": ModifyRoomUserData.prototype,
  "delete-room-user-data": DeleteRoomUserData.prototype,
};

// Worker construction uses structured cloning: transferable data such as Set is
// preserved, while the custom Change prototype is intentionally discarded.
export const changeBusinessToWorker = (change: Change): MapWorkerChange =>
  change;

export const changeWorkerToBusiness = (change: MapWorkerChange): Change => {
  Object.setPrototypeOf(change, changePrototypes[change.type]);
  return change as Change;
};

export interface MapWorkerRequest {
  changes: MapWorkerChange[];
  mapFile: string;
  operation: "binary" | "json" | "renderer" | "validate";
  outputFile?: string;
}

export interface MapWorkerResponse {
  content?: string;
}
