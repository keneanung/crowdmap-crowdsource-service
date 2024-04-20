import { provide } from "inversify-binding-decorators";
import { MongoClient } from "mongodb";
import { config } from "../config/values";
import { Change } from "../models/business/change";
import {
  Change as ChangeDb,
  changeBusinessToDb,
  changeDbToBusiness,
} from "../models/db/change";

export abstract class ChangeService {
  abstract addChange(change: Change): Promise<void>;
  abstract getChanges(
    timesSeen: number,
    include?: number[],
    exclude?: number[],
  ): Promise<Change[]>;
  abstract applyChanges(apply: number[]): Promise<void>;
}

interface ChangeQuery {
  numberOfReporters: { $gte: number };
  changeId?: { $in: number[] } | { $nin: number[] };
}

@provide(ChangeService)
export class MongoChangeService implements ChangeService {
  private mongo: MongoClient;
  private connected = false;

  constructor() {
    if (!config.connectionString) {
      throw new Error("Missing connection string");
    }
    this.mongo = new MongoClient(config.connectionString);
  }

  private async connect() {
    await this.mongo.connect();
    this.connected = true;
  }

  private async getCollection() {
    if (!this.connected) {
      await this.connect();
    }
    const db = this.mongo.db(config.dbName);
    const collection = db.collection<ChangeDb>("changes");
    return collection;
  }

  public async addChange(change: Change) {
    const collection = await this.getCollection();
    const existingChange = await collection.findOne(
      change.getIdentifyingParts(),
    );
    if (existingChange) {
      const existingChangeBusiness = changeDbToBusiness(existingChange);
      change.reporters.forEach((reporter) =>
        existingChangeBusiness.reporters.add(reporter),
      );
      await collection.updateOne(
        { _id: existingChange._id },
        {
          $set: {
            reporters: Array.from(existingChangeBusiness.reporters),
            numberOfReporters: existingChangeBusiness.reporters.size,
          },
        },
      );
    } else {
      const changeDb = changeBusinessToDb(change);
      await collection.insertOne(changeDb);
    }
  }

  public async getChanges(
    timesSeen: number,
    include: number[] = [],
    exclude: number[] = [],
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

  public async applyChanges(apply: number[]) {
    const collection = await this.getCollection();
    await collection.deleteMany({ changeId: { $in: apply } });
  }
}
