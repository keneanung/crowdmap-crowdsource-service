export type ChangeType = "room-name" | "add-exit" | "modify-special-exit";

export abstract class ChangeBase<T extends ChangeBase<T>> {
  type!: ChangeType;
  roomNumber: number;
  reporters = new Set<string>();
  changeId?: number;

  constructor(roomNumber: number, reporters: string[], changeId?: number) {
    this.roomNumber = roomNumber;
    reporters.forEach((reporter) => this.reporters.add(reporter));
    this.changeId = changeId;
  }

  public abstract apply(room: MudletRoom): void;
  public abstract getIdentifyingParts(): Omit<
    T,
    "reporters" | "_id" | "changeId" | "apply" | "getIdentifyingParts"
  >;
}

export class ChangeRoomName extends ChangeBase<ChangeRoomName> {
  type: ChangeType = "room-name";
  name: string;

  constructor(
    roomNumber: number,
    reporters: string[],
    name: string,
    changeId?: number,
  ) {
    super(roomNumber, reporters, changeId);
    this.name = name;
  }

  public apply(room: MudletRoom): void {
    room.name = this.name;
  }

  public getIdentifyingParts() {
    return {
      name: this.name,
      type: this.type,
      roomNumber: this.roomNumber,
    };
  }
}

export class AddRoomExit extends ChangeBase<AddRoomExit> {
  type: ChangeType = "add-exit";
  direction: Direction;
  destination: number;

  constructor(
    roomNumber: number,
    reporters: string[],
    direction: Direction,
    destination: number,
    changeId?: number,
  ) {
    super(roomNumber, reporters, changeId);
    this.direction = direction;
    this.destination = destination;
  }

  public apply(room: MudletRoom): void {
    room[this.direction] = this.destination;
  }
  public getIdentifyingParts() {
    return {
      type: this.type,
      roomNumber: this.roomNumber,
      direction: this.direction,
      destination: this.destination,
    };
  }
}

export class ModifySpecialExit extends ChangeBase<ModifySpecialExit> {
  type: ChangeType = "modify-special-exit";
  exitCommand: string;
  destination: number;

  constructor(
    roomNumber: number,
    reporters: string[],
    exitCommand: string,
    destination: number,
    changeId?: number,
  ) {
    super(roomNumber, reporters, changeId);
    this.exitCommand = exitCommand;
    this.destination = destination;
  }

  public apply(room: MudletRoom): void {
    room.mSpecialExits[this.exitCommand] = this.destination;
  }
  public getIdentifyingParts() {
    return {
      type: this.type,
      roomNumber: this.roomNumber,
      exitCommand: this.exitCommand,
      destination: this.destination,
    };
  }
}

export type Change = ChangeRoomName | AddRoomExit | ModifySpecialExit;

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
