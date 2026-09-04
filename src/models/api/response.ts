import { ChangeType, Direction } from "./common.js";

export interface ChangeBaseResponse {
  type: ChangeType;
  reporters: number;
  changeId: string;
  upstreamConflict?: {
    baselineVersion: string;
    reason: string;
  };
}

export interface CreateAreaResponse extends ChangeBaseResponse {
  type: "create-area";
  name: string;
  areaId: number;
}

export interface RoomChangeBaseResponse extends ChangeBaseResponse {
  roomNumber: number;
}

export interface ChangeRoomNameResponse extends RoomChangeBaseResponse {
  type: "room-name";
  name: string;
}

export interface ModifyRoomExitResponse extends RoomChangeBaseResponse {
  type: "modify-exit";
  direction: Direction;
  destination: number;
}

export interface ModifySpecialExitResponse extends RoomChangeBaseResponse {
  type: "modify-special-exit";
  exitCommand: string;
  destination: number;
}

export interface LockSpecialExitResponse extends RoomChangeBaseResponse {
  type: "lock-special-exit";
  exitCommand: string;
  destination: number;
}

export interface UnlockSpecialExitResponse extends RoomChangeBaseResponse {
  type: "unlock-special-exit";
  exitCommand: string;
  destination: number;
}

export interface DeleteSpecialExitResponse extends RoomChangeBaseResponse {
  type: "delete-special-exit";
  exitCommand: string;
}

export interface CreateRoomResponse extends RoomChangeBaseResponse {
  type: "create-room";
}

export interface DeleteRoomResponse extends RoomChangeBaseResponse {
  type: "delete-room";
}

export interface RenameAreaResponse extends ChangeBaseResponse {
  type: "rename-area";
  areaId: number;
  name: string;
}

export interface DeleteAreaResponse extends ChangeBaseResponse {
  type: "delete-area";
  areaId: number;
}

export interface SetRoomWeightResponse extends RoomChangeBaseResponse {
  type: "set-room-weight";
  weight: number;
}

export interface SetRoomSymbolResponse extends RoomChangeBaseResponse {
  type: "set-room-symbol";
  symbol: string;
}

export interface SetRoomHashResponse extends RoomChangeBaseResponse {
  type: "set-room-hash";
  hash: string;
}

export interface SetRoomCoordinatesResponse extends RoomChangeBaseResponse {
  type: "set-room-coordinates";
  x: number;
  y: number;
  z: number;
}

export interface SetRoomAreaResponse extends RoomChangeBaseResponse {
  type: "set-room-area";
  areaId: number;
}

export interface DeleteExitResponse extends RoomChangeBaseResponse {
  type: "delete-exit";
  direction: Direction;
}

export interface ModifyExitWeightResponse extends RoomChangeBaseResponse {
  type: "modify-exit-weight";
  direction: Direction;
  weight: number;
}

export interface ModifySpecialExitWeightResponse extends RoomChangeBaseResponse {
  type: "modify-special-exit-weight";
  exitCommand: string;
  weight: number;
}

export interface SetRoomEnvironmentResponse extends RoomChangeBaseResponse {
  type: "set-room-environment";
  environmentId: number;
}

export interface ModifyRoomUserDataResponse extends RoomChangeBaseResponse {
  type: "modify-room-user-data";
  key: string;
  value: string;
}

export interface DeleteRoomUserDataResponse extends RoomChangeBaseResponse {
  type: "delete-room-user-data";
  key: string;
}

export interface ReconciliationResponse {
  automaticallyResolved: number;
  upstreamConflicts: number;
}

export type ChangeResponse =
  | ChangeRoomNameResponse
  | ModifyRoomExitResponse
  | ModifySpecialExitResponse
  | LockSpecialExitResponse
  | UnlockSpecialExitResponse
  | DeleteSpecialExitResponse
  | CreateRoomResponse
  | DeleteRoomResponse
  | SetRoomCoordinatesResponse
  | CreateAreaResponse
  | RenameAreaResponse
  | DeleteAreaResponse
  | SetRoomAreaResponse
  | SetRoomWeightResponse
  | SetRoomSymbolResponse
  | SetRoomHashResponse
  | DeleteExitResponse
  | ModifyExitWeightResponse
  | ModifySpecialExitWeightResponse
  | SetRoomEnvironmentResponse
  | ModifyRoomUserDataResponse
  | DeleteRoomUserDataResponse;
