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

export type ChangeResponse = ChangeRoomNameResponse | AddRoomExitResponse;
