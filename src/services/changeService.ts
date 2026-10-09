import { provide } from "@inversifyjs/binding-decorators";
import { inject } from "inversify";
import { MongoClient, MongoServerError, type Collection } from "mongodb";
import { config } from "../config/values.js";
import type { Change } from "../models/business/change.js";
import {
  observationProperty,
  observedReport,
  type CurrentObservation,
  type ObservedReport,
} from "../models/business/observation.js";
import {
  Change as ChangeDb,
  changeBusinessToDb,
  changeDbToBusiness,
} from "../models/db/change.js";

export type ObservationResponse = Omit<ObservedReport, "order">;

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
  public getObservations(_projectId?: string): Promise<ObservationResponse[]> {
    return Promise.resolve([]);
  }
  public deleteObservations(
    _ids: string[],
    _projectId?: string,
  ): Promise<number> {
    return Promise.resolve(0);
  }
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

@provide(ChangeService, (binding) => binding.inSingletonScope())
export class MongoChangeService extends ChangeService {
  private observations?: Collection<CurrentObservation>;
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
    const observations = this.mongo
      .db(config.dbName)
      .collection<CurrentObservation>("observations");
    await observations.createIndexes([
      {
        key: { projectId: 1, reporter: 1, property: 1 },
        unique: true,
        name: "unique_current_observation",
      },
      {
        key: { projectId: 1, "reports.changeId": 1 },
        name: "observations_by_report",
      },
      {
        key: { projectId: 1, "reports.observationId": 1 },
        name: "observations_by_id",
      },
    ]);
    // Resumable backfill: preserve every legacy vote, then clear the old
    // arrays only once that report's votes have all been stored successfully.
    for await (const legacy of collection.find({ reporters: { $ne: [] } })) {
      if (!legacy.projectId)
        throw new Error("Legacy report has no project identity");
      const property = observationProperty(changeDbToBusiness(legacy));
      const timestamp = Number.parseInt(
        legacy.changeId.replaceAll("-", "").slice(0, 12),
        16,
      );
      for (const reporter of legacy.reporters) {
        const identity = { projectId: legacy.projectId, reporter, property };
        try {
          await observations.updateOne(
            {
              ...identity,
              legacy: { $ne: false },
              "reports.changeId": { $ne: legacy.changeId },
            },
            {
              $setOnInsert: { ...identity, legacy: true },
              $addToSet: {
                reports: observedReport(
                  legacy.changeId,
                  legacy.changeId,
                  new Date(Number.isFinite(timestamp) ? timestamp : 0),
                ),
              },
            },
            { upsert: true },
          );
        } catch (error) {
          // Existing migrated support or a concurrent fresh observation wins.
          if (!(error instanceof MongoServerError) || error.code !== 11000)
            throw error;
        }
      }
      await collection.updateOne(
        { projectId: legacy.projectId, changeId: legacy.changeId },
        { $set: { reporters: [], numberOfReporters: 0 } },
      );
    }
    this.observations = observations;
    return collection;
  }

  private getCollection(): Promise<Collection<ChangeDb>> {
    return (this.collectionReady ??= this.prepareCollection());
  }

  private observationCollection(): Collection<CurrentObservation> {
    if (!this.observations)
      throw new Error("Observation storage is not initialized");
    return this.observations;
  }

  public async addChange(change: Change, projectId?: string): Promise<void> {
    const collection = await this.getCollection();
    const scope = this.projectId(projectId);
    const identifyingParts = {
      projectId: scope,
      ...change.getIdentifyingParts(),
    };
    let definition: ChangeDb | null;
    try {
      definition = await collection.findOneAndUpdate(
        identifyingParts,
        {
          $setOnInsert: {
            ...changeBusinessToDb(change),
            projectId: scope,
            reporters: [],
            numberOfReporters: 0,
          },
        },
        { upsert: true, returnDocument: "after" },
      );
    } catch (error) {
      if (!(error instanceof MongoServerError) || error.code !== 11000)
        throw error;
      definition = await collection.findOne(identifyingParts);
    }
    if (!definition) throw new Error("Could not store report definition");
    const property = observationProperty(change);
    const observedAt = new Date();
    for (const reporter of change.reporters) {
      const identity = { projectId: scope, reporter, property };
      const observation = observedReport(
        definition.changeId,
        change.changeId,
        observedAt,
      );
      // MongoDB assigns the timestamp inside the atomic write, avoiding
      // application-host clock differences when ordering remaining support.
      const update = [
        {
          $set: {
            legacy: false,
            reports: [
              {
                $mergeObjects: [
                  { $literal: observation },
                  { observedAt: "$$NOW" },
                ],
              },
            ],
          },
        },
      ];
      try {
        await this.observationCollection().updateOne(identity, update, {
          upsert: true,
        });
      } catch (error) {
        if (!(error instanceof MongoServerError) || error.code !== 11000)
          throw error;
        // Concurrent first submissions can race on the unique identity index.
        await this.observationCollection().updateOne(identity, update);
      }
    }
  }

  public async getChanges(
    timesSeen: number,
    include: string[] = [],
    exclude: string[] = [],
    projectId?: string,
    reporter?: string,
  ): Promise<Change[]> {
    await this.getCollection();
    const scope = this.projectId(projectId);
    const selected = include.length
      ? { "reports.changeId": { $in: include } }
      : exclude.length
        ? { "reports.changeId": { $nin: exclude } }
        : {};
    const eligibility = reporter
      ? {
          $or: [
            { numberOfReporters: { $gte: timesSeen } },
            { reporters: reporter },
          ],
        }
      : { numberOfReporters: { $gte: timesSeen } };
    const results = await this.observationCollection()
      .aggregate<ChangeDb>([
        { $match: { projectId: scope } },
        { $unwind: "$reports" },
        { $match: selected },
        {
          $sort: {
            "reports.observedAt": 1,
            "reports.order": 1,
            "reports.observationId": 1,
          },
        },
        {
          $group: {
            _id: "$reports.changeId",
            reporters: { $addToSet: "$reporter" },
            latest: { $last: "$reports" },
          },
        },
        { $set: { numberOfReporters: { $size: "$reporters" } } },
        { $match: eligibility },
        {
          $lookup: {
            from: "changes",
            localField: "_id",
            foreignField: "changeId",
            pipeline: [{ $match: { projectId: scope } }],
            as: "definition",
          },
        },
        { $unwind: "$definition" },
        { $sort: { "latest.observedAt": 1, "latest.order": 1, _id: 1 } },
        {
          $replaceWith: {
            $mergeObjects: [
              "$definition",
              {
                reporters: "$reporters",
                numberOfReporters: "$numberOfReporters",
              },
            ],
          },
        },
      ])
      .toArray();
    return results.map(changeDbToBusiness);
  }

  public override async getObservations(
    projectId?: string,
  ): Promise<ObservationResponse[]> {
    await this.getCollection();
    return this.observationCollection()
      .aggregate<ObservationResponse>([
        { $match: { projectId: this.projectId(projectId) } },
        { $unwind: "$reports" },
        { $replaceWith: "$reports" },
        { $sort: { observedAt: 1, order: 1, observationId: 1 } },
        { $project: { _id: 0, observationId: 1, changeId: 1, observedAt: 1 } },
      ])
      .toArray();
  }
  public override async deleteObservations(
    ids: string[],
    projectId?: string,
  ): Promise<number> {
    if (!ids.length) return 0;
    await this.getCollection();
    const scope = this.projectId(projectId);
    const selected = (await this.getObservations(scope)).filter((o) =>
      ids.includes(o.observationId),
    );
    await this.observationCollection().updateMany(
      { projectId: scope, "reports.observationId": { $in: ids } },
      { $pull: { reports: { observationId: { $in: ids } } } },
    );
    return selected.length;
  }
  public async applyChanges(
    apply: string[],
    projectId?: string,
  ): Promise<void> {
    await this.deleteChanges(apply, projectId);
  }
  public async reconcileChanges(
    resolved: string[],
    projectId?: string,
  ): Promise<void> {
    await this.deleteChanges(resolved, projectId);
  }
  public async deleteChanges(
    changeIds: string[],
    projectId?: string,
  ): Promise<number> {
    if (!changeIds.length) return 0;
    await this.getCollection();
    const scope = this.projectId(projectId);
    const active = await this.getChanges(0, changeIds, [], scope);
    await this.observationCollection().updateMany(
      { projectId: scope, "reports.changeId": { $in: changeIds } },
      { $pull: { reports: { changeId: { $in: changeIds } } } },
    );
    return active.length;
  }
}
