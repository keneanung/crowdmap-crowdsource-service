import { randomUUID } from "node:crypto";
import { changeBusinessToDb } from "../db/change.js";
import type { Change } from "./change.js";

// Values are deliberately absent from these keys. JSON arrays prevent user
// keys/commands containing separators from aliasing another property.
export function observationProperty(change: Change): string {
  const data = changeBusinessToDb(change);
  switch (data.type) {
    case "modify-exit":
    case "delete-exit":
      return JSON.stringify(["exit", data.roomNumber, data.direction]);
    case "modify-special-exit":
    case "delete-special-exit":
      return JSON.stringify(["special", data.roomNumber, data.exitCommand]);
    case "lock-special-exit":
    case "unlock-special-exit":
      return JSON.stringify([
        "special-lock",
        data.roomNumber,
        data.exitCommand,
      ]);
    case "modify-exit-weight":
    case "set-exit-door":
      return JSON.stringify([change.type, data.roomNumber, data.direction]);
    case "modify-special-exit-weight":
      return JSON.stringify([change.type, data.roomNumber, data.exitCommand]);
    case "modify-room-user-data":
    case "delete-room-user-data":
      return JSON.stringify(["room-data", data.roomNumber, data.key]);
    case "set-map-user-data":
    case "delete-map-user-data":
      return JSON.stringify(["map-data", data.key]);
    case "set-map-label":
    case "delete-map-label":
      return JSON.stringify(["label", data.areaId, data.labelId]);
    case "rename-area":
      return JSON.stringify([change.type, data.areaId]);
    case "create-area":
      return JSON.stringify([change.type, data.areaId, data.name]);
    case "delete-area":
      return JSON.stringify([change.type, data.areaId]);
    default:
      return JSON.stringify([change.type, data.roomNumber]);
  }
}

export interface ObservedReport {
  observationId: string;
  changeId: string;
  observedAt: Date;
  order: string;
}
export interface CurrentObservation {
  projectId: string;
  reporter: string;
  property: string;
  // Migration preserves ambiguous legacy support until a fresh observation
  // replaces the whole list. New documents always have exactly one entry.
  reports: ObservedReport[];
  legacy: boolean;
}
export function observedReport(
  changeId: string,
  order: string,
  observedAt: Date,
): ObservedReport {
  return {
    observationId: randomUUID(),
    changeId,
    observedAt,
    order,
  };
}
