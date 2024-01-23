import { ChangeType, Direction } from "./common";

export interface ChangeBaseResponse {
  type: ChangeType;
  reporters: number;
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

export interface ModifySpecialExitWeightResponse
  extends RoomChangeBaseResponse {
  type: "modify-special-exit-weight";
  exitCommand: string;
  weight: number;
}

export interface SetRoomEnvironmentResponse extends RoomChangeBaseResponse {
  type: "set-room-environment";
  environmentId: number;
}

export type ChangeResponse =
  | ChangeRoomNameResponse
  | ModifyRoomExitResponse
  | ModifySpecialExitResponse
  | LockSpecialExitResponse
  | UnlockSpecialExitResponse
  | DeleteSpecialExitResponse
  | CreateRoomResponse
  | SetRoomCoordinatesResponse
  | CreateAreaResponse
  | SetRoomAreaResponse
  | DeleteExitResponse
  | ModifyExitWeightResponse
  | ModifySpecialExitWeightResponse
  | SetRoomEnvironmentResponse;
