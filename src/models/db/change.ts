import { ObjectId } from "mongodb";
import {
  Change as ChangeBusiness,
  ChangeRoomName as ChangeRoomNameBusiness,
  ChangeType,
  CreateArea as CreateAreaBusiness,
  CreateRoom as CreateRoomBusiness,
  DeleteSpecialExit as DeleteSpecialExitBusiness,
  Direction,
  LockSpecialExit as LockSpecialExitBusiness,
  ModifyRoomExit as ModifyRoomExitBusiness,
  ModifySpecialExit as ModifySpecialExitBusiness,
  SetRoomCoordinates as SetRoomCoordinatesBusiness,
  UnlockSpecialExit as UnlockSpecialExitBusiness,
} from "../business/change";

export interface ChangeBase {
  _id?: ObjectId;
  type: ChangeType;
  reporters: string[];
  numberOfReporters: number;
  changeId?: number;
}

export interface RoomChangeBase extends ChangeBase {
  roomNumber: number;
}

export interface ChangeRoomName extends RoomChangeBase {
  type: "room-name";
  name: string;
}

export interface ModifyRoomExit extends RoomChangeBase {
  type: "modify-exit";
  direction: Direction;
  destination: number;
}

export interface ModifySpecialExit extends RoomChangeBase {
  type: "modify-special-exit";
  exitCommand: string;
  destination: number;
}

export interface LockSpecialExit extends RoomChangeBase {
  type: "lock-special-exit";
  exitCommand: string;
  destination: number;
}

export interface UnlockSpecialExit extends RoomChangeBase {
  type: "unlock-special-exit";
  exitCommand: string;
  destination: number;
}

export interface DeleteSpecialExit extends RoomChangeBase {
  type: "delete-special-exit";
  exitCommand: string;
}

export interface CreateRoom extends RoomChangeBase {
  type: "create-room";
}

export interface SetRoomCoordinates extends RoomChangeBase {
  type: "set-room-coordinates";
  x: number;
  y: number;
  z: number;
}

