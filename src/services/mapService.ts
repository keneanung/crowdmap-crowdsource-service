import { inject } from "inversify";
import { provide } from "inversify-binding-decorators";
import { MudletMapReader } from "mudlet-map-binary-reader";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { config } from "../config/values";
import { downloadMapFile, downloadMapVersion } from "../fileDownloads";
import { ChangeService } from "./changeService";

@provide(MapService)
export class MapService {
  constructor(@inject(ChangeService) private changeService: ChangeService) {}

  public async getTempMapFileName(): Promise<string> {
    return join(await mkdtemp(join(tmpdir(), "mudlet-map-")), "map");
  }

  public async getChangedMapFile(
    timesSeen: number,
    format: "binary" | "json",
    include: string[] = [],
    exclude: string[] = [],
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
    include: string[] = [],
    exclude: string[] = [],
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
      changes.length > 0 ? changes[changes.length - 1].changeId ?? 0 : 0;
    const baseVersion = await this.getRawVersion();
    return `${baseVersion}.${lastChangeId.toString()}.${changes.length.toString()}`;
  }

  public async getRawVersion() {
    return (await readFile(config.versionFile, "utf-8")).trim();
  }

  public async updateMap() {
    const versionPromise = downloadMapVersion();
    const mapPromise = downloadMapFile();
    await Promise.all([versionPromise, mapPromise]);
  }
}
