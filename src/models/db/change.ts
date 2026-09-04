import { ObjectId } from "mongodb";
import {
  Change as ChangeBusiness,
  ChangeRoomName as ChangeRoomNameBusiness,
  ChangeType,
  CreateArea as CreateAreaBusiness,
  CreateRoom as CreateRoomBusiness,
  DeleteArea as DeleteAreaBusiness,
  DeleteExit as DeleteExitBusiness,
  DeleteRoom as DeleteRoomBusiness,
  DeleteRoomUserData as DeleteRoomUserDataBusiness,
  DeleteSpecialExit as DeleteSpecialExitBusiness,
  Direction,
  LockSpecialExit as LockSpecialExitBusiness,
  ModifyExitWeight as ModifyExitWeightBusiness,
  ModifyRoomExit as ModifyRoomExitBusiness,
  ModifyRoomUserData as ModifyRoomUserDataBusiness,
  ModifySpecialExit as ModifySpecialExitBusiness,
  ModifySpecialExitWeight as ModifySpecialExitWeightBusiness,
  RenameArea as RenameAreaBusiness,
  SetRoomArea as SetRoomAreaBusiness,
  SetRoomCoordinates as SetRoomCoordinatesBusiness,
  SetRoomEnvironment as SetRoomEnvironmentBusiness,
  SetRoomHash as SetRoomHashBusiness,
  SetRoomSymbol as SetRoomSymbolBusiness,
  SetRoomWeight as SetRoomWeightBusiness,
  UnlockSpecialExit as UnlockSpecialExitBusiness,
} from "../business/change.js";
import type { UpstreamConflict } from "../business/change.js";

export interface ChangeBase {
  _id?: ObjectId;
  type: ChangeType;
  reporters: string[];
  numberOfReporters: number;
  changeId: string;
  upstreamConflict?: UpstreamConflict;
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

export interface DeleteRoom extends RoomChangeBase {
  type: "delete-room";
}

export interface RenameArea extends ChangeBase {
  type: "rename-area";
  areaId: number;
  name: string;
}

export interface DeleteArea extends ChangeBase {
  type: "delete-area";
  areaId: number;
}

export interface SetRoomWeight extends RoomChangeBase {
  type: "set-room-weight";
  weight: number;
}

export interface SetRoomSymbol extends RoomChangeBase {
  type: "set-room-symbol";
  symbol: string;
}

export interface SetRoomHash extends RoomChangeBase {
  type: "set-room-hash";
  hash: string;
}

export interface SetRoomCoordinates extends RoomChangeBase {
  type: "set-room-coordinates";
  x: number;
  y: number;
  z: number;
}

export interface SetRoomArea extends RoomChangeBase {
  type: "set-room-area";
  areaId: number;
}

export interface CreateArea extends ChangeBase {
  type: "create-area";
  name: string;
  areaId: number;
}

export interface DeleteExit extends RoomChangeBase {
  type: "delete-exit";
  direction: Direction;
}

export interface ModifyExitWeight extends RoomChangeBase {
  type: "modify-exit-weight";
  direction: Direction;
  weight: number;
}

export interface ModifySpecialExitWeight extends RoomChangeBase {
  type: "modify-special-exit-weight";
  exitCommand: string;
  weight: number;
}

export interface SetRoomEnvironment extends RoomChangeBase {
  type: "set-room-environment";
  environmentId: number;
}

export interface ModifyRoomUserData extends RoomChangeBase {
  type: "modify-room-user-data";
  key: string;
  value: string;
}

export interface DeleteRoomUserData extends RoomChangeBase {
  type: "delete-room-user-data";
  key: string;
}

export type Change =
  | ChangeRoomName
  | ModifyRoomExit
  | ModifySpecialExit
  | LockSpecialExit
  | UnlockSpecialExit
  | DeleteSpecialExit
  | CreateRoom
  | DeleteRoom
  | SetRoomCoordinates
  | CreateArea
  | RenameArea
  | DeleteArea
  | SetRoomArea
  | SetRoomWeight
  | SetRoomSymbol
  | SetRoomHash
  | DeleteExit
  | ModifyExitWeight
  | ModifySpecialExitWeight
  | SetRoomEnvironment
  | ModifyRoomUserData
  | DeleteRoomUserData;

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

export const deleteRoomDbToBusiness = (change: DeleteRoom): ChangeBusiness =>
  new DeleteRoomBusiness(change.roomNumber, change.reporters, change.changeId);

export const deleteRoomBusinessToDb = (
  change: DeleteRoomBusiness,
): DeleteRoom => ({
  type: "delete-room",
  roomNumber: change.roomNumber,
  reporters: Array.from(change.reporters),
  numberOfReporters: change.reporters.size,
  changeId: change.changeId,
});

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
  return new CreateAreaBusiness(
    change.name,
    change.areaId,
    change.reporters,
    change.changeId,
  );
};

