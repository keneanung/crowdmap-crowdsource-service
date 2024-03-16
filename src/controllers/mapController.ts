import * as fs from "fs";
import { inject } from "inversify";
import { provide } from "inversify-binding-decorators";
import { MudletMapReader } from "mudlet-map-binary-reader";
import { dirname } from "path";
import { Readable } from "stream";
import {
  Controller,
  Get,
  Produces,
  Query,
  Route,
  Tags,
  ValidateError,
} from "tsoa";
import { MapService } from "../services/mapService";

@Route("map")
@Tags("map")
@provide(MapController)
export class MapController extends Controller {
  constructor(@inject(MapService) private mapService: MapService) {
    super();
  }

  /**
   * Download the map with all changes applied that are considered vetted.
   * A change is considered vetted when it is seen by the given amount of different people.
   * These changes are then applied in order. The resulting map file is then sent to the requesting client.
   * Additionally, the resulting map version is returned by the `x-map-version` HTTP header.
   *
   * @param timesSeen How many times a change must have been seen by different people to cosider it vetted.
   * @param format The map format to download. If the format is `json`, a Mudlet map JSON is returned with content type `application/json`. For `binary`, a Mudlet binary map with content type `application/octet-stream` is sent.
   * @param include Only include changes with the given changeIds.
   * @param exclude Exclude changes with the given changeIds.
   * @returns A map file with all vetted changes applied.
   */
  @Get("/")
  @Produces("application/octet-stream")
  public async getMap(
    @Query() timesSeen: number,
    @Query() format: "binary" | "json",
    @Query() include: number[] = [],
    @Query() exclude: number[] = [],
  ): Promise<Readable> {
    if (include.length > 0 && exclude.length > 0) {
      throw new ValidateError(
        {
          include: {
            message: "Unable to include and exclude changes at the same time",
          },
          exclude: {
            message: "Unable to include and exclude changes at the same time",
          },
        },
        "Cannot include and exclude changes at the same time",
      );
    }
    const file = await this.mapService.getChangedMapFile(
      timesSeen,
      format,
      include,
      exclude,
    );

    this.setHeader(
      "Content-Type",
      `application/${format === "binary" ? "octet-stream" : "json"}`,
    );
    this.setHeader("Content-Disposition", "attachment; filename=map");
    this.setHeader(
      "X-Map-Version",
      await this.mapService.getVersion(timesSeen),
    );

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

  /**
   * Returns the current map version number of the vetted changes.
   * @param timesSeen How many times a change must have been seen by different people to consider it vetted.
   * @returns The current map version number as it would be produced by the vetted changes. The version number is constructed of 3 parts, deliminated by `.`: map base version, the ID of the last change applied, and the number of changes.
   */
  @Get("/version")
  public async getVersion(@Query() timesSeen: number): Promise<string> {
    return await this.mapService.getVersion(timesSeen);
  }

  /**
   * Returns the map in a format appropriate for the Mudlet map renderer, which allows rendering the map in the browser.
   * The default implementation has the map, colors and a default position in three different files. This method returns a single file with all the data.
   *
   * @param timesSeen How many times a change must have been seen by different people to cosider it vetted.
   * @returns A map file with all vetted changes applied.
   */
  @Get("/renderer")
  @Produces("text/javascript")
  public async getRendererMap(@Query() timesSeen: number): Promise<Readable> {
    const map = await this.mapService.getChangedMap(timesSeen);
    this.setHeader(
      "X-Map-Version",
      await this.mapService.getVersion(timesSeen),
    );
    this.setHeader("Content-Type", "text/javascript");
    const exportedMap = MudletMapReader.export(map);
    const stringifiedMap = JSON.stringify(exportedMap.mapData);
    const stringifiedColors = JSON.stringify(exportedMap.colors);
    const stringifiedPosition = JSON.stringify({
      area: exportedMap.mapData[0].areaId,
    });
    const resString = `mapData = ${stringifiedMap}; colors = ${stringifiedColors}; position = ${stringifiedPosition};`;
    return Readable.from(Buffer.from(resString));
  }
}
