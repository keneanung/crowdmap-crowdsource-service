export type ChangeType = "room-name" | "add-exit";

export abstract class ChangeBase {
  type: ChangeType;
  /**
   * @isInt room number must be an integer
   */
  roomNumber: number;
  reporters: string[];

  constructor(type: ChangeType, roomNumber: number, reporters: string[]) {
    this.type = type;
    this.roomNumber = roomNumber;
    this.reporters = reporters;
  }

  public abstract apply(room: MudletRoom): void;
}

export class ChangeRoomName extends ChangeBase {
  name: string;

  constructor(roomNumber: number, reporters: string[], name: string) {
    super("room-name", roomNumber, reporters);
    this.name = name;
  }

  public apply(room: MudletRoom): void {
    room.name = this.name;
  }
}

export class AddRoomExit extends ChangeBase {
  direction: Direction;

  /**
   * @isInt destination must be an integer
   */
  destination: number;

  /**
   *
   */
  constructor(
    roomNumber: number,
    reporters: string[],
    direction: Direction,
    destination: number,
  ) {
    super("add-exit", roomNumber, reporters);
    this.direction = direction;
    this.destination = destination;
  }

  public apply(room: MudletRoom): void {
    room[this.direction] = this.destination;
  }
}

export type Change = ChangeRoomName | AddRoomExit;

export type Direction =
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
