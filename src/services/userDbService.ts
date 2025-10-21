import { inject } from "inversify";
import { provide } from "@inversifyjs/binding-decorators";
import { MongoClient } from "mongodb";
import { config } from "../config/values";
import { User } from "../models/business/user";

export abstract class UserDbService {
  abstract addUser(user: User): Promise<void>;
  abstract getUsers(): Promise<User[]>;
  abstract updateApiKey(user: User, newApiKey: string): Promise<void>;
}

@provide(UserDbService)
export class MongoUserDbService implements UserDbService {
  constructor(@inject(MongoClient) private mongo: MongoClient) {}

  private async getCollection() {
    await this.mongo.connect();
    const db = this.mongo.db(config.dbName);
    const collection = db.collection<User>("users");
    return collection;
  }

  public async addUser(user: User): Promise<void> {
    const collection = await this.getCollection();
    await collection.insertOne(user);
  }

  public async getUsers(): Promise<User[]> {
    const collection = await this.getCollection();
    return collection.find().toArray();
  }

  public async updateApiKey(user: User, newApiKey: string) {
    const collection = await this.getCollection();
    await collection.updateOne(
      { name: user.name },
      { $set: { api_key: newApiKey } },
    );
  }
}
