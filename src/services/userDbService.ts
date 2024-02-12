import { MongoClient } from "mongodb";
import { config } from "../config/values";
import { provideSingleton } from "../ioc/provideSingleton";
import { User } from "../models/business/user";

export abstract class UserDbService {
  abstract addUser(user: User): Promise<void>;
  abstract getUsers(): Promise<User[]>;
  abstract updateApiKey(user: User, newApiKey: string): Promise<void>;
}

@provideSingleton(UserDbService)
export class MongoUserDbService implements UserDbService {
  private mongo: MongoClient;
  private connected = false;

  constructor() {
    if (!config.connectionString) {
      throw new Error("Missing connection string");
    }
    this.mongo = new MongoClient(config.connectionString);
  }

  private async getCollection() {
    if (!this.connected) {
      await this.connect();
    }
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

  private async connect() {
    await this.mongo.connect();
    this.connected = true;
  }

  public async updateApiKey(user: User, newApiKey: string) {
    const collection = await this.getCollection();
    await collection.updateOne(
      { name: user.name },
      { $set: { api_key: newApiKey } },
    );
  }
}
