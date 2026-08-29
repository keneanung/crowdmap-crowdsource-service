import { inject } from "inversify";
import { provide } from "@inversifyjs/binding-decorators";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { Worker } from "node:worker_threads";
import { NIL } from "uuid";
import { config } from "../config/values";
import { downloadMapFile, downloadMapVersion } from "../fileDownloads";
import { ConflictError } from "../models/api/error";
import { ChangeService } from "./changeService";
import { Change } from "../models/business/change";
import {
  MapWorkerRequest,
  MapWorkerResponse,
} from "../models/business/mapWorker";
import { changeBusinessToDb } from "../models/db/change";

let baselineUpdateQueue: Promise<void> = Promise.resolve();
let baselineUpdateRevision = 0;

const isBaselineRevisionCurrent = (revision: number): boolean =>
  revision === baselineUpdateRevision;

export interface ChangeSnapshot {
  changes: Change[];
  version: string;
  rawVersion: string;
}

export interface MapFileSnapshot extends ChangeSnapshot {
  file: string;
}

export interface RendererSnapshot extends ChangeSnapshot {
  content: string;
}

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
  ): Promise<MapFileSnapshot> {
    // A concurrent baseline update can require regenerating the file.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    while (true) {
      const updateRevision = baselineUpdateRevision;
      await baselineUpdateQueue;
      const [changes, rawVersion] = await Promise.all([
        this.changeService.getChanges(timesSeen, include, exclude),
        this.readRawVersion(),
      ]);
      const file = await this.getTempMapFileName();
      try {
        await this.runMapWorker({
          changes: changes.map(changeBusinessToDb),
          mapFile: config.mapFile,
          operation: format,
          outputFile: file,
        });
        if (isBaselineRevisionCurrent(updateRevision)) {
          return {
            changes,
            file,
            rawVersion,
            version: this.buildVersion(changes, rawVersion),
          };
        }
      } catch (error) {
        await rm(dirname(file), { recursive: true, force: true });
        throw error;
      }
      await rm(dirname(file), { recursive: true, force: true });
    }
  }

  public async getRendererSnapshot(
    timesSeen: number,
    include: string[] = [],
    exclude: string[] = [],
  ): Promise<RendererSnapshot> {
    // A concurrent baseline update can require regenerating the content.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    while (true) {
      const updateRevision = baselineUpdateRevision;
      await baselineUpdateQueue;
      const [changes, rawVersion] = await Promise.all([
        this.changeService.getChanges(timesSeen, include, exclude),
        this.readRawVersion(),
      ]);
      const response = await this.runMapWorker({
        changes: changes.map(changeBusinessToDb),
        mapFile: config.mapFile,
        operation: "renderer",
      });
      if (isBaselineRevisionCurrent(updateRevision)) {
        if (!response.content) {
          throw new Error("Map worker returned no renderer content");
        }
        return {
          changes,
          content: response.content,
          rawVersion,
          version: this.buildVersion(changes, rawVersion),
        };
      }
    }
  }

  private buildVersion(changes: Change[], baseVersion: string): string {
    const lastChangeId =
      changes.length > 0 ? changes[changes.length - 1].changeId : NIL;
    // Number of hex characters representing the first 64 bits (8 bytes) of the UUID
    const UUID_FIRST_64_BITS_HEX_LENGTH = 16;
    const idBuffer = Buffer.from(
      lastChangeId.replace(/-/g, "").slice(0, UUID_FIRST_64_BITS_HEX_LENGTH),
      "hex",
    );
    const top64BitsBase64Url = idBuffer.toString("base64url");

    return `${baseVersion}.${top64BitsBase64Url}.${changes.length.toString()}`;
  }

  public async getChangesSnapshot(
    timesSeen: number,
    include: string[] = [],
    exclude: string[] = [],
  ): Promise<ChangeSnapshot> {
    // A concurrent baseline update can require retrying the snapshot.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    while (true) {
      const updateRevision = baselineUpdateRevision;
      await baselineUpdateQueue;
      const [changes, rawVersion] = await Promise.all([
        this.changeService.getChanges(timesSeen, include, exclude),
        this.readRawVersion(),
      ]);
      if (isBaselineRevisionCurrent(updateRevision)) {
        return {
          changes,
          rawVersion,
          version: this.buildVersion(changes, rawVersion),
        };
      }
    }
  }

  public async getVersion(timesSeen: number): Promise<string> {
    return (await this.getChangesSnapshot(timesSeen)).version;
  }

  public async getRawVersion() {
    // A concurrent baseline update can require retrying the read.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    while (true) {
      const updateRevision = baselineUpdateRevision;
      await baselineUpdateQueue;
      const version = await this.readRawVersion();
      if (isBaselineRevisionCurrent(updateRevision)) {
        return version;
      }
    }
  }

  private async readRawVersion(): Promise<string> {
    return (await readFile(config.versionFile, "utf-8")).trim();
  }

  private runMapWorker(request: MapWorkerRequest): Promise<MapWorkerResponse> {
    const compiledWorker = join(__dirname, "../workers/mapWorker.js");
    const workerFile = existsSync(compiledWorker)
      ? compiledWorker
      : join(__dirname, "../workers/mapWorker.ts");
    const worker = new Worker(workerFile, {
      execArgv: workerFile.endsWith(".ts")
        ? ["-r", "ts-node/register/transpile-only"]
        : undefined,
      workerData: request,
    });
    return new Promise((resolve, reject) => {
      worker.once("message", (response: MapWorkerResponse) => {
        resolve(response);
      });
      worker.once("error", reject);
      worker.once("exit", (code) => {
        if (code !== 0) {
          reject(new Error(`Map worker stopped with exit code ${code.toString()}`));
        }
      });
    });
  }

  public async updateMap() {
    const versionPromise = downloadMapVersion();
    const mapPromise = downloadMapFile();
    await Promise.all([versionPromise, mapPromise]);
  }

  public async applyBaselineUpdate(
    expectedVersion: string,
    obsoleteChanges: string[],
  ): Promise<void> {
    baselineUpdateRevision += 1;
    const update = baselineUpdateQueue.then(async () => {
      const serverVersion = await this.readRawVersion();
      if (expectedVersion !== serverVersion) {
        throw new ConflictError(
          "The map version provided does not match the current map version",
        );
      }

      await this.updateMap();
      await this.changeService.applyChanges(obsoleteChanges);
    });
    baselineUpdateQueue = update.catch(() => Promise.resolve());
    return update;
  }
}
