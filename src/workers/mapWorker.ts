import { MudletMapReader } from "mudlet-map-binary-reader";
import { readFileSync, writeFileSync } from "node:fs";
import { parentPort, workerData } from "node:worker_threads";
import { reconcileChange } from "../models/business/changeReview.js";
import {
  changeWorkerToBusiness,
  MapWorkerRequest,
  MapWorkerResponse,
} from "../models/business/mapWorker.js";

const request = workerData as MapWorkerRequest;
const map: Mudlet.MudletMap = MudletMapReader.readBuffer(
  readFileSync(request.mapFile),
);
const changes = request.changes.map(changeWorkerToBusiness);
if (request.operation !== "reconcile") {
  changes.forEach((change) => {
    change.apply(map);
  });
}

const response: MapWorkerResponse = {};
switch (request.operation) {
  case "binary":
    if (!request.outputFile) {
      throw new Error("Missing worker output file");
    }
    writeFileSync(request.outputFile, MudletMapReader.writeBuffer(map));
    break;
  case "json":
    if (!request.outputFile) {
      throw new Error("Missing worker output file");
    }
    writeFileSync(request.outputFile, MudletMapReader.exportJson(map, true));
    break;
  case "renderer": {
    const exportedMap = MudletMapReader.export(map);
    const stringifiedMap = JSON.stringify(exportedMap.mapData);
    const stringifiedColors = JSON.stringify(exportedMap.colors);
    const stringifiedPosition = JSON.stringify({
      area: exportedMap.mapData[0].areaId,
    });
    response.content = `mapData = ${stringifiedMap}; colors = ${stringifiedColors}; position = ${stringifiedPosition};`;
    break;
  }
  case "reconcile": {
    if (!request.comparisonMapFile) {
      throw new Error("Missing comparison map file");
    }
    const comparisonMap = MudletMapReader.readBuffer(
      readFileSync(request.comparisonMapFile),
    );
    response.reconciliation = changes.map((change) =>
      reconcileChange(change, map, comparisonMap),
    );
    break;
  }
  case "validate":
    // MudletMapReader.read() above validates the map by parsing it. Reaching
    // this case means the staged map was read successfully.
    break;
}

parentPort?.postMessage(response);