export const createAreaBusinessToDb = (
  change: CreateAreaBusiness,
): CreateArea => {
  return {
    type: "create-area",
    name: change.name,
    areaId: change.areaId,
    reporters: Array.from(change.reporters),
    numberOfReporters: change.reporters.size,
    changeId: change.changeId,
  };
};

export const renameAreaDbToBusiness = (change: RenameArea): ChangeBusiness =>
  new RenameAreaBusiness(
    change.areaId,
    change.name,
    change.reporters,
    change.changeId,
  );

export const renameAreaBusinessToDb = (
  change: RenameAreaBusiness,
): RenameArea => ({
  type: "rename-area",
  areaId: change.areaId,
  name: change.name,
  reporters: Array.from(change.reporters),
  numberOfReporters: change.reporters.size,
  changeId: change.changeId,
});

export const deleteAreaDbToBusiness = (change: DeleteArea): ChangeBusiness =>
  new DeleteAreaBusiness(change.areaId, change.reporters, change.changeId);

export const deleteAreaBusinessToDb = (
  change: DeleteAreaBusiness,
): DeleteArea => ({
  type: "delete-area",
  areaId: change.areaId,
  reporters: Array.from(change.reporters),
  numberOfReporters: change.reporters.size,
  changeId: change.changeId,
});

export const setRoomWeightDbToBusiness = (
  change: SetRoomWeight,
): ChangeBusiness =>
  new SetRoomWeightBusiness(
    change.roomNumber,
    change.reporters,
    change.weight,
    change.changeId,
  );

export const setRoomWeightBusinessToDb = (
  change: SetRoomWeightBusiness,
): SetRoomWeight => ({
  type: "set-room-weight",
  roomNumber: change.roomNumber,
  weight: change.weight,
  reporters: Array.from(change.reporters),
  numberOfReporters: change.reporters.size,
  changeId: change.changeId,
});

export const setRoomSymbolDbToBusiness = (
  change: SetRoomSymbol,
): ChangeBusiness =>
  new SetRoomSymbolBusiness(
    change.roomNumber,
    change.reporters,
    change.symbol,
    change.changeId,
  );

export const setRoomSymbolBusinessToDb = (
  change: SetRoomSymbolBusiness,
): SetRoomSymbol => ({
  type: "set-room-symbol",
  roomNumber: change.roomNumber,
  symbol: change.symbol,
  reporters: Array.from(change.reporters),
  numberOfReporters: change.reporters.size,
  changeId: change.changeId,
});

export const setRoomHashDbToBusiness = (change: SetRoomHash): ChangeBusiness =>
  new SetRoomHashBusiness(
    change.roomNumber,
    change.reporters,
    change.hash,
    change.changeId,
  );

export const setRoomHashBusinessToDb = (
  change: SetRoomHashBusiness,
): SetRoomHash => ({
  type: "set-room-hash",
  roomNumber: change.roomNumber,
  hash: change.hash,
  reporters: Array.from(change.reporters),
  numberOfReporters: change.reporters.size,
  changeId: change.changeId,
});

export const setRoomAreaDbToBusiness = (
  change: SetRoomArea,
): ChangeBusiness => {
  return new SetRoomAreaBusiness(
    change.roomNumber,
    change.reporters,
    change.areaId,
    change.changeId,
  );
};

export const setRoomAreaBusinessToDb = (
  change: SetRoomAreaBusiness,
): SetRoomArea => {
  return {
    type: "set-room-area",
    roomNumber: change.roomNumber,
    reporters: Array.from(change.reporters),
    numberOfReporters: change.reporters.size,
    areaId: change.areaId,
    changeId: change.changeId,
  };
};

