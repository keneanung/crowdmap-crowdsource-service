import { Change } from "../db/change";

export interface MapWorkerRequest {
  changes: Change[];
  mapFile: string;
  operation: "binary" | "json" | "renderer" | "validate";
  outputFile?: string;
}

export interface MapWorkerResponse {
  content?: string;
}
