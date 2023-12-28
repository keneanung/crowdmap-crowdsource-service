import * as fs from "fs";
import { inject } from "inversify";
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
  public getMap(@Query() timesSeen: number): Readable {
    const file = this.mapService.getChangedMap(timesSeen);

    this.setHeader("Content-Type", "application/octet-stream");
    this.setHeader("Content-Disposition", "attachment; filename=map");

    const s = fs.createReadStream(file);
    s.on("close", () => {
      fs.unlink(file, (err) => {
        if (err) {
          throw err;
        }
      });
    });
    return s;
  }
}
