import { inject } from "inversify";
import { provide } from "@inversifyjs/binding-decorators";
import { MongoClient, MongoServerError } from "mongodb";
import { config } from "../config/values";
import { ConflictError } from "../models/api/error";
import { User } from "../models/business/user";

export abstract class UserDbService {
  abstract addUser(user: User): Promise<void>;
  abstract getUsers(): Promise<User[]>;
  abstract updateApiKey(user: User, newApiKey: string): Promise<void>;
}

@provide(UserDbService)
export class MongoUserDbService implements UserDbService {
  private indexesReady?: Promise<string>;

  constructor(@inject(MongoClient) private mongo: MongoClient) {}

  private async getCollection() {
    await this.mongo.connect();
    const db = this.mongo.db(config.dbName);
    const collection = db.collection<User>("users");
    this.indexesReady ??= collection.createIndex(
      { name: 1 },
      { unique: true, name: "unique_user_name" },
    );
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

  public async getUsers(): Promise<User[]> {
    const collection = await this.getCollection();
    return collection.find().toArray();
  }

  public async updateApiKey(user: User, newApiKey: string) {
    const collection = await this.getCollection();
    await collection.updateOne(
      { name: user.name },
      { $set: { hashed_api_key: newApiKey } },
    );
  }
}
