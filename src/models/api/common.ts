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
  | "set-room-area"
  | "delete-exit"
  | "modify-exit-weight"
  | "modify-special-exit-weight"
  | "set-room-environment";

/**
 * An exit direction.
 */
export type Direction =
  | "north"
  | "south"
  | "east"
  | "west"
  | "up"
  | "down"
  | "in"
  | "out"
  | "northeast"
  | "northwest"
  | "southeast"
  | "southwest";
