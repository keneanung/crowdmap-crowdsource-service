import { provide } from "@inversifyjs/binding-decorators";
import { inject } from "inversify";
import { MongoClient } from "mongodb";
import { config } from "../config/values.js";
import type { Change, UpstreamConflict } from "../models/business/change.js";
import {
  Change as ChangeDb,
  changeBusinessToDb,
  changeDbToBusiness,
} from "../models/db/change.js";

export abstract class ChangeService {
  abstract addChange(change: Change): Promise<void>;
  abstract getChanges(
    timesSeen: number,
    include?: string[],
    exclude?: string[],
  ): Promise<Change[]>;
  abstract applyChanges(apply: string[]): Promise<void>;
  abstract reconcileChanges(
    resolved: string[],
    conflicts: Map<string, UpstreamConflict>,
  ): Promise<void>;
}

interface ChangeQuery {
  numberOfReporters: { $gte: number };
  changeId?: { $in: string[] } | { $nin: string[] };
}

@provide(ChangeService)
export class MongoChangeService implements ChangeService {
  private indexesReady?: Promise<string[]>;

  constructor(@inject(MongoClient) private mongo: MongoClient) {}

  private async getCollection() {
    await this.mongo.connect();
    const db = this.mongo.db(config.dbName);
    const collection = db.collection<ChangeDb>("changes");
    this.indexesReady ??= (async () => {
      if (await collection.indexExists("unique_logical_change")) {
        await collection.dropIndex("unique_logical_change");
      }
      return await collection.createIndexes([
        {
          key: { changeId: 1 },
          unique: true,
          name: "unique_change_id",
        },
        {
          key: {
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
          },
          unique: true,
          name: "unique_logical_change_v2",
        },
        {
          key: { numberOfReporters: 1, changeId: 1 },
          name: "vetted_changes",
        },
      ]);
    })();
    await this.indexesReady;
    return collection;
  }

  public async addChange(change: Change) {
    const collection = await this.getCollection();
    const identifyingParts = change.getIdentifyingParts();
    const changeDb = changeBusinessToDb(change);
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
        { $unset: "upstreamConflict" },
      ],
      { upsert: true },
    );
  }

  public async getChanges(
    timesSeen: number,
    include: string[] = [],
    exclude: string[] = [],
  ) {
    const collection = await this.getCollection();

    const queryObject: ChangeQuery = {
      numberOfReporters: { $gte: timesSeen },
    };
    if (include.length > 0) {
      queryObject.changeId = { $in: include };
    } else if (exclude.length > 0) {
      queryObject.changeId = { $nin: exclude };
    }
    const changes = await collection
      .find(queryObject)
      .sort({ changeId: 1 })
      .toArray();
    return changes.map(changeDbToBusiness);
  }

  public async applyChanges(apply: string[]) {
    const collection = await this.getCollection();
    await collection.deleteMany({ changeId: { $in: apply } });
  }

  public async reconcileChanges(
    resolved: string[],
    conflicts: Map<string, UpstreamConflict>,
  ): Promise<void> {
    const collection = await this.getCollection();
    const operations = [
      ...(resolved.length > 0
        ? [{ deleteMany: { filter: { changeId: { $in: resolved } } } }]
        : []),
      ...Array.from(conflicts, ([changeId, upstreamConflict]) => ({
        updateOne: {
          filter: { changeId },
          update: { $set: { upstreamConflict } },
        },
      })),
    ];
    if (operations.length > 0) await collection.bulkWrite(operations);
  }
}
