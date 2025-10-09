import { provide } from "inversify-binding-decorators";
import { MongoClient } from "mongodb";
import { config } from "../config/values";
import { Change } from "../models/business/change";
import {
  Change as ChangeDb,
  changeBusinessToDb,
  changeDbToBusiness,
} from "../models/db/change";
import { inject } from "inversify";

export abstract class ChangeService {
  abstract addChange(change: Change): Promise<void>;
  abstract getChanges(
    timesSeen: number,
    include?: string[],
    exclude?: string[],
  ): Promise<Change[]>;
  abstract applyChanges(apply: string[]): Promise<void>;
}

interface ChangeQuery {
  numberOfReporters: { $gte: number };
  changeId?: { $in: string[] } | { $nin: string[] };
}

@provide(ChangeService)
export class MongoChangeService implements ChangeService {

  constructor(@inject(MongoClient) private mongo: MongoClient) {  }

  private async getCollection() {
    await this.mongo.connect();
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
}
