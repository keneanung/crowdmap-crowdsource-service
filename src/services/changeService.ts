import { provide } from "@inversifyjs/binding-decorators";
import { inject } from "inversify";
import { MongoClient, MongoServerError, type Collection } from "mongodb";
import { config } from "../config/values.js";
import type { Change } from "../models/business/change.js";
import {
  Change as ChangeDb,
  changeBusinessToDb,
  changeDbToBusiness,
} from "../models/db/change.js";

export interface ProjectChangeRepository {
  addChange(change: Change): Promise<void>;
  getChanges(
    timesSeen: number,
    include?: string[],
    exclude?: string[],
    reporter?: string,
  ): Promise<Change[]>;
  applyChanges(apply: string[]): Promise<void>;
  reconcileChanges(resolved: string[]): Promise<void>;
  deleteChanges(changeIds: string[]): Promise<number>;
}

export abstract class ChangeService {
  abstract addChange(change: Change, projectId?: string): Promise<void>;
  abstract getChanges(
    timesSeen: number,
    include?: string[],
    exclude?: string[],
    projectId?: string,
    reporter?: string,
  ): Promise<Change[]>;
  abstract applyChanges(apply: string[], projectId?: string): Promise<void>;
  abstract reconcileChanges(
    resolved: string[],
    projectId?: string,
  ): Promise<void>;
  abstract deleteChanges(
    changeIds: string[],
    projectId?: string,
  ): Promise<number>;

  public async initialize(): Promise<void> {
    const first = config.projects[0];
    await this.getChanges(0, [], [], first.id);
  }

  public forProject(projectId: string): ProjectChangeRepository {
    return Object.freeze({
      addChange: (change: Change) => this.addChange(change, projectId),
      getChanges: (
        timesSeen: number,
        include?: string[],
        exclude?: string[],
        reporter?: string,
      ) => this.getChanges(timesSeen, include, exclude, projectId, reporter),
      applyChanges: (apply: string[]) => this.applyChanges(apply, projectId),
      reconcileChanges: (resolved: string[]) =>
        this.reconcileChanges(resolved, projectId),
      deleteChanges: (changeIds: string[]) =>
        this.deleteChanges(changeIds, projectId),
    });
  }
}

interface ChangeQuery {
  projectId: string;
  numberOfReporters?: { $gte: number };
  $or?: ({ numberOfReporters: { $gte: number } } | { reporters: string })[];
  changeId?: { $in: string[] } | { $nin: string[] };
}

@provide(ChangeService, (binding) => binding.inSingletonScope())
export class MongoChangeService extends ChangeService {
  private collectionReady?: Promise<Collection<ChangeDb>>;
  constructor(@inject(MongoClient) private mongo: MongoClient) {
    super();
  }

  private projectId(projectId?: string): string {
    const resolved =
      projectId ??
      (config.projects.length === 1 ? config.projects[0]?.id : undefined);
    if (!resolved)
      throw new Error("A project ID is required in a multi-project deployment");
    return resolved;
  }

