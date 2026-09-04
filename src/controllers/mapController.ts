import { provide } from "@inversifyjs/binding-decorators";
import * as fs from "fs";
import { inject } from "inversify";
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
import { log } from "../observability.js";
import { MapService } from "../services/mapService.js";

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
    @Query() include: string[] = [],
    @Query() exclude: string[] = [],
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
    const snapshot = await this.mapService.getChangedMapFile(
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
    this.setHeader("X-Map-Version", snapshot.version);
    this.setHeader("X-Map-Version-Raw", snapshot.rawVersion);

    const s = fs.createReadStream(snapshot.file);
    s.on("close", () => {
      void fs.promises
        .rm(dirname(snapshot.file), { recursive: true, force: true })
        .catch((error: unknown) => {
          log("error", "temporary_map_cleanup_failed", { error });
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
  public async getRendererMap(
    @Query() timesSeen: number,
    @Query() include: string[] = [],
    @Query() exclude: string[] = [],
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
    const snapshot = await this.mapService.getRendererSnapshot(
      timesSeen,
      include,
      exclude,
    );
    this.setHeader("X-Map-Version", snapshot.version);
    this.setHeader("X-Map-Version-Raw", snapshot.rawVersion);
    this.setHeader("Content-Type", "text/javascript");
    return Readable.from(Buffer.from(snapshot.content));
  }
}
