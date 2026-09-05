import { provide } from "@inversifyjs/binding-decorators";
import { inject } from "inversify";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { copyFile, mkdtemp, readFile, rename, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { Worker } from "node:worker_threads";
import { NIL } from "uuid";
import { config } from "../config/values.js";
import { downloadMapFile, downloadMapVersion } from "../fileDownloads.js";
import { ConflictError } from "../models/api/error.js";
import type { Change } from "../models/business/change.js";
import {
  changeBusinessToWorker,
  MapWorkerRequest,
  MapWorkerResponse,
} from "../models/business/mapWorker.js";
import { ChangeService } from "./changeService.js";

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

interface BaselineReplacement {
  baselineVersion: string;
  complete(): Promise<void>;
  reconciliation: NonNullable<MapWorkerResponse["reconciliation"]>;
  rollback(): Promise<void>;
}

export interface BaselineUpdateResult {
  automaticallyResolved: number;
  upstreamConflicts: number;
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
          changes: changes.map(changeBusinessToWorker),
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
        changes: changes.map(changeBusinessToWorker),
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
    const compiledWorker = new URL("../workers/mapWorker.js", import.meta.url);
    const testWorker = new URL(
      "../../build/src/workers/mapWorker.js",
      import.meta.url,
    );
    const workerFile = existsSync(compiledWorker)
      ? compiledWorker
      : process.env.NODE_ENV === "test" && existsSync(testWorker)
        ? testWorker
        : new URL("../workers/mapWorker.ts", import.meta.url);
    const worker = new Worker(workerFile, {
      execArgv: workerFile.pathname.endsWith(".ts")
        ? ["--loader", "ts-node/esm", "--no-warnings"]
        : undefined,
      env: workerFile.pathname.endsWith(".ts")
        ? { ...process.env, TS_NODE_TRANSPILE_ONLY: "true" }
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
          reject(
            new Error(`Map worker stopped with exit code ${code.toString()}`),
          );
        }
      });
    });
  }

  public async validateBaseline(): Promise<void> {
    await baselineUpdateQueue;
    const version = await this.readRawVersion();
    if (!version) {
      throw new Error("Baseline version is empty");
    }
    await this.runMapWorker({
      changes: [],
      mapFile: config.mapFile,
      operation: "validate",
    });
  }

  private async replaceBaseline(
    changes: Change[],
  ): Promise<BaselineReplacement> {
    const suffix = randomUUID();
    const stagedMap = `${config.mapFile}.${suffix}.staged`;
    const stagedVersion = `${config.versionFile}.${suffix}.staged`;
    const backupMap = `${config.mapFile}.${suffix}.backup`;
    const backupVersion = `${config.versionFile}.${suffix}.backup`;
    const cleanup = async (): Promise<void> => {
      await Promise.all(
        [stagedMap, stagedVersion, backupMap, backupVersion].map((file) =>
          rm(file, { force: true }),
        ),
      );
    };
    let baselineVersion: string;
    let reconciliation: NonNullable<MapWorkerResponse["reconciliation"]>;

    try {
      await Promise.all([
        downloadMapFile(stagedMap),
        downloadMapVersion(stagedVersion),
      ]);
      baselineVersion = (await readFile(stagedVersion, "utf8")).trim();
      if (!baselineVersion) {
        throw new Error("Downloaded baseline version is empty");
      }
      await this.runMapWorker({
        changes: [],
        mapFile: stagedMap,
        operation: "validate",
      });
      const reconciliationResponse = await this.runMapWorker({
        changes: changes.map(changeBusinessToWorker),
        comparisonMapFile: stagedMap,
        mapFile: config.mapFile,
        operation: "reconcile",
      });
      if (!reconciliationResponse.reconciliation) {
        throw new Error("Map worker returned no reconciliation result");
      }
      reconciliation = reconciliationResponse.reconciliation;
      await Promise.all([
        copyFile(config.mapFile, backupMap),
        copyFile(config.versionFile, backupVersion),
      ]);
      try {
        await rename(stagedMap, config.mapFile);
        await rename(stagedVersion, config.versionFile);
      } catch (error) {
        await Promise.all([
          copyFile(backupMap, config.mapFile),
          copyFile(backupVersion, config.versionFile),
        ]);
        throw error;
      }
    } catch (error) {
      await cleanup();
      throw error;
    }

    return {
      baselineVersion,
      complete: cleanup,
      reconciliation,
      rollback: async () => {
        await Promise.all([
          copyFile(backupMap, config.mapFile),
          copyFile(backupVersion, config.versionFile),
        ]);
        await cleanup();
      },
    };
  }

  public async applyBaselineUpdate(
    expectedVersion: string,
    obsoleteChanges: string[],
  ): Promise<BaselineUpdateResult> {
    const update = baselineUpdateQueue.then(async () => {
      const serverVersion = await this.readRawVersion();
      if (expectedVersion !== serverVersion) {
        throw new ConflictError(
          "The map version provided does not match the current map version",
        );
      }

      baselineUpdateRevision += 1;
      const changes = await this.changeService.getChanges(0);
      const replacement = await this.replaceBaseline(changes);
      const automaticallyResolved = replacement.reconciliation
        .filter((result) => result.status === "resolved")
        .map((result) => result.changeId);
      const resolved = Array.from(
        new Set([...obsoleteChanges, ...automaticallyResolved]),
      );
      const conflicts = new Map(
        replacement.reconciliation
          .filter(
            (result) =>
              result.status === "upstream-conflict" &&
              !resolved.includes(result.changeId),
          )
          .map((result) => [
            result.changeId,
            {
              baselineVersion: replacement.baselineVersion,
              reason: result.reason ?? "Upstream changed the reported target.",
            },
          ]),
      );
      try {
        await this.changeService.reconcileChanges(resolved, conflicts);
      } catch (error) {
        await replacement.rollback();
        throw error;
      }
      await replacement.complete();
      return {
        automaticallyResolved: automaticallyResolved.filter(
          (changeId) => !obsoleteChanges.includes(changeId),
        ).length,
        upstreamConflicts: conflicts.size,
      };
    });
    baselineUpdateQueue = update.then(
      () => undefined,
      () => undefined,
    );
    return update;
  }
}
