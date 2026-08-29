import { parentPort, workerData } from "node:worker_threads";
import { MudletMapReader } from "mudlet-map-binary-reader";
import { MapWorkerRequest, MapWorkerResponse } from "../models/business/mapWorker";
import { changeDbToBusiness } from "../models/db/change";

const request = workerData as MapWorkerRequest;
const map: Mudlet.MudletMap = MudletMapReader.read(request.mapFile);
request.changes.map(changeDbToBusiness).forEach((change) => {
  change.apply(map);
});

const response: MapWorkerResponse = {};
switch (request.operation) {
  case "binary":
    if (!request.outputFile) {
      throw new Error("Missing worker output file");
    }
    MudletMapReader.write(map, request.outputFile);
    break;
  case "json":
    if (!request.outputFile) {
      throw new Error("Missing worker output file");
    }
    MudletMapReader.exportJson(map, request.outputFile, true);
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
  case "validate":
    break;
}

parentPort?.postMessage(response);
