import { provide } from "@inversifyjs/binding-decorators";
import { inject } from "inversify";
import { MongoClient, MongoServerError } from "mongodb";
import { config } from "../config/values.js";
import type { KofiPayment, SponsorshipProgress } from "../models/business/sponsorship.js";

interface StoredPayment extends KofiPayment {
  remainingAmount?: number;
}

interface SponsorshipState {
  _id: "settlement";
  activeMonth: string;
}

interface ConsumedEvent {
  eventId: string;
  expiresAt: Date;
}

const DEDUPLICATION_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

const monthFor = (date: Date): string => date.toISOString().slice(0, 7);

const nextMonth = (month: string): string => {
  const [year, calendarMonth] = month.split("-").map(Number);
  const next = new Date(Date.UTC(year, calendarMonth));
  return monthFor(next);
};

@provide(SponsorshipService)
export class SponsorshipService {
  constructor(@inject(MongoClient) private readonly mongo: MongoClient) {}

  public isEnabled(): boolean {
    return Boolean(config.kofiProfileUrl);
  }

  private async getCollections() {
    await this.mongo.connect();
    const database = this.mongo.db(config.dbName);
    const payments = database.collection<StoredPayment>("kofi_payments");
    const state = database.collection<SponsorshipState>("sponsorship_state");
    const consumedEvents = database.collection<ConsumedEvent>("kofi_consumed_events");
    await payments.createIndexes([
      { key: { eventId: 1 }, unique: true, name: "unique_kofi_event" },
      { key: { currency: 1, receivedAt: 1 }, name: "sponsorship_credits" },
    ]);
    await consumedEvents.createIndexes([
      { key: { eventId: 1 }, unique: true, name: "unique_consumed_kofi_event" },
      { key: { expiresAt: 1 }, expireAfterSeconds: 0, name: "expired_consumed_kofi_events" },
    ]);
    return { consumedEvents, payments, state };
  }

  private async settleCompletedMonths(now: Date): Promise<void> {
    const { consumedEvents, payments, state } = await this.getCollections();
    const currentMonth = monthFor(now);
    const existingState = await state.findOne({ _id: "settlement" });
    let activeMonth = existingState?.activeMonth ?? currentMonth;
    if (!existingState) {
      await state.insertOne({ _id: "settlement", activeMonth });
    }

    while (activeMonth < currentMonth) {
      let amountToUse = config.kofiMonthlyGoal ?? 0;
      const credits = await payments
        .find({ currency: config.kofiCurrency })
        .sort({ receivedAt: 1, eventId: 1 })
        .toArray();
      for (const credit of credits) {
        if (amountToUse <= 0) break;
        const remainingAmount = credit.remainingAmount ?? credit.amount;
        const afterSettlement = remainingAmount - Math.min(remainingAmount, amountToUse);
        amountToUse -= remainingAmount - afterSettlement;
        if (afterSettlement <= 0) {
          await consumedEvents.updateOne(
            { eventId: credit.eventId },
            {
              $set: {
                eventId: credit.eventId,
                expiresAt: new Date(now.getTime() + DEDUPLICATION_RETENTION_MS),
              },
            },
            { upsert: true },
          );
          await payments.deleteOne({ eventId: credit.eventId });
        } else {
          await payments.updateOne(
            { eventId: credit.eventId },
            { $set: { remainingAmount: afterSettlement } },
          );
        }
      }
      activeMonth = nextMonth(activeMonth);
      await state.updateOne({ _id: "settlement" }, { $set: { activeMonth } });
    }
  }

  public async recordPayment(payment: KofiPayment): Promise<void> {
    await this.settleCompletedMonths(new Date());
    const { consumedEvents, payments } = await this.getCollections();
    if (await consumedEvents.findOne({ eventId: payment.eventId })) {
      return;
    }
    try {
      await payments.insertOne({ ...payment, remainingAmount: payment.amount });
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
    await this.settleCompletedMonths(now);
    const { payments } = await this.getCollections();
    const credits = await payments
      .find({ currency: config.kofiCurrency })
      .toArray();
    const raised = credits.reduce(
      (total, credit) => total + (credit.remainingAmount ?? credit.amount),
      0,
    );
    return {
      currency: config.kofiCurrency,
      goal: config.kofiMonthlyGoal,
      raised,
      month,
      profileUrl: config.kofiProfileUrl,
    };
  }
}
