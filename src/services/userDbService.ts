import { inject } from "inversify";
import { provide } from "@inversifyjs/binding-decorators";
import { MongoClient, MongoServerError } from "mongodb";
import { config } from "../config/values";
import { ConflictError } from "../models/api/error";
import { User } from "../models/business/user";

export abstract class UserDbService {
  abstract addUser(user: User): Promise<void>;
  abstract addUserIfMissing(user: User): Promise<boolean>;
  abstract getUserByApiKeyLookup(lookup: string): Promise<User | undefined>;
  abstract getUsersWithoutApiKeyLookup(): Promise<User[]>;
  abstract setApiKeyLookup(user: User, lookup: string): Promise<void>;
  abstract getUsers(): Promise<User[]>;
  abstract updateApiKey(
    user: User,
    newApiKey: string,
    lookup: string,
  ): Promise<void>;
}

@provide(UserDbService)
export class MongoUserDbService implements UserDbService {
  private indexesReady?: Promise<string[]>;

  constructor(@inject(MongoClient) private mongo: MongoClient) {}

  private async getCollection() {
    await this.mongo.connect();
    const db = this.mongo.db(config.dbName);
    const collection = db.collection<User>("users");
    this.indexesReady ??= collection.createIndexes([
      { key: { name: 1 }, unique: true, name: "unique_user_name" },
      {
        key: { api_key_lookup: 1 },
        unique: true,
        sparse: true,
        name: "unique_api_key_lookup",
      },
    ]);
    await this.indexesReady;
    return collection;
  }

  public async addUser(user: User): Promise<void> {
    const collection = await this.getCollection();
    try {
      await collection.insertOne(user);
    } catch (error) {
      if (error instanceof MongoServerError && error.code === 11000) {
        throw new ConflictError("User already exists");
      }
      throw error;
    }
  }

  public async addUserIfMissing(user: User): Promise<boolean> {
    const collection = await this.getCollection();
    const result = await collection.updateOne(
      { name: user.name },
      { $setOnInsert: user },
      { upsert: true },
    );
    return result.upsertedCount === 1;
  }

  public async getUsers(): Promise<User[]> {
    const collection = await this.getCollection();
    return collection.find().toArray();
  }

  public async getUserByApiKeyLookup(
    lookup: string,
  ): Promise<User | undefined> {
    const collection = await this.getCollection();
    return (await collection.findOne({ api_key_lookup: lookup })) ?? undefined;
  }

  public async getUsersWithoutApiKeyLookup(): Promise<User[]> {
    const collection = await this.getCollection();
    return collection.find({ api_key_lookup: { $exists: false } }).toArray();
  }

  public async setApiKeyLookup(user: User, lookup: string): Promise<void> {
    const collection = await this.getCollection();
    await collection.updateOne(
      { name: user.name },
      { $set: { api_key_lookup: lookup } },
    );
  }

  public async updateApiKey(user: User, newApiKey: string, lookup: string) {
    const collection = await this.getCollection();
    await collection.updateOne(
      { name: user.name },
      { $set: { hashed_api_key: newApiKey, api_key_lookup: lookup } },
    );
  }
}
