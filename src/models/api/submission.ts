import { ChangeType, Direction } from "./common";

export interface ChangeBaseSubmission {
  type: ChangeType;
  roomNumber: number;
  reporter: string;
}

export interface ChangeRoomNameSubmission extends ChangeBaseSubmission {
  type: "room-name";
  name: string;
}

export interface AddRoomExitSubmission extends ChangeBaseSubmission {
  type: "add-exit";
  direction: Direction;
  destination: number;
}

export type ChangeSubmission = ChangeRoomNameSubmission | AddRoomExitSubmission;
