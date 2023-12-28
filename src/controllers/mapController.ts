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
  public async getMap(@Query() timesSeen: number): Promise<Readable> {
    const file = await this.mapService.getChangedMap(timesSeen);

    this.setHeader("Content-Type", "application/octet-stream");
    this.setHeader("Content-Disposition", "attachment; filename=map");

    const s = fs.createReadStream(file);
    s.on("close", () => {
      fs.unlink(file, (err) => {
        if (err) {
          throw err;
        }
      });
      fs.rmdirSync(dirname(file));
    });
    return s;
  }
}