export const deleteExitDbToBusiness = (change: DeleteExit): ChangeBusiness => {
  return new DeleteExitBusiness(
    change.roomNumber,
    change.reporters,
    change.direction,
    change.changeId,
  );
};

export const deleteExitBusinessToDb = (
  change: DeleteExitBusiness,
): DeleteExit => {
  return {
    type: "delete-exit",
    roomNumber: change.roomNumber,
    reporters: Array.from(change.reporters),
    numberOfReporters: change.reporters.size,
    direction: change.direction,
    changeId: change.changeId,
  };
};

export const modifyExitWeightDbToBusiness = (
  change: ModifyExitWeight,
): ChangeBusiness => {
  return new ModifyExitWeightBusiness(
    change.roomNumber,
    change.reporters,
    change.direction,
    change.weight,
    change.changeId,
  );
};

export const modifyExitWeightBusinessToDb = (
  change: ModifyExitWeightBusiness,
): ModifyExitWeight => {
  return {
    type: "modify-exit-weight",
    roomNumber: change.roomNumber,
    reporters: Array.from(change.reporters),
    numberOfReporters: change.reporters.size,
    direction: change.direction,
    weight: change.weight,
    changeId: change.changeId,
  };
};

export const modifySpecialExitWeightDbToBusiness = (
  change: ModifySpecialExitWeight,
): ChangeBusiness => {
  return new ModifySpecialExitWeightBusiness(
    change.roomNumber,
    change.reporters,
    change.exitCommand,
    change.weight,
    change.changeId,
  );
};

export const modifySpecialExitWeightBusinessToDb = (
  change: ModifySpecialExitWeightBusiness,
): ModifySpecialExitWeight => {
  return {
    type: "modify-special-exit-weight",
    roomNumber: change.roomNumber,
    reporters: Array.from(change.reporters),
    numberOfReporters: change.reporters.size,
    exitCommand: change.exitCommand,
    weight: change.weight,
    changeId: change.changeId,
  };
};

export const setRoomEnvironmentDbToBusiness = (
  change: SetRoomEnvironment,
): ChangeBusiness => {
  return new SetRoomEnvironmentBusiness(
    change.roomNumber,
    change.reporters,
    change.environmentId,
    change.changeId,
  );
};

export const setRoomEnvironmentBusinessToDb = (
  change: SetRoomEnvironmentBusiness,
): SetRoomEnvironment => {
  return {
    type: "set-room-environment",
    roomNumber: change.roomNumber,
    reporters: Array.from(change.reporters),
    numberOfReporters: change.reporters.size,
    environmentId: change.environmentId,
    changeId: change.changeId,
  };
};

export const modifyRoomUserDataDbToBusiness = (
  change: ModifyRoomUserData,
): ChangeBusiness => {
  return new ModifyRoomUserDataBusiness(
    change.roomNumber,
    change.reporters,
    change.key,
    change.value,
    change.changeId,
  );
};

export const modifyRoomUserDataBusinessToDb = (
  change: ModifyRoomUserDataBusiness,
): ModifyRoomUserData => {
  return {
    type: "modify-room-user-data",
    roomNumber: change.roomNumber,
    reporters: Array.from(change.reporters),
    numberOfReporters: change.reporters.size,
    key: change.key,
    value: change.value,
    changeId: change.changeId,
  };
};

export const deleteRoomUserDataDbToBusiness = (
  change: DeleteRoomUserData,
): ChangeBusiness => {
  return new DeleteRoomUserDataBusiness(
    change.roomNumber,
    change.reporters,
    change.key,
    change.changeId,
  );
};

