import * as fs from "fs";
import { inject } from "inversify";
import { dirname } from "path";
import { Readable } from "stream";
import { Controller, Get, Produces, Query, Route, Tags } from "tsoa";
import { provideSingleton } from "../ioc/provideSingleton";
import { MapService } from "../services/mapService";

@Route("map")
@Tags("map")
@provideSingleton(MapController)
export class MapController extends Controller {
  constructor(@inject(MapService) private mapService: MapService) {
    super();
  }

  /**
   * Download the map with all changes applied that are considered vetted.
   * A change is considered vetted when it is seen by the given amount of different people.
   * These changes are then applied in order. The resulting map file is then sent to the requesting client.
   *
   * @param timesSeen How many times a change must have been seen by different people to cosider it vetted.
   * @param format The map format to download. If the format is `json`, a Mudlet map JSON is returned with content type `application/json`. For `binary`, a Mudlet binary map with content type `application/octet-stream` is sent.
   * @returns A map file with all vetted changes applied.
   */
  @Get("/")
  @Produces("application/octet-stream")
  public async getMap(
    @Query() timesSeen: number,
    @Query() format: "binary" | "json",
  ): Promise<Readable> {
    const file = await this.mapService.getChangedMap(timesSeen, format);

    this.setHeader(
      "Content-Type",
      `application/${format === "binary" ? "octet-stream" : "json"}}`,
    );
    this.setHeader("Content-Disposition", "attachment; filename=map");

    const s = fs.createReadStream(file);
    s.on("close", () => {
      fs.unlink(file, (err) => {
        fs.rmdirSync(dirname(file));
        if (err) {
          throw err;
        }
      });
    });
    return s;
  }
}
