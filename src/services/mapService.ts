import { inject } from "inversify";
import { MudletMapReader } from "mudlet-map-binary-reader";
import { config } from "../config/values";
import { provideSingleton } from "../ioc/provideSingleton";
import { ChangeService } from "./changeService";

@provideSingleton(MapService)
export class MapService {
  constructor(@inject(ChangeService) private changeService: ChangeService) {}

  public getChangedMap(timesSeen: number): string {
    const changes = this.changeService
      .getChanges()
      .filter((change) => change.reporters.length >= timesSeen);
    const map: Mudlet.MudletMap = MudletMapReader.read(config.mapFile);
    changes.forEach((change) => {
      change.apply(map.rooms[change.roomNumber]);
    });
    const file = "tempMapFile";
    MudletMapReader.write(map, file);
    return file;
  }
}
