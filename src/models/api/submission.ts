import { ChangeType, Direction } from "./common";

export interface ChangeBaseSubmission {
  /**
   * Discriminator for the change type.
   */
  type: ChangeType;
  /**
   * The reporter of the change. This may be a real name or a pseudonym or even a ID of some kind. It is used to identify the different amount of people that have seen a change.
   */
  reporter: string;
}

/**
 * Submit a new area
 */
export interface CreateAreaSubmission extends ChangeBaseSubmission {
  type: "create-area";
  /**
   * The name of the area.
   */
  name: string;
  /**
   * The ID of the new area.
   */
  areaId: number;
}

export interface RoomChangeBaseSubmission extends ChangeBaseSubmission {
  /**
   * The ID of the room to change.
   */
  roomNumber: number;
}

/**
 * Submit a change to the room name.
 */
export interface ChangeRoomNameSubmission extends RoomChangeBaseSubmission {
  type: "room-name";
  /**
   * The new room name.
   */
  name: string;
}

/**
 * Submit a new exit for a room.
 */
export interface ModifyRoomExitSubmission extends RoomChangeBaseSubmission {
  type: "modify-exit";
  /**
   * The direction to add the new exit.
   */
  direction: Direction;
  /**
   * The destination room.
   */
  destination: number;
}

/**
 * Submit a change to a special exit. This may create new special exits or modify (overwrite) existing ones.
 */
export interface ModifySpecialExitSubmission extends RoomChangeBaseSubmission {
  type: "modify-special-exit";
  /**
   * The command to trigger the special exit.
   */
  exitCommand: string;
  /**
   * The destination room of the special exit.
   */
  destination: number;
}

/**
 * Submit a lock to a special exit to avoid a mapper taking it for autowalk.
 */
export interface LockSpecialExitSubmission extends RoomChangeBaseSubmission {
  type: "lock-special-exit";
  /**
   * The command to trigger the special exit.
   */
  exitCommand: string;
  /**
   * The destination room of the special exit.
   */
  destination: number;
}

/**
 * Submit a unlock to a special exit to allow a mapper taking it for autowalk.
 */
export interface UnlockSpecialExitSubmission extends RoomChangeBaseSubmission {
  type: "unlock-special-exit";
  /**
   * The command to trigger the special exit.
   */
  exitCommand: string;
  /**
   * The destination room of the special exit.
   */
  destination: number;
}

/**
 * Submit the deletion of a special exit.
 */
export interface DeleteSpecialExitSubmission extends RoomChangeBaseSubmission {
  type: "delete-special-exit";
  /**
   * The command to trigger the special exit.
   */
  exitCommand: string;
}

/**
 * Submit the creation of a new room.
 */
export interface CreateRoomSubmission extends RoomChangeBaseSubmission {
  type: "create-room";
}

/**
 * Submit a change of coordinates of a room.
 */
export interface SetRoomCoordinatesSubmission extends RoomChangeBaseSubmission {
  type: "set-room-coordinates";
  /**
   * The X coordinate of the room.
   */
  x: number;
  /**
   * The Y coordinate of the room.
   */
  y: number;
  /**
   * The Z coordinate of the room.
   */
  z: number;
}

/**
 * Submit a change of a rooms area.
 */
export interface SetRoomAreaSubmission extends RoomChangeBaseSubmission {
  type: "set-room-area";
  /**
   * The ID of the new area the room belongs to.
   */
  areaId: number;
}

/**
 * Submit a deletion of an exit.
 */
export interface DeleteExitSubmission extends RoomChangeBaseSubmission {
  type: "delete-exit";
  /**
   * The direction of the exit to delete.
   */
  direction: Direction;
}

/**
 * Submit a change of an exits weight.
 */
export interface ModifyExitWeightSubmission extends RoomChangeBaseSubmission {
  type: "modify-exit-weight";
  /**
   * The direction of the exit to change.
   */
  direction: Direction;
  /**
   * The new weight of the exit.
   */
  weight: number;
}

/**
 * Submit a change of a special exits weight
 */
export interface ModifySpecialExitWeightSubmission
  extends RoomChangeBaseSubmission {
  type: "modify-special-exit-weight";
  /**
   * The command of the special exit to change.
   */
  exitCommand: string;
  /**
   * The new weight of the special exit.
   */
  weight: number;
}

/**
 * Submit a change of a rooms environment.
 */
export interface SetRoomEnvironmentSubmission extends RoomChangeBaseSubmission {
  type: "set-room-environment";
  /**
   * The ID of the environment to set.
   */
  environmentId: number;
}

/**
 * Submits a change to a rooms user data.
 */
export interface ModifyRoomUserDataSubmission extends RoomChangeBaseSubmission {
  type: "modify-room-user-data";
  /**
   * The key of the user data to modify.
   */
  key: string;
  /**
   * The new value of the user data.
   */
  value: string;
}

/**
 * Submits a deletion of a rooms user data.
 */
export interface DeleteRoomUserDataSubmission extends RoomChangeBaseSubmission {
  type: "delete-room-user-data";
  /**
   * The key of the user data to delete.
   */
  key: string;
}

export type ChangeSubmission =
  | ChangeRoomNameSubmission
  | ModifyRoomExitSubmission
  | ModifySpecialExitSubmission
  | LockSpecialExitSubmission
  | UnlockSpecialExitSubmission
  | DeleteSpecialExitSubmission
  | CreateRoomSubmission
  | SetRoomCoordinatesSubmission
  | CreateAreaSubmission
  | SetRoomAreaSubmission
  | DeleteExitSubmission
  | ModifyExitWeightSubmission
  | ModifySpecialExitWeightSubmission
  | SetRoomEnvironmentSubmission
  | ModifyRoomUserDataSubmission
  | DeleteRoomUserDataSubmission;

export interface ApplicationSubmission {
  version: string;
  obsoleteChanges: number[];
}
