import { provide } from "@inversifyjs/binding-decorators";
import {
  Controller,
  Get,
  Produces,
  Query,
  Request,
  Response,
  Route,
  Tags,
  ValidateError,
} from "@tsoa/runtime";
import * as fs from "fs";
import { inject } from "inversify";
import { dirname } from "path";
import { Readable } from "stream";
import { log } from "../observability.js";
import {
  type ProjectRequest,
  requireProjectContext,
} from "../projects/projectContext.js";
import { serializeLuaChangelog } from "../services/luaChangelog.js";
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
   * @param reporter Also include changes reported by this pseudonym, regardless of their report count.
   * @param expectedVersion Optionally require the version obtained before changelog retrieval.
   * @returns A map file with all vetted changes applied.
   */
  @Get("/")
  @Produces("application/octet-stream")
  @Response(409, "The requested map version is no longer current")
  public async getMap(
    @Request() request: ProjectRequest,
    @Query() timesSeen: number,
    @Query() format: "binary" | "json",
    @Query() include: string[] = [],
    @Query() exclude: string[] = [],
    @Query() reviewId?: string,
    @Query() reporter?: string,
    @Query() expectedVersion?: string,
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
    if (reviewId && expectedVersion !== undefined)
      throw new ValidateError(
        {
          expectedVersion: {
            message: "Version validation is not supported for staged reviews",
          },
        },
        "Invalid parameters",
      );
    const staged = reviewId
      ? this.mapService.getStagedUpstreamReview(
          reviewId,
          requireProjectContext(request).project,
        )
      : undefined;
    const snapshot = await this.mapService.getChangedMapFile(
      timesSeen,
      format,
      include,
      exclude,
      staged?.mapFile,
      staged?.upstreamVersion,
      requireProjectContext(request).project,
      reporter,
      expectedVersion,
    );

    this.setHeader("Cache-Control", "private, no-store");
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

  /** Describe the requested service map's net differences from its baseline. */
  @Get("/changelog")
  @Produces("text/plain")
  @Response(409, "The requested map version is no longer current")
  public async getChangelog(
    @Request() request: ProjectRequest,
    @Query() timesSeen: number,
    @Query() expectedVersion: string,
    @Query() reporter?: string,
    @Query() include: string[] = [],
    @Query() exclude: string[] = [],
    @Query() format: "text" | "lua" = "text",
  ): Promise<Readable> {
    if (!expectedVersion.trim() || (include.length > 0 && exclude.length > 0))
      throw new ValidateError(
        {
          expectedVersion: {
            message:
              "A version is required; include and exclude cannot be combined",
          },
        },
        "Invalid parameters",
      );
    const notes = await this.mapService.getChangelog(
      timesSeen,
      expectedVersion,
      include,
      exclude,
      requireProjectContext(request).project,
      reporter,
    );
    this.setHeader("Cache-Control", "private, no-store");
    this.setHeader("X-Map-Version", notes.mapVersion);
    this.setHeader("X-Map-Version-Raw", notes.baseVersion);
    this.setHeader("X-Changelog-Source", notes.source);
    this.setHeader("Content-Type", "text/plain; charset=utf-8");
    return Readable.from([
      format === "lua" ? serializeLuaChangelog(notes) : notes.text,
    ]);
  }

  /**
   * Returns the current map version number of the vetted changes.
   * @param timesSeen How many times a change must have been seen by different people to consider it vetted.
   * @param reporter Also include changes reported by this pseudonym, regardless of their report count.
   * @returns The baseline version followed by a fingerprint of the ordered selected changes.
   */
  @Get("/version")
  public async getVersion(
    @Request() request: ProjectRequest,
    @Query() timesSeen: number,
    @Query() reporter?: string,
    @Query() include: string[] = [],
    @Query() exclude: string[] = [],
  ): Promise<string> {
    if (include.length > 0 && exclude.length > 0)
      throw new ValidateError(
        { include: { message: "include and exclude cannot be combined" } },
        "Invalid parameters",
      );
    this.setHeader("Cache-Control", "private, no-store");
    return await this.mapService.getVersion(
      timesSeen,
      requireProjectContext(request).project,
      reporter,
      include,
      exclude,
    );
  }

  /**
   * Returns the map in a format appropriate for the Mudlet map renderer, which allows rendering the map in the browser.
   * The default implementation has the map, colors and a default position in three different files. This method returns a single file with all the data.
   *
   * @param timesSeen How many times a change must have been seen by different people to cosider it vetted.
   * @param reporter Also include changes reported by this pseudonym, regardless of their report count.
   * @returns A map file with all vetted changes applied.
   */
  @Get("/renderer")
  @Produces("text/javascript")
  public async getRendererMap(
    @Request() request: ProjectRequest,
    @Query() timesSeen: number,
    @Query() include: string[] = [],
    @Query() exclude: string[] = [],
    @Query() reporter?: string,
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
      requireProjectContext(request).project,
      reporter,
    );
    this.setHeader("X-Map-Version", snapshot.version);
    this.setHeader("X-Map-Version-Raw", snapshot.rawVersion);
    this.setHeader("Content-Type", "text/javascript");
    return Readable.from(Buffer.from(snapshot.content));
  }
}