export interface CreateArea extends ChangeBase {
  type: "create-area";
  name: string;
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
  | CreateArea;

export const roomNameBusinessToDb = (
  change: ChangeRoomNameBusiness,
): ChangeRoomName => {
  return {
    type: "room-name",
    roomNumber: change.roomNumber,
    reporters: Array.from(change.reporters),
    numberOfReporters: change.reporters.size,
    name: change.name,
    changeId: change.changeId,
  };
};

export const roomNameDbToBusiness = (
  change: ChangeRoomName,
): ChangeRoomNameBusiness => {
  return new ChangeRoomNameBusiness(
    change.roomNumber,
    change.reporters,
    change.name,
    change.changeId,
  );
};

export const modifyExitBusinessToDb = (
  change: ModifyRoomExitBusiness,
): ModifyRoomExit => {
  return {
    type: "modify-exit",
    roomNumber: change.roomNumber,
    reporters: Array.from(change.reporters),
    numberOfReporters: change.reporters.size,
    direction: change.direction,
    destination: change.destination,
    changeId: change.changeId,
  };
};

export const modifyExitDbToBusiness = (
  change: ModifyRoomExit,
): ModifyRoomExitBusiness => {
  return new ModifyRoomExitBusiness(
    change.roomNumber,
    change.reporters,
    change.direction,
    change.destination,
    change.changeId,
  );
};

export const modifySpecialExitDbToBusiness = (
  change: ModifySpecialExit,
): ChangeBusiness => {
  return new ModifySpecialExitBusiness(
    change.roomNumber,
    change.reporters,
    change.exitCommand,
    change.destination,
    change.changeId,
  );
};

export const modifySpecialExitBusinessToDb = (
  change: ModifySpecialExitBusiness,
): ModifySpecialExit => {
  return {
    type: "modify-special-exit",
    roomNumber: change.roomNumber,
    reporters: Array.from(change.reporters),
    numberOfReporters: change.reporters.size,
    exitCommand: change.exitCommand,
    destination: change.destination,
    changeId: change.changeId,
  };
};

export const lockSpecialExitDbToBusiness = (
  change: LockSpecialExit,
): ChangeBusiness => {
  return new LockSpecialExitBusiness(
    change.roomNumber,
    change.reporters,
    change.exitCommand,
    change.destination,
    change.changeId,
  );
};

export const lockSpecialExitBusinessToDb = (
  change: LockSpecialExitBusiness,
): LockSpecialExit => {
  return {
    type: "lock-special-exit",
    roomNumber: change.roomNumber,
    reporters: Array.from(change.reporters),
    numberOfReporters: change.reporters.size,
    exitCommand: change.exitCommand,
    destination: change.destination,
    changeId: change.changeId,
  };
};

export const unlockSpecialExitDbToBusiness = (
  change: UnlockSpecialExit,
): ChangeBusiness => {
  return new UnlockSpecialExitBusiness(
    change.roomNumber,
    change.reporters,
    change.exitCommand,
    change.destination,
    change.changeId,
  );
};

export const unlockSpecialExitBusinessToDb = (
  change: UnlockSpecialExitBusiness,
): UnlockSpecialExit => {
  return {
    type: "unlock-special-exit",
    roomNumber: change.roomNumber,
    reporters: Array.from(change.reporters),
    numberOfReporters: change.reporters.size,
    exitCommand: change.exitCommand,
    destination: change.destination,
    changeId: change.changeId,
  };
};

export const deleteSpecialExitDbToBusiness = (
  change: DeleteSpecialExit,
): ChangeBusiness => {
  return new DeleteSpecialExitBusiness(
    change.roomNumber,
    change.reporters,
    change.exitCommand,
    change.changeId,
  );
};

export const deleteSpecialExitBusinessToDb = (
  change: DeleteSpecialExitBusiness,
): DeleteSpecialExit => {
  return {
    type: "delete-special-exit",
    roomNumber: change.roomNumber,
    reporters: Array.from(change.reporters),
    numberOfReporters: change.reporters.size,
    exitCommand: change.exitCommand,
    changeId: change.changeId,
  };
};

export const crreateRoomDbToBusiness = (change: CreateRoom): ChangeBusiness => {
  return new CreateRoomBusiness(
    change.roomNumber,
    change.reporters,
    change.changeId,
  );
};

export const createRoomBusinessToDb = (
  change: CreateRoomBusiness,
): CreateRoom => {
  return {
    type: "create-room",
    roomNumber: change.roomNumber,
    reporters: Array.from(change.reporters),
    numberOfReporters: change.reporters.size,
    changeId: change.changeId,
  };
};

export const setRoomCoordinatesDbToBusiness = (
  change: SetRoomCoordinates,
): ChangeBusiness => {
  return new SetRoomCoordinatesBusiness(
    change.roomNumber,
    change.reporters,
    change.x,
    change.y,
    change.z,
    change.changeId,
  );
};

export const setRoomCoordinatesBusinessToDb = (
  change: SetRoomCoordinatesBusiness,
): SetRoomCoordinates => {
  return {
    type: "set-room-coordinates",
    roomNumber: change.roomNumber,
    reporters: Array.from(change.reporters),
    numberOfReporters: change.reporters.size,
    x: change.x,
    y: change.y,
    z: change.z,
    changeId: change.changeId,
  };
};

export const createAreaDbToBusiness = (change: CreateArea): ChangeBusiness => {
  return new CreateAreaBusiness(change.name, change.reporters, change.changeId);
};

export const createAreaBusinessToDb = (
  change: CreateAreaBusiness,
): CreateArea => {
  return {
    type: "create-area",
    name: change.name,
    reporters: Array.from(change.reporters),
    numberOfReporters: change.reporters.size,
    changeId: change.changeId,
  };
};

export const changeBusinessToDb = (change: ChangeBusiness): Change => {
  switch (change.type) {
    case "room-name": {
      return roomNameBusinessToDb(change as ChangeRoomNameBusiness);
    }
    case "modify-exit": {
      return modifyExitBusinessToDb(change as ModifyRoomExitBusiness);
    }
    case "modify-special-exit": {
      return modifySpecialExitBusinessToDb(change as ModifySpecialExitBusiness);
    }
    case "lock-special-exit": {
      return lockSpecialExitBusinessToDb(change as LockSpecialExitBusiness);
    }
    case "unlock-special-exit": {
      return unlockSpecialExitBusinessToDb(change as UnlockSpecialExitBusiness);
    }
    case "delete-special-exit": {
      return deleteSpecialExitBusinessToDb(change as DeleteSpecialExitBusiness);
    }
    case "create-room": {
      return createRoomBusinessToDb(change as CreateRoomBusiness);
    }
    case "set-room-coordinates": {
      return setRoomCoordinatesBusinessToDb(
        change as SetRoomCoordinatesBusiness,
      );
    }
    case "create-area": {
      return createAreaBusinessToDb(change as CreateAreaBusiness);
    }
    default: {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      throw new Error(`Unknown change type: ${change.type}`);
    }
  }
};

export const changeDbToBusiness = (change: Change): ChangeBusiness => {
  switch (change.type) {
    case "room-name": {
      return roomNameDbToBusiness(change);
    }
    case "modify-exit": {
      return modifyExitDbToBusiness(change);
    }
    case "modify-special-exit": {
      return modifySpecialExitDbToBusiness(change);
    }
    case "lock-special-exit": {
      return lockSpecialExitDbToBusiness(change);
    }
    case "unlock-special-exit": {
      return unlockSpecialExitDbToBusiness(change);
    }
    case "delete-special-exit": {
      return deleteSpecialExitDbToBusiness(change);
    }
    case "create-room": {
      return crreateRoomDbToBusiness(change);
    }
    case "set-room-coordinates": {
      return setRoomCoordinatesDbToBusiness(change);
    }
    case "create-area": {
      return createAreaDbToBusiness(change);
    }
    default: {
      // @ts-expect-error There should be no way to get here
      throw new Error(`Unknown change type: ${change.type}`);
    }
  }
};
