export type ChangeType = "room-name" | "add-exit";

export abstract class ChangeBase {
  type!: ChangeType;
  roomNumber: number;
  reporters: string[];

  constructor(roomNumber: number, reporters: string[]) {
    this.roomNumber = roomNumber;
    this.reporters = reporters;
  }

  public abstract apply(room: MudletRoom): void;
}

export class ChangeRoomName extends ChangeBase {
  type: ChangeType = "room-name";
  name: string;

  constructor(roomNumber: number, reporters: string[], name: string) {
    super(roomNumber, reporters);
    this.name = name;
  }

  public apply(room: MudletRoom): void {
    room.name = this.name;
  }
}

export class AddRoomExit extends ChangeBase {
  type: ChangeType = "add-exit";
  direction: Direction;
  destination: number;

  constructor(
    roomNumber: number,
    reporters: string[],
    direction: Direction,
    destination: number,
  ) {
    super(roomNumber, reporters);
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
