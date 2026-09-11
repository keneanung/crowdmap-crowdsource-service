import { provide } from "@inversifyjs/binding-decorators";
import { inject } from "inversify";
import { MongoClient, MongoServerError } from "mongodb";
import { randomUUID } from "node:crypto";
import { config } from "../config/values.js";
import type {
  KofiPayment,
  SponsorshipProgress,
} from "../models/business/sponsorship.js";

interface StoredPayment extends KofiPayment {
  remainingAmount?: number;
  settledAmount?: number;
  settledMonth?: string;
}

interface SponsorshipState {
  _id: "settlement";
  activeMonth: string;
  lockId?: string;
  lockExpiresAt?: Date;
}

interface ConsumedEvent {
  eventId: string;
  expiresAt: Date;
}

const DEDUPLICATION_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const SETTLEMENT_LOCK_MS = 2 * 60 * 1000;

const monthFor = (date: Date): string => date.toISOString().slice(0, 7);

const nextMonth = (month: string): string => {
  const [year, calendarMonth] = month.split("-").map(Number);
  const next = new Date(Date.UTC(year, calendarMonth));
  return monthFor(next);
};

const monthStart = (month: string): Date =>
  new Date(`${month}-01T00:00:00.000Z`);

const toMinorUnits = (amount: number): number => {
  const value = Math.round(amount * 10 ** config.kofiCurrencyDecimalPlaces);
  if (!Number.isSafeInteger(value))
    throw new Error("Ko-fi payment amount is too large");
  return value;
};

const fromMinorUnits = (amount: number): number =>
  amount / 10 ** config.kofiCurrencyDecimalPlaces;

@provide(SponsorshipService)
export class SponsorshipService {
  private indexesReady?: Promise<void>;
  private settling?: Promise<void>;

  constructor(@inject(MongoClient) private readonly mongo: MongoClient) {}

  public isEnabled(): boolean {
    return Boolean(config.kofiProfileUrl);
  }

  private async getCollections() {
    await this.mongo.connect();
    const database = this.mongo.db(config.dbName);
    const payments = database.collection<StoredPayment>("kofi_payments");
    const state = database.collection<SponsorshipState>("sponsorship_state");
    const consumedEvents = database.collection<ConsumedEvent>(
      "kofi_consumed_events",
    );
    this.indexesReady ??= Promise.all([
      payments.createIndexes([
        { key: { eventId: 1 }, unique: true, name: "unique_kofi_event" },
        { key: { currency: 1, receivedAt: 1 }, name: "sponsorship_credits" },
      ]),
      consumedEvents.createIndexes([
        {
          key: { eventId: 1 },
          unique: true,
          name: "unique_consumed_kofi_event",
        },
        {
          key: { expiresAt: 1 },
          expireAfterSeconds: 0,
          name: "expired_consumed_kofi_events",
        },
      ]),
    ]).then(() => undefined);
    await this.indexesReady;
    return { consumedEvents, payments, state };
  }

  private async settleCompletedMonths(now: Date): Promise<void> {
    return (this.settling ??= this.settleSequentially(now).finally(() => {
      this.settling = undefined;
    }));
  }

  private async settleSequentially(now: Date): Promise<void> {
    const { consumedEvents, payments, state } = await this.getCollections();
    const currentMonth = monthFor(now);
    const existingState = await state.findOne({ _id: "settlement" });
    const initialActiveMonth = existingState?.activeMonth ?? currentMonth;
    if (!existingState) {
      try {
        await state.updateOne(
          { _id: "settlement" },
          { $setOnInsert: { activeMonth: initialActiveMonth } },
          { upsert: true },
        );
      } catch (error) {
        if (!(error instanceof MongoServerError) || error.code !== 11000)
          throw error;
      }
    }

    const lockId = randomUUID();
    let acquired = false;
    while (!acquired) {
      const result = await state.updateOne(
        {
          _id: "settlement",
          $or: [
            { lockId: { $exists: false } },
            { lockExpiresAt: { $lte: new Date() } },
          ],
        },
        {
          $set: {
            lockId,
            lockExpiresAt: new Date(Date.now() + SETTLEMENT_LOCK_MS),
          },
        },
      );
      acquired = result.matchedCount === 1;
      if (!acquired)
        await new Promise<void>((resolve) => setTimeout(resolve, 25));
    }

    try {
      let activeMonth =
        (await state.findOne({ _id: "settlement" }))?.activeMonth ??
        currentMonth;
      while (activeMonth < currentMonth) {
        let amountToUse = toMinorUnits(config.kofiMonthlyGoal ?? 0);
        const cutoff = monthStart(nextMonth(activeMonth));
        const credits = await payments
          .find({ currency: config.kofiCurrency, receivedAt: { $lt: cutoff } })
          .sort({ receivedAt: 1, eventId: 1 })
          .toArray();
        for (const credit of credits) {
          if (credit.settledMonth === activeMonth) {
            amountToUse = Math.max(
              0,
              amountToUse - toMinorUnits(credit.settledAmount ?? 0),
            );
            continue;
          }
          if (amountToUse === 0) break;
          const remainingAmount = toMinorUnits(
            credit.remainingAmount ?? credit.amount,
          );
          const usedAmount = Math.min(remainingAmount, amountToUse);
          const afterSettlement = remainingAmount - usedAmount;
          amountToUse -= usedAmount;
          const renewed = await state.updateOne(
            { _id: "settlement", lockId },
            {
              $set: {
                lockExpiresAt: new Date(Date.now() + SETTLEMENT_LOCK_MS),
              },
            },
          );
          if (renewed.matchedCount !== 1)
            throw new Error("Sponsorship settlement lease was lost");
          await payments.updateOne(
            { eventId: credit.eventId },
            {
              $set: {
                remainingAmount: fromMinorUnits(afterSettlement),
                settledAmount: fromMinorUnits(usedAmount),
                settledMonth: activeMonth,
              },
            },
          );
          if (afterSettlement === 0) {
            await consumedEvents.updateOne(
              { eventId: credit.eventId },
              {
                $set: {
                  eventId: credit.eventId,
                  expiresAt: new Date(
                    now.getTime() + DEDUPLICATION_RETENTION_MS,
                  ),
                },
              },
              { upsert: true },
            );
          }
        }
        const settledMonth = activeMonth;
        activeMonth = nextMonth(activeMonth);
        const updated = await state.updateOne(
          { _id: "settlement", lockId, activeMonth: settledMonth },
          { $set: { activeMonth } },
        );
        if (updated.matchedCount !== 1)
          throw new Error("Sponsorship settlement state changed unexpectedly");
        await payments.deleteMany({
          remainingAmount: 0,
          settledMonth: { $lt: activeMonth },
        });
      }
    } finally {
      await state.updateOne(
        { _id: "settlement", lockId },
        { $unset: { lockId: "", lockExpiresAt: "" } },
      );
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

  public async getProgress(
    now = new Date(),
  ): Promise<SponsorshipProgress | undefined> {
    if (!config.kofiProfileUrl || config.kofiMonthlyGoal === undefined) {
      return undefined;
    }
    const month = monthFor(now);
    await this.settleCompletedMonths(now);
    const { payments } = await this.getCollections();
    const credits = await payments
      .find({ currency: config.kofiCurrency })
      .toArray();
    const raised = fromMinorUnits(
      credits.reduce(
        (total, credit) =>
          total + toMinorUnits(credit.remainingAmount ?? credit.amount),
        0,
      ),
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
