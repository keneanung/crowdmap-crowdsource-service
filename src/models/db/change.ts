import { ObjectId } from "mongodb";
import {
  AddRoomExit as AddRoomExitBusiness,
  Change as ChangeBusiness,
  ChangeRoomName as ChangeRoomNameBusiness,
  ChangeType,
  Direction,
} from "../business/change";

export interface ChangeBase {
  _id?: ObjectId;
  type: ChangeType;
  roomNumber: number;
  reporters: string[];
  numberOfReporters: number;
  changeId?: number;
}

export interface ChangeRoomName extends ChangeBase {
  type: "room-name";
  name: string;
}

export interface AddRoomExit extends ChangeBase {
  type: "add-exit";
  direction: Direction;
  destination: number;
}

export type Change = ChangeRoomName | AddRoomExit;

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

export const addExitBusinessToDb = (
  change: AddRoomExitBusiness,
): AddRoomExit => {
  return {
    type: "add-exit",
    roomNumber: change.roomNumber,
    reporters: Array.from(change.reporters),
    numberOfReporters: change.reporters.size,
    direction: change.direction,
    destination: change.destination,
    changeId: change.changeId,
  };
};

export const addExitDbToBusiness = (
  change: AddRoomExit,
): AddRoomExitBusiness => {
  return new AddRoomExitBusiness(
    change.roomNumber,
    change.reporters,
    change.direction,
    change.destination,
    change.changeId,
  );
};

export const changeBusinessToDb = (change: ChangeBusiness): Change => {
  switch (change.type) {
    case "room-name": {
      return roomNameBusinessToDb(change as ChangeRoomNameBusiness);
    }
    case "add-exit": {
      return addExitBusinessToDb(change as AddRoomExitBusiness);
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
    case "add-exit": {
      return addExitDbToBusiness(change);
    }
    default: {
      // @ts-expect-error There should be no way to get here
      throw new Error(`Unknown change type: ${change.type}`);
    }
  }
};
