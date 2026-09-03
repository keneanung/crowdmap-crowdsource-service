import { MudletMapReader } from "mudlet-map-binary-reader";
import { parentPort, workerData } from "node:worker_threads";
import {
  changeWorkerToBusiness,
  MapWorkerRequest,
  MapWorkerResponse,
} from "../models/business/mapWorker";

const request = workerData as MapWorkerRequest;
const map: Mudlet.MudletMap = MudletMapReader.read(request.mapFile);
request.changes.map(changeWorkerToBusiness).forEach((change) => {
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
    // MudletMapReader.read() above validates the map by parsing it. Reaching
    // this case means the staged map was read successfully.
    break;
}

parentPort?.postMessage(response);
