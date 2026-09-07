import { provide } from "@inversifyjs/binding-decorators";
import { inject } from "inversify";
import { MongoClient, MongoServerError } from "mongodb";
import { config } from "../config/values.js";
import type { KofiPayment, SponsorshipProgress } from "../models/business/sponsorship.js";

interface StoredPayment extends KofiPayment {
  month: string;
}

const monthFor = (date: Date): string => date.toISOString().slice(0, 7);

@provide(SponsorshipService)
export class SponsorshipService {
  constructor(@inject(MongoClient) private readonly mongo: MongoClient) {}

  public isEnabled(): boolean {
    return Boolean(config.kofiProfileUrl);
  }

  private async getCollection() {
    await this.mongo.connect();
    const collection = this.mongo.db(config.dbName).collection<StoredPayment>("kofi_payments");
    await collection.createIndexes([
      { key: { eventId: 1 }, unique: true, name: "unique_kofi_event" },
      { key: { month: 1, currency: 1 }, name: "monthly_kofi_totals" },
    ]);
    return collection;
  }

  public async recordPayment(payment: KofiPayment): Promise<void> {
    const collection = await this.getCollection();
    try {
      await collection.insertOne({ ...payment, month: monthFor(payment.receivedAt) });
    } catch (error) {
      if (error instanceof MongoServerError && error.code === 11000) {
        return;
      }
      throw error;
    }
  }

  public async getProgress(now = new Date()): Promise<SponsorshipProgress | undefined> {
    if (!config.kofiProfileUrl || config.kofiMonthlyGoal === undefined) {
      return undefined;
    }
    const month = monthFor(now);
    const collection = await this.getCollection();
    const total = await collection
      .aggregate<{ raised: number }>([
        { $match: { month, currency: config.kofiCurrency } },
        { $group: { _id: null, raised: { $sum: "$amount" } } },
      ])
      .toArray();
    return {
      currency: config.kofiCurrency,
      goal: config.kofiMonthlyGoal,
      raised: total[0]?.raised ?? 0,
      month,
      profileUrl: config.kofiProfileUrl,
    };
  }
}
