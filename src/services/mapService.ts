import { inject } from "inversify";
import { MudletMapReader } from "mudlet-map-binary-reader";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { config } from "../config/values";
import { provideSingleton } from "../ioc/provideSingleton";
import { ChangeService } from "./changeService";

@provideSingleton(MapService)
export class MapService {
  constructor(@inject(ChangeService) private changeService: ChangeService) {}

  public async getTempMapFileName(): Promise<string> {
    return join(await mkdtemp(join(tmpdir(), "mudlet-map-")), "map");
  }

  public async getChangedMapFile(
    timesSeen: number,
    format: "binary" | "json",
    include: number[] = [],
    exclude: number[] = [],
  ): Promise<string> {
    const map = await this.getChangedMap(timesSeen, include, exclude);
    const file = await this.getTempMapFileName();
    if (format === "binary") {
      MudletMapReader.write(map, file);
    } else {
      MudletMapReader.exportJson(map, file, true);
    }
    return file;
  }

  public async getChangedMap(
    timesSeen: number,
    include: number[] = [],
    exclude: number[] = [],
  ): Promise<Mudlet.MudletMap> {
    const changes = await this.changeService.getChanges(
      timesSeen,
      include,
      exclude,
    );
    const map: Mudlet.MudletMap = MudletMapReader.read(config.mapFile);
    changes.forEach((change) => {
      change.apply(map);
    });
    return map;
  }

  public async getVersion(timesSeen: number): Promise<string> {
    const changes = await this.changeService.getChanges(timesSeen);
    const lastChangeId =
      changes.length > 0 ? changes[changes.length - 1].changeId : 0;
    const baseVersion = await readFile(config.versionFile, "utf-8");
    return `${baseVersion.trim()}.${lastChangeId}.${changes.length}`;
  }
}
