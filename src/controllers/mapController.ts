import * as fs from "fs";
import { inject } from "inversify";
import { dirname } from "path";
import { Readable } from "stream";
import { Controller, Get, Produces, Query, Route } from "tsoa";
import { provideSingleton } from "../ioc/provideSingleton";
import { MapService } from "../services/mapService";

@Route("map")
@provideSingleton(MapController)
export class MapController extends Controller {
  constructor(@inject(MapService) private mapService: MapService) {
    super();
  }

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
