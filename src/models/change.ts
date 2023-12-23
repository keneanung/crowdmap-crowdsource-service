export type ChangeType = "room-name" | "add-exit";

export interface ChangeBase {
  type: ChangeType;
  /**
   * @isInt room number must be an integer
   */
  roomNumber: number;
}

export interface ChangeRoomName extends ChangeBase {
  type: "room-name";
  name: string;
}

export interface AddRoomExit extends ChangeBase {
  type: "add-exit";
  direction:
    | "north"
    | "south"
    | "east"
    | "west"
    | "up"
    | "down"
    | "northeast"
    | "northwest"
    | "southeast"
    | "southwest"
    | "in"
    | "out";
  /**
   * @isInt destination must be an integer
   */
  destination: number;
}

export type Change = ChangeRoomName | AddRoomExit;
