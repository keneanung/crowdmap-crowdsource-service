import { ChangeType, Direction } from "./common";

export interface ChangeBaseResponse {
  type: ChangeType;
  roomNumber: number;
  reporters: number;
}

export interface ChangeRoomNameResponse extends ChangeBaseResponse {
  type: "room-name";
  name: string;
}

export interface AddRoomExitResponse extends ChangeBaseResponse {
  type: "add-exit";
  direction: Direction;
  destination: number;
}

export interface ModifySpecialExitResponse extends ChangeBaseResponse {
  type: "modify-special-exit";
  exitCommand: string;
  destination: number;
}

export interface LockSpecialExitResponse extends ChangeBaseResponse {
  type: "lock-special-exit";
  exitCommand: string;
  destination: number;
}

export interface UnlockSpecialExitResponse extends ChangeBaseResponse {
  type: "unlock-special-exit";
  exitCommand: string;
  destination: number;
}

export interface DeleteSpecialExitResponse extends ChangeBaseResponse {
  type: "delete-special-exit";
  exitCommand: string;
}

export type ChangeResponse =
  | ChangeRoomNameResponse
  | AddRoomExitResponse
  | ModifySpecialExitResponse
  | LockSpecialExitResponse
  | UnlockSpecialExitResponse
  | DeleteSpecialExitResponse;
