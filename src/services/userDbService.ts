import { provide } from "@inversifyjs/binding-decorators";
import { inject } from "inversify";
import { MongoClient, MongoServerError } from "mongodb";
import { config } from "../config/values";
import { ConflictError } from "../models/api/error";
import { User } from "../models/business/user";

export abstract class UserDbService {
  abstract addUser(user: User): Promise<void>;
  abstract addUserIfMissing(user: User): Promise<boolean>;
  abstract getUserByApiKeyId(apiKeyId: string): Promise<User | undefined>;
  abstract getUserByName(name: string): Promise<User | undefined>;
  abstract getUsersWithoutApiKeyId(): Promise<User[]>;
  abstract getUsers(): Promise<User[]>;
  abstract deleteUser(name: string): Promise<boolean>;
  abstract updateRoles(name: string, roles: User["roles"]): Promise<boolean>;
  abstract updateApiKey(
    user: User,
    newApiKey: string,
    apiKeyId: string,
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
        key: { api_key_id: 1 },
        unique: true,
        sparse: true,
        name: "unique_api_key_id",
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
    try {
      const result = await collection.updateOne(
        { name: user.name },
        { $setOnInsert: user },
        { upsert: true },
      );
      return result.upsertedCount === 1;
    } catch (error) {
      if (error instanceof MongoServerError && error.code === 11000) {
        const existingUser = await collection.findOne({ name: user.name });
        if (existingUser) {
          return false;
        }
      }
      throw error;
    }
  }

  public async getUsers(): Promise<User[]> {
    const collection = await this.getCollection();
    return collection.find().toArray();
  }

  public async deleteUser(name: string): Promise<boolean> {
    const collection = await this.getCollection();
    return (await collection.deleteOne({ name })).deletedCount === 1;
  }

  public async updateRoles(
    name: string,
    roles: User["roles"],
  ): Promise<boolean> {
    const collection = await this.getCollection();
    return (
      (await collection.updateOne({ name }, { $set: { roles } }))
        .matchedCount === 1
    );
  }

  public async getUserByApiKeyId(apiKeyId: string): Promise<User | undefined> {
    const collection = await this.getCollection();
    return (await collection.findOne({ api_key_id: apiKeyId })) ?? undefined;
  }

  public async getUserByName(name: string): Promise<User | undefined> {
    const collection = await this.getCollection();
    return (await collection.findOne({ name })) ?? undefined;
  }

  public async getUsersWithoutApiKeyId(): Promise<User[]> {
    const collection = await this.getCollection();
    return collection.find({ api_key_id: { $exists: false } }).toArray();
  }

  public async updateApiKey(user: User, newApiKey: string, apiKeyId: string) {
    const collection = await this.getCollection();
    await collection.updateOne(
      { name: user.name },
      { $set: { hashed_api_key: newApiKey, api_key_id: apiKeyId } },
    );
  }
}
