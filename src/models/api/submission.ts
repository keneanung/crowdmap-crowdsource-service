import { ChangeType, Direction } from "./common";

export interface ChangeBaseSubmission {
  /**
   * Discriminator for the change type.
   */
  type: ChangeType;
  /**
   * The ID of the room to change.
   */
  roomNumber: number;
  /**
   * The reporter of the change. This may be a real name or a pseudonym or even a ID of some kind. It is used to identify the different amount of people that have seen a change.
   */
  reporter: string;
}

/**
 * Submit a change to the room name.
 */
export interface ChangeRoomNameSubmission extends ChangeBaseSubmission {
  type: "room-name";
  /**
   * The new room name.
   */
  name: string;
}

/**
 * Submit a new exit for a room.
 */
export interface ModifyRoomExitSubmission extends ChangeBaseSubmission {
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
export interface ModifySpecialExitSubmission extends ChangeBaseSubmission {
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
export interface LockSpecialExitSubmission extends ChangeBaseSubmission {
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
export interface UnlockSpecialExitSubmission extends ChangeBaseSubmission {
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
export interface DeleteSpecialExitSubmission extends ChangeBaseSubmission {
  type: "delete-special-exit";
  /**
   * The command to trigger the special exit.
   */
  exitCommand: string;
}

export type ChangeSubmission =
  | ChangeRoomNameSubmission
  | ModifyRoomExitSubmission
  | ModifySpecialExitSubmission
  | LockSpecialExitSubmission
  | UnlockSpecialExitSubmission
  | DeleteSpecialExitSubmission;
