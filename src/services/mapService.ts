import { provide } from "@inversifyjs/binding-decorators";
import { inject } from "inversify";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { copyFile, mkdtemp, readFile, rename, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { Worker } from "node:worker_threads";
import { NIL } from "uuid";
import { config, type MapProject } from "../config/values.js";
import { downloadMapFile, downloadMapVersion } from "../fileDownloads.js";
import {
  ConflictError,
  NotFoundError,
  ServiceUnavailableError,
} from "../models/api/error.js";
import type { Change } from "../models/business/change.js";
import {
  changeBusinessToWorker,
  MapWorkerRequest,
  MapWorkerResponse,
} from "../models/business/mapWorker.js";
import {
  ChangeService,
  type ProjectChangeRepository,
} from "./changeService.js";

interface ProjectRuntimeState {
  baselineUpdateQueue: Promise<void>;
  baselineUpdateRevision: number;
  stagedUpstreamReviews: Map<string, StagedUpstreamReview>;
  availabilityError?: Error;
}

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

export interface UpstreamReviewSnapshot {
  id: string;
  baselineVersion: string;
  upstreamVersion: string;
  reconciliation: NonNullable<MapWorkerResponse["reconciliation"]>;
}

interface StagedUpstreamReview extends UpstreamReviewSnapshot {
  mapFile: string;
  directory: string;
}

interface BaselineReplacement {
  baselineVersion: string;
  complete(): Promise<void>;
  reconciliation: NonNullable<MapWorkerResponse["reconciliation"]>;
  rollback(): Promise<void>;
}

export interface BaselineUpdateResult {
  automaticallyResolved: number;
  baselineVersion: string;
  upstreamConflicts: number;
  upstreamConflictDetails: { changeId: string; reason: string }[];
}

@provide(MapService, (binding) => binding.inSingletonScope())
export class MapService {
  private readonly runtimes = new Map<string, ProjectRuntimeState>();
  constructor(@inject(ChangeService) private changeService: ChangeService) {}

  private project(project?: MapProject): MapProject {
    const resolved =
      project ??
      (config.projects.length === 1 ? config.projects[0] : undefined);
    if (!resolved)
      throw new Error(
        "A project context is required in a multi-project deployment",
      );
    return resolved;
  }

  private runtime(project: MapProject): ProjectRuntimeState {
    let runtime = this.runtimes.get(project.id);
    if (!runtime) {
      runtime = {
        baselineUpdateQueue: Promise.resolve(),
        baselineUpdateRevision: 0,
        stagedUpstreamReviews: new Map(),
      };
      this.runtimes.set(project.id, runtime);
    }
    return runtime;
  }

  private assertAvailable(project: MapProject): void {
    const error = this.runtime(project).availabilityError;
    if (error)
      throw new ServiceUnavailableError(
        `Map project ${project.id} is unavailable`,
        { cause: error },
      );
  }

  private changes(project: MapProject): ProjectChangeRepository {
    if (typeof this.changeService.forProject === "function")
      return this.changeService.forProject(project.id);
    // Compatibility for focused unit-test doubles written before project scoping.
    return {
      addChange: (change) => this.changeService.addChange(change, project.id),
      getChanges: (timesSeen, include, exclude) =>
        this.changeService.getChanges(timesSeen, include, exclude, project.id),
      applyChanges: (apply) =>
        this.changeService.applyChanges(apply, project.id),
      reconcileChanges: (resolved) =>
        this.changeService.reconcileChanges(resolved, project.id),
    };
  }

  public async initializeProject(projectDefinition: MapProject): Promise<void> {
    const project = this.project(projectDefinition);
    const runtime = this.runtime(project);
    try {
      if (!existsSync(project.mapFile)) await downloadMapFile(project);
      if (!existsSync(project.versionFile)) await downloadMapVersion(project);
      await this.validateBaselineContents(project);
      runtime.availabilityError = undefined;
    } catch (error) {
      runtime.availabilityError =
        error instanceof Error ? error : new Error(String(error));
      throw error;
    }
  }

  public projectStatus(project: MapProject): {
    id: string;
    name: string;
    status: "ok" | "unavailable";
  } {
    return {
      id: project.id,
      name: project.name,
      status: this.runtime(project).availabilityError ? "unavailable" : "ok",
    };
  }

  public async getTempMapFileName(): Promise<string> {
    return join(await mkdtemp(join(tmpdir(), "mudlet-map-")), "map");
  }

  public async getChangedMapFile(
    timesSeen: number,
    format: "binary" | "json",
    include: string[] = [],
    exclude: string[] = [],
    mapFile?: string,
    rawVersionOverride?: string,
    projectDefinition?: MapProject,
  ): Promise<MapFileSnapshot> {
    const project = this.project(projectDefinition);
    this.assertAvailable(project);
    const runtime = this.runtime(project);
    mapFile ??= project.mapFile;
    // A concurrent baseline update can require regenerating the file.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    while (true) {
      const updateRevision = runtime.baselineUpdateRevision;
      await runtime.baselineUpdateQueue;
      const [changes, rawVersion] = await Promise.all([
        this.changes(project).getChanges(timesSeen, include, exclude),
        rawVersionOverride ?? this.readRawVersion(project),
      ]);
      const file = await this.getTempMapFileName();
      try {
        await this.runMapWorker({
          changes: changes.map(changeBusinessToWorker),
          mapFile,
          operation: format,
          outputFile: file,
        });
        if (updateRevision === runtime.baselineUpdateRevision) {
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

  public async stageUpstreamReview(
    expectedBaselineVersion: string,
    projectDefinition?: MapProject,
  ): Promise<UpstreamReviewSnapshot> {
    const project = this.project(projectDefinition);
    this.assertAvailable(project);
    const runtime = this.runtime(project);
    await runtime.baselineUpdateQueue;
    const baselineVersion = await this.readRawVersion(project);
    if (expectedBaselineVersion !== baselineVersion) {
      throw new ConflictError(
        "The map version provided does not match the current map version",
      );
    }
    const directory = await mkdtemp(
      join(tmpdir(), "crowdmap-upstream-review-"),
    );
    const mapFile = join(directory, "map");
    const versionFile = join(directory, "version");
    try {
      await Promise.all([
        downloadMapFile(project, mapFile),
        downloadMapVersion(project, versionFile),
      ]);
      const upstreamVersion = (await readFile(versionFile, "utf8")).trim();
      if (!upstreamVersion)
        throw new Error("Downloaded upstream version is empty");
      await this.runMapWorker({ changes: [], mapFile, operation: "validate" });
      const changes = await this.changes(project).getChanges(0);
      const response = await this.runMapWorker({
        changes: changes.map(changeBusinessToWorker),
        comparisonMapFile: mapFile,
        mapFile: project.mapFile,
        operation: "reconcile",
      });
      if (!response.reconciliation)
        throw new Error("Map worker returned no reconciliation result");
      const id = randomUUID();
      const staged: StagedUpstreamReview = {
        id,
        baselineVersion,
        upstreamVersion,
        reconciliation: response.reconciliation,
        mapFile,
        directory,
      };
      runtime.stagedUpstreamReviews.set(id, staged);
      setTimeout(
        () => {
          const expired = runtime.stagedUpstreamReviews.get(id);
          if (!expired) return;
          runtime.stagedUpstreamReviews.delete(id);
          void rm(expired.directory, { recursive: true, force: true });
        },
        60 * 60 * 1000,
      ).unref();
      return {
        id: staged.id,
        baselineVersion: staged.baselineVersion,
        upstreamVersion: staged.upstreamVersion,
        reconciliation: staged.reconciliation,
      };
    } catch (error) {
      await rm(directory, { recursive: true, force: true });
      throw error;
    }
  }

  public getStagedUpstreamReview(
    id: string,
    projectDefinition?: MapProject,
  ): StagedUpstreamReview {
    const project = this.project(projectDefinition);
    this.assertAvailable(project);
    const staged = this.runtime(project).stagedUpstreamReviews.get(id);
    if (!staged)
      throw new NotFoundError(
        "The staged upstream review has expired; load it again.",
      );
    return staged;
  }

  public async getRendererSnapshot(
    timesSeen: number,
    include: string[] = [],
    exclude: string[] = [],
    projectDefinition?: MapProject,
  ): Promise<RendererSnapshot> {
    const project = this.project(projectDefinition);
    this.assertAvailable(project);
    const runtime = this.runtime(project);
    // A concurrent baseline update can require regenerating the content.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    while (true) {
      const updateRevision = runtime.baselineUpdateRevision;
      await runtime.baselineUpdateQueue;
      const [changes, rawVersion] = await Promise.all([
        this.changes(project).getChanges(timesSeen, include, exclude),
        this.readRawVersion(project),
      ]);
      const response = await this.runMapWorker({
        changes: changes.map(changeBusinessToWorker),
        mapFile: project.mapFile,
        operation: "renderer",
      });
      if (updateRevision === runtime.baselineUpdateRevision) {
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
    projectDefinition?: MapProject,
  ): Promise<ChangeSnapshot> {
    const project = this.project(projectDefinition);
    this.assertAvailable(project);
    const runtime = this.runtime(project);
    // A concurrent baseline update can require retrying the snapshot.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    while (true) {
      const updateRevision = runtime.baselineUpdateRevision;
      await runtime.baselineUpdateQueue;
      const [changes, rawVersion] = await Promise.all([
        this.changes(project).getChanges(timesSeen, include, exclude),
        this.readRawVersion(project),
      ]);
      if (updateRevision === runtime.baselineUpdateRevision) {
        return {
          changes,
          rawVersion,
          version: this.buildVersion(changes, rawVersion),
        };
      }
    }
  }

  public async getVersion(
    timesSeen: number,
    project?: MapProject,
  ): Promise<string> {
    return (await this.getChangesSnapshot(timesSeen, [], [], project)).version;
  }

  public async getRawVersion(projectDefinition?: MapProject) {
    const project = this.project(projectDefinition);
    this.assertAvailable(project);
    const runtime = this.runtime(project);
    // A concurrent baseline update can require retrying the read.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    while (true) {
      const updateRevision = runtime.baselineUpdateRevision;
      await runtime.baselineUpdateQueue;
      const version = await this.readRawVersion(project);
      if (updateRevision === runtime.baselineUpdateRevision) {
        return version;
      }
    }
  }

  private async readRawVersion(project: MapProject): Promise<string> {
    return (await readFile(project.versionFile, "utf-8")).trim();
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

  public async validateBaseline(projectDefinition?: MapProject): Promise<void> {
    const project = this.project(projectDefinition);
    this.assertAvailable(project);
    const runtime = this.runtime(project);
    await runtime.baselineUpdateQueue;
    await this.validateBaselineContents(project);
  }

  private async validateBaselineContents(project: MapProject): Promise<void> {
    const version = await this.readRawVersion(project);
    if (!version) {
      throw new Error("Baseline version is empty");
    }
    await this.runMapWorker({
      changes: [],
      mapFile: project.mapFile,
      operation: "validate",
    });
  }

  private async replaceBaseline(
    changes: Change[],
    project: MapProject,
  ): Promise<BaselineReplacement> {
    const suffix = randomUUID();
    const stagedMap = `${project.mapFile}.${suffix}.staged`;
    const stagedVersion = `${project.versionFile}.${suffix}.staged`;
    const backupMap = `${project.mapFile}.${suffix}.backup`;
    const backupVersion = `${project.versionFile}.${suffix}.backup`;
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
        downloadMapFile(project, stagedMap),
        downloadMapVersion(project, stagedVersion),
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
        mapFile: project.mapFile,
        operation: "reconcile",
      });
      if (!reconciliationResponse.reconciliation) {
        throw new Error("Map worker returned no reconciliation result");
      }
      reconciliation = reconciliationResponse.reconciliation;
      await Promise.all([
        copyFile(project.mapFile, backupMap),
        copyFile(project.versionFile, backupVersion),
      ]);
      try {
        await rename(stagedMap, project.mapFile);
        await rename(stagedVersion, project.versionFile);
      } catch (error) {
        await Promise.all([
          copyFile(backupMap, project.mapFile),
          copyFile(backupVersion, project.versionFile),
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
          copyFile(backupMap, project.mapFile),
          copyFile(backupVersion, project.versionFile),
        ]);
        await cleanup();
      },
    };
  }

  public async applyBaselineUpdate(
    expectedVersion: string,
    obsoleteChanges: string[],
    projectDefinition?: MapProject,
  ): Promise<BaselineUpdateResult> {
    const project = this.project(projectDefinition);
    this.assertAvailable(project);
    const runtime = this.runtime(project);
    const repository = this.changes(project);
    const update = runtime.baselineUpdateQueue.then(async () => {
      const serverVersion = await this.readRawVersion(project);
      if (expectedVersion !== serverVersion) {
        throw new ConflictError(
          "The map version provided does not match the current map version",
        );
      }

      runtime.baselineUpdateRevision += 1;
      const changes = await repository.getChanges(0);
      const replacement = await this.replaceBaseline(changes, project);
      const automaticallyResolved = replacement.reconciliation
        .filter((result) => result.status === "resolved")
        .map((result) => result.changeId);
      const resolved = Array.from(
        new Set([...obsoleteChanges, ...automaticallyResolved]),
      );
      const conflicts = replacement.reconciliation
        .filter(
          (result) =>
            result.status === "upstream-conflict" &&
            !resolved.includes(result.changeId),
        )
        .map((result) => ({
          changeId: result.changeId,
          reason: result.reason ?? "Upstream changed the reported target.",
        }));
      try {
        await repository.reconcileChanges(resolved);
      } catch (error) {
        await replacement.rollback();
        throw error;
      }
      await replacement.complete();
      return {
        automaticallyResolved: automaticallyResolved.filter(
          (changeId) => !obsoleteChanges.includes(changeId),
        ).length,
        baselineVersion: replacement.baselineVersion,
        upstreamConflicts: conflicts.length,
        upstreamConflictDetails: conflicts,
      };
    });
    runtime.baselineUpdateQueue = update.then(
      () => undefined,
      () => undefined,
    );
    return update;
  }
}
