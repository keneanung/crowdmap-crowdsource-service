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
export interface AddRoomExitSubmission extends ChangeBaseSubmission {
  type: "add-exit";
  /**
   * The direction to add the new exit.
   */
  direction: Direction;
  /**
   * The destination room.
   */
  destination: number;
}

export interface ModifySpecialExitSubmission extends ChangeBaseSubmission {
  type: "modify-special-exit"
  /**
   * The command to trigger the special exit.
   */
  exitCommand: string;
  /**
   * The destination room of the special exit.
   */
  destination: number
}

export type ChangeSubmission = ChangeRoomNameSubmission | AddRoomExitSubmission | ModifySpecialExitSubmission;
