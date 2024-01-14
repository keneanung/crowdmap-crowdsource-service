export type ChangeType =
  | "room-name"
  | "modify-exit"
  | "modify-special-exit"
  | "lock-special-exit"
  | "unlock-special-exit"
  | "delete-special-exit"
  | "create-room"
  | "set-room-coordinates"
  | "create-area"
  | "set-room-area";

const calculateNewAreaSize = (
  map: Mudlet.MudletMap,
  area: MudletArea,
) => {
  const areaRooms = area.rooms.map((roomNumber) => map.rooms[roomNumber]);
  const xCoordinates = new Set(areaRooms.map((room) => room.x));
  const yCoordinates = new Set(areaRooms.map((room) => room.y));
  const zCoordinates = new Set(areaRooms.map((room) => room.z))
  area.max_x = Math.max(...xCoordinates);
  area.max_y = Math.max(...yCoordinates);
  area.max_z = Math.max(...zCoordinates);
  area.min_x = Math.min(...xCoordinates);
  area.min_y = Math.min(...yCoordinates);
  area.min_z = Math.min(...zCoordinates);
  for (const z of zCoordinates) {
    if (!area.zLevels.includes(z)) {
      area.zLevels.push(z);
      area.zLevels.sort();
    }
    const roomsOnThisZLevel = areaRooms.filter((room) => room.z === z);
    const xFOrZ = roomsOnThisZLevel.map((room) => room.x);
    const yFOrZ = roomsOnThisZLevel.map((room) => room.y);
    area.xmaxForZ[z] = Math.max(...xFOrZ);
    area.ymaxForZ[z] = Math.max(...yFOrZ);
    area.xminForZ[z] = Math.min(...xFOrZ);
    area.yminForZ[z] = Math.min(...yFOrZ);
  }
};

export abstract class ChangeBase<T extends ChangeBase<T>> {
  type!: ChangeType;
  reporters = new Set<string>();
  changeId?: number;

  constructor(reporters: string[], changeId?: number) {
    reporters.forEach((reporter) => this.reporters.add(reporter));
    this.changeId = changeId;
  }

  public abstract apply(map: Mudlet.MudletMap): void;
  public abstract getIdentifyingParts(): Omit<
    T,
    "reporters" | "changeId" | "apply" | "getIdentifyingParts"
  >;
}

export class CreateArea extends ChangeBase<CreateArea> {
  type: ChangeType = "create-area";
  name: string;
  areaId: number;

  constructor(name: string, areaId: number, reporters: string[], changeId?: number) {
    super(reporters, changeId);
    this.name = name;
    this.areaId = areaId;
  }

  public apply(map: Mudlet.MudletMap): void {
    for (const area of Object.values(map.areaNames)) {
      if (area === this.name || map.areaNames[this.areaId]) {
        // if the area already exists, make this a no-op
        return;
      }
    }
    map.areas[this.areaId] = {
      rooms: [],
      userData: {},
      zLevels: [],
      mAreaExits: [],
      gridMode: false,
      max_x: 0,
      max_y: 0,
      max_z: 0,
      min_x: 0,
      min_y: 0,
      min_z: 0,
      span: [],
      xmaxForZ: {},
      ymaxForZ: {},
      xminForZ: {},
      yminForZ: {},
      pos: [],
      isZone: false,
      zoneAreaRef: 0,
    };
    map.areaNames[this.areaId] = this.name;
  }

  public getIdentifyingParts() {
    return {
      name: this.name,
      type: this.type,
      areaId: this.areaId,
    };
  }
}

export abstract class RoomChangeBase<
  T extends RoomChangeBase<T>,
> extends ChangeBase<T> {
  roomNumber: number;

  constructor(roomNumber: number, reporters: string[], changeId?: number) {
    super(reporters, changeId);
    this.roomNumber = roomNumber;
  }
}

export class ChangeRoomName extends RoomChangeBase<ChangeRoomName> {
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

export class ModifyRoomExit extends RoomChangeBase<ModifyRoomExit> {
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

export class ModifySpecialExit extends RoomChangeBase<ModifySpecialExit> {
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

export class LockSpecialExit extends RoomChangeBase<LockSpecialExit> {
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

export class UnlockSpecialExit extends RoomChangeBase<UnlockSpecialExit> {
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

export class DeleteSpecialExit extends RoomChangeBase<DeleteSpecialExit> {
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

export class CreateRoom extends RoomChangeBase<CreateRoom> {
  type: ChangeType = "create-room";

  public apply(map: Mudlet.MudletMap): void {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (map.rooms[this.roomNumber]) {
      // if the room already exists, make this a no-op
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

export class SetRoomCoordinates extends RoomChangeBase<SetRoomCoordinates> {
  type: ChangeType = "set-room-coordinates";
  x: number;
  y: number;
  z: number;

  constructor(
    roomNumber: number,
    reporters: string[],
    x: number,
    y: number,
    z: number,
    changeId?: number,
  ) {
    super(roomNumber, reporters, changeId);
    this.x = x;
    this.y = y;
    this.z = z;
  }

  public apply(map: Mudlet.MudletMap): void {
    const room = map.rooms[this.roomNumber];
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!room) {
      // if the room does not exist for some reason, make this a no-op
      return;
    }
    room.x = this.x;
    room.y = this.y;
    room.z = this.z;
    // This may not be strictly necessary due to the way the Mudlet importer is written,
    // but let's be nice and make sure the provided data is accurate.
    calculateNewAreaSize(map, map.areas[room.area]);
  }

  public getIdentifyingParts() {
    return {
      type: this.type,
      roomNumber: this.roomNumber,
      x: this.x,
      y: this.y,
      z: this.z,
    };
  }
}

export class SetRoomArea extends RoomChangeBase<SetRoomArea> {
  type: ChangeType = "set-room-area";
  areaId: number;

  constructor(
    roomNumber: number,
    reporters: string[],
    areaId: number,
    changeId?: number,
  ) {
    super(roomNumber, reporters, changeId);
    this.areaId = areaId;
  }

  public apply(map: Mudlet.MudletMap): void {
    const room = map.rooms[this.roomNumber];
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!room) {
      // if the room does not exist for some reason, make this a no-op
      return;
    }
    const oldArea = map.areas[room.area];
    const newArea = map.areas[this.areaId];
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!newArea || oldArea === newArea) {
      // if the area is already the same, make this a no-op
      return;
    }
    oldArea.rooms = oldArea.rooms.filter((roomNumber) => roomNumber !== this.roomNumber);
    newArea.rooms.push(this.roomNumber);
    room.area = this.areaId;
    calculateNewAreaSize(map, oldArea);
    calculateNewAreaSize(map, newArea);
  }

  public getIdentifyingParts() {
    return {
      type: this.type,
      roomNumber: this.roomNumber,
      areaId: this.areaId,
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
  | CreateRoom
  | SetRoomCoordinates
  | CreateArea
  | SetRoomArea;

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