export const deleteRoomUserDataBusinessToDb = (
  change: DeleteRoomUserDataBusiness,
): DeleteRoomUserData => {
  return {
    type: "delete-room-user-data",
    roomNumber: change.roomNumber,
    reporters: Array.from(change.reporters),
    numberOfReporters: change.reporters.size,
    key: change.key,
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
    case "delete-room": {
      return deleteRoomBusinessToDb(change as DeleteRoomBusiness);
    }
    case "set-room-coordinates": {
      return setRoomCoordinatesBusinessToDb(
        change as SetRoomCoordinatesBusiness,
      );
    }
    case "create-area": {
      return createAreaBusinessToDb(change as CreateAreaBusiness);
    }
    case "rename-area": {
      return renameAreaBusinessToDb(change as RenameAreaBusiness);
    }
    case "delete-area": {
      return deleteAreaBusinessToDb(change as DeleteAreaBusiness);
    }
    case "set-room-area": {
      return setRoomAreaBusinessToDb(change as SetRoomAreaBusiness);
    }
    case "set-room-weight": {
      return setRoomWeightBusinessToDb(change as SetRoomWeightBusiness);
    }
    case "set-room-symbol": {
      return setRoomSymbolBusinessToDb(change as SetRoomSymbolBusiness);
    }
    case "set-room-hash": {
      return setRoomHashBusinessToDb(change as SetRoomHashBusiness);
    }
    case "delete-exit": {
      return deleteExitBusinessToDb(change as DeleteExitBusiness);
    }
    case "modify-exit-weight": {
      return modifyExitWeightBusinessToDb(change as ModifyExitWeightBusiness);
    }
    case "modify-special-exit-weight": {
      return modifySpecialExitWeightBusinessToDb(
        change as ModifySpecialExitWeightBusiness,
      );
    }
    case "set-room-environment": {
      return setRoomEnvironmentBusinessToDb(
        change as SetRoomEnvironmentBusiness,
      );
    }
    case "modify-room-user-data": {
      return modifyRoomUserDataBusinessToDb(
        change as ModifyRoomUserDataBusiness,
      );
    }
    case "delete-room-user-data": {
      return deleteRoomUserDataBusinessToDb(
        change as DeleteRoomUserDataBusiness,
      );
    }
    default: {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      throw new Error(`Unknown change type: ${change.type}`);
    }
  }
};

export const changeDbToBusiness = (change: Change): ChangeBusiness => {
  let businessChange: ChangeBusiness;
  switch (change.type) {
    case "room-name": {
      businessChange = roomNameDbToBusiness(change);
      break;
    }
    case "modify-exit": {
      businessChange = modifyExitDbToBusiness(change);
      break;
    }
    case "modify-special-exit": {
      businessChange = modifySpecialExitDbToBusiness(change);
      break;
    }
    case "lock-special-exit": {
      businessChange = lockSpecialExitDbToBusiness(change);
      break;
    }
    case "unlock-special-exit": {
      businessChange = unlockSpecialExitDbToBusiness(change);
      break;
    }
    case "delete-special-exit": {
      businessChange = deleteSpecialExitDbToBusiness(change);
      break;
    }
    case "create-room": {
      businessChange = crreateRoomDbToBusiness(change);
      break;
    }
    case "delete-room": {
      businessChange = deleteRoomDbToBusiness(change);
      break;
    }
    case "set-room-coordinates": {
      businessChange = setRoomCoordinatesDbToBusiness(change);
      break;
    }
    case "create-area": {
      businessChange = createAreaDbToBusiness(change);
      break;
    }
    case "rename-area": {
      businessChange = renameAreaDbToBusiness(change);
      break;
    }
    case "delete-area": {
      businessChange = deleteAreaDbToBusiness(change);
      break;
    }
    case "set-room-area": {
      businessChange = setRoomAreaDbToBusiness(change);
      break;
    }
    case "set-room-weight": {
      businessChange = setRoomWeightDbToBusiness(change);
      break;
    }
    case "set-room-symbol": {
      businessChange = setRoomSymbolDbToBusiness(change);
      break;
    }
    case "set-room-hash": {
      businessChange = setRoomHashDbToBusiness(change);
      break;
    }
    case "delete-exit": {
      businessChange = deleteExitDbToBusiness(change);
      break;
    }
    case "modify-exit-weight": {
      businessChange = modifyExitWeightDbToBusiness(change);
      break;
    }
    case "modify-special-exit-weight": {
      businessChange = modifySpecialExitWeightDbToBusiness(change);
      break;
    }
    case "set-room-environment": {
      businessChange = setRoomEnvironmentDbToBusiness(change);
      break;
    }
    case "modify-room-user-data": {
      businessChange = modifyRoomUserDataDbToBusiness(change);
      break;
    }
    case "delete-room-user-data": {
      businessChange = deleteRoomUserDataDbToBusiness(change);
      break;
    }
    default: {
      // @ts-expect-error There should be no way to get here
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      throw new Error(`Unknown change type: ${change.type}`);
    }
  }
  businessChange.upstreamConflict = change.upstreamConflict;
  return businessChange;
};