  private async prepareCollection(): Promise<Collection<ChangeDb>> {
    await this.mongo.connect();
    const collection = this.mongo
      .db(config.dbName)
      .collection<ChangeDb>("changes");
    const legacyCount = await collection.countDocuments({
      projectId: { $exists: false },
    });
    if (legacyCount > 0) {
      if (config.projects.length !== 1) {
        throw new Error(
          `${legacyCount.toString()} legacy changes have no projectId. Configure exactly one project, start once to migrate them, then enable multi-project mode.`,
        );
      }
      await collection.updateMany(
        { projectId: { $exists: false } },
        { $set: { projectId: config.projects[0]?.id } },
      );
    }
    for (const name of [
      "unique_logical_change",
      "unique_logical_change_v2",
      "unique_project_logical_change",
      "unique_change_id",
      "vetted_changes",
    ]) {
      let indexExists: boolean;
      try {
        indexExists = await collection.indexExists(name);
      } catch (error) {
        // listIndexes fails before createIndexes has created a fresh collection.
        if (
          error instanceof MongoServerError &&
          (error.code === 26 || error.codeName === "NamespaceNotFound")
        )
          break;
        throw error;
      }
      if (indexExists) {
        try {
          await collection.dropIndex(name);
        } catch (error) {
          if (
            !(error instanceof MongoServerError) ||
            (error.code !== 27 && error.codeName !== "IndexNotFound")
          )
            throw error;
        }
      }
    }
    await collection.createIndexes([
      {
        key: { projectId: 1, changeId: 1 },
        unique: true,
        name: "unique_project_change_id",
      },
      {
        key: {
          projectId: 1,
          type: 1,
          roomNumber: 1,
          name: 1,
          areaId: 1,
          direction: 1,
          destination: 1,
          exitCommand: 1,
          x: 1,
          y: 1,
          z: 1,
          weight: 1,
          environmentId: 1,
          key: 1,
          value: 1,
          symbol: 1,
          hash: 1,
          status: 1,
          labelId: 1,
          label: 1,
        },
        unique: true,
        name: "unique_project_logical_change_v2",
      },
      {
        key: { projectId: 1, numberOfReporters: 1, changeId: 1 },
        name: "project_vetted_changes",
      },
      {
        key: { projectId: 1, reporters: 1, changeId: 1 },
        name: "project_reporter_changes",
      },
    ]);
    return collection;
  }

  private getCollection(): Promise<Collection<ChangeDb>> {
    return (this.collectionReady ??= this.prepareCollection());
  }

  public async addChange(change: Change, projectId?: string): Promise<void> {
    const collection = await this.getCollection();
    const scope = this.projectId(projectId);
    const identifyingParts = {
      projectId: scope,
      ...change.getIdentifyingParts(),
    };
    const changeDb = { ...changeBusinessToDb(change), projectId: scope };
    const reporters = {
      $setUnion: [
        { $ifNull: ["$reporters", []] },
        Array.from(change.reporters),
      ],
    };
    await collection.updateOne(
      identifyingParts,
      [
        {
          $set: {
            ...changeDb,
            changeId: { $ifNull: ["$changeId", change.changeId] },
            reporters,
            numberOfReporters: { $size: reporters },
          },
        },
      ],
      { upsert: true },
    );
  }

  public async getChanges(
    timesSeen: number,
    include: string[] = [],
    exclude: string[] = [],
    projectId?: string,
    reporter?: string,
  ): Promise<Change[]> {
    const collection = await this.getCollection();
    const queryObject: ChangeQuery = {
      projectId: this.projectId(projectId),
      ...(reporter
        ? {
            // The two branches are covered by project_vetted_changes and
            // project_reporter_changes, respectively.
            $or: [
              { numberOfReporters: { $gte: timesSeen } },
              { reporters: reporter },
            ],
          }
        : { numberOfReporters: { $gte: timesSeen } }),
    };
    if (include.length > 0) queryObject.changeId = { $in: include };
    else if (exclude.length > 0) queryObject.changeId = { $nin: exclude };
    return (
      await collection.find(queryObject).sort({ changeId: 1 }).toArray()
    ).map(changeDbToBusiness);
  }

  public async applyChanges(
    apply: string[],
    projectId?: string,
  ): Promise<void> {
    const collection = await this.getCollection();
    await collection.deleteMany({
      projectId: this.projectId(projectId),
      changeId: { $in: apply },
    });
  }

  public async reconcileChanges(
    resolved: string[],
    projectId?: string,
  ): Promise<void> {
    if (resolved.length === 0) return;
    const collection = await this.getCollection();
    await collection.deleteMany({
      projectId: this.projectId(projectId),
      changeId: { $in: resolved },
    });
  }

  public async deleteChanges(
    changeIds: string[],
    projectId?: string,
  ): Promise<number> {
    if (changeIds.length === 0) return 0;
    const collection = await this.getCollection();
    const result = await collection.deleteMany({
      projectId: this.projectId(projectId),
      changeId: { $in: changeIds },
    });
    return result.deletedCount;
  }
}
