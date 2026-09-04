export type ChangeType =
  | "room-name"
  | "modify-exit"
  | "modify-special-exit"
  | "lock-special-exit"
  | "unlock-special-exit"
  | "delete-special-exit"
  | "create-room"
  | "delete-room"
  | "set-room-coordinates"
  | "create-area"
  | "rename-area"
  | "delete-area"
  | "set-room-area"
  | "set-room-weight"
  | "set-room-symbol"
  | "set-room-hash"
  | "delete-exit"
  | "modify-exit-weight"
  | "modify-special-exit-weight"
  | "set-room-environment"
  | "modify-room-user-data"
  | "delete-room-user-data";

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
