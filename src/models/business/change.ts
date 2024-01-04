export type ChangeType =
  | "room-name"
  | "modify-exit"
  | "modify-special-exit"
  | "lock-special-exit"
  | "unlock-special-exit"
  | "delete-special-exit"
  | "create-room";

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

  public abstract apply(map: Mudlet.MudletMap): void;
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

  public apply(map: Mudlet.MudletMap): void {
    const room = map.rooms[this.roomNumber];
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!room) {
      // if the room does not exist for some reason, make this a no-op
      return;
    }
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

export class ModifyRoomExit extends ChangeBase<ModifyRoomExit> {
  type: ChangeType = "modify-exit";
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

  public apply(map: Mudlet.MudletMap): void {
    const room = map.rooms[this.roomNumber];
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!room) {
      // if the room does not exist for some reason, make this a no-op
      return;
    }
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

  public apply(map: Mudlet.MudletMap): void {
    const room = map.rooms[this.roomNumber];
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!room) {
      // if the room does not exist for some reason, make this a no-op
      return;
    }
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

export class LockSpecialExit extends ChangeBase<LockSpecialExit> {
  type: ChangeType = "lock-special-exit";
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

  public apply(map: Mudlet.MudletMap): void {
    const room = map.rooms[this.roomNumber];
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!room) {
      // if the room does not exist for some reason, make this a no-op
      return;
    }
    room.mSpecialExitLocks.push(this.destination);
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

export class UnlockSpecialExit extends ChangeBase<UnlockSpecialExit> {
  type: ChangeType = "unlock-special-exit";
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

  public apply(map: Mudlet.MudletMap): void {
    const room = map.rooms[this.roomNumber];
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!room) {
      // if the room does not exist for some reason, make this a no-op
      return;
    }
    room.mSpecialExitLocks = room.mSpecialExitLocks.filter(
      (roomNumber) => roomNumber !== this.destination,
    );
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

export class DeleteSpecialExit extends ChangeBase<DeleteSpecialExit> {
  type: ChangeType = "delete-special-exit";
  exitCommand: string;

  constructor(
    roomNumber: number,
    reporters: string[],
    exitCommand: string,
    changeId?: number,
  ) {
    super(roomNumber, reporters, changeId);
    this.exitCommand = exitCommand;
  }

  public apply(map: Mudlet.MudletMap): void {
    const room = map.rooms[this.roomNumber];
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!room) {
      // if the room does not exist for some reason, make this a no-op
      return;
    }
    if (Object.hasOwn(room.mSpecialExits, this.exitCommand)) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete room.mSpecialExits[this.exitCommand];
    }
  }
  public getIdentifyingParts() {
    return {
      type: this.type,
      roomNumber: this.roomNumber,
      exitCommand: this.exitCommand,
    };
  }
}

export class CreateRoom extends ChangeBase<CreateRoom> {
  type: ChangeType = "create-room";

  public apply(map: Mudlet.MudletMap): void {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (map.rooms[this.roomNumber]) {
      // if the room already exists, don't make this a no-op
      return;
    }
    map.rooms[this.roomNumber] = {
      name: "",
      north: -1,
      south: -1,
      east: -1,
      west: -1,
      up: -1,
      down: -1,
      northeast: -1,
      northwest: -1,
      southeast: -1,
      southwest: -1,
      in: -1,
      out: -1,
      mSpecialExits: {},
      mSpecialExitLocks: [],
      area: -1,
      x: 0,
      y: 0,
      z: 0,
      environment: -1,
      weight: 0,
      isLocked: false,
      symbol: "",
      customLines: {},
      customLinesArrow: {},
      customLinesColor: {},
      customLinesStyle: {},
      doors: {},
      exitLocks: [],
      exitWeights: {},
      stubs: [],
      userData: {},
    };
    map.areas[-1].rooms.push(this.roomNumber);
  }
  public getIdentifyingParts() {
    return {
      type: this.type,
      roomNumber: this.roomNumber,
    };
  }
}

export type Change =
  | ChangeRoomName
  | ModifyRoomExit
  | ModifySpecialExit
  | LockSpecialExit
  | UnlockSpecialExit
  | DeleteSpecialExit
  | CreateRoom;

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
