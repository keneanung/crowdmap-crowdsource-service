/* eslint-disable @typescript-eslint/require-await */
import { afterEach, beforeEach, expect, jest, test } from "@jest/globals";
import { MongoClient } from "mongodb";
import { config } from "../src/config/values.js";
import { SponsorshipService } from "../src/services/sponsorshipService.js";

interface Payment {
  amount: number;
  currency: string;
  eventId: string;
  receivedAt: Date;
  remainingAmount?: number;
}

const originalConfig = { ...config };

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-09-01T00:00:00Z"));
  Object.assign(config, {
    kofiProfileUrl: "https://ko-fi.com/crowdmap",
    kofiMonthlyGoal: 20,
    kofiCurrency: "USD",
  });
});

afterEach(() => {
  jest.useRealTimers();
  Object.assign(config, originalConfig);
});

test("carries unused sponsorship credit into following months and deletes consumed payments", async () => {
  const payments: Payment[] = [];
  const consumedEvents: { eventId: string; expiresAt: Date }[] = [];
  let activeMonth: string | undefined;
  const paymentCollection = {
    createIndexes: async () => [],
    deleteMany: async ({ remainingAmount }: { remainingAmount: number }) => {
      for (let index = payments.length - 1; index >= 0; index -= 1) {
        if (payments[index]?.remainingAmount === remainingAmount) payments.splice(index, 1);
      }
    },
    deleteOne: async ({ eventId }: { eventId: string }) => {
      const index = payments.findIndex((payment) => payment.eventId === eventId);
      if (index >= 0) payments.splice(index, 1);
    },
    find: () => ({
      sort: () => ({
        toArray: async () => [...payments].sort((a, b) => a.receivedAt.getTime() - b.receivedAt.getTime()),
      }),
      toArray: async () => [...payments],
    }),
    insertOne: async (payment: Payment) => {
      payments.push(payment);
    },
    updateOne: async (
      { eventId }: { eventId: string },
      { $set }: { $set: Partial<Payment> },
    ) => {
      const payment = payments.find((candidate) => candidate.eventId === eventId);
      if (payment) Object.assign(payment, $set);
    },
  };
  const mongo = {
    connect: async () => undefined,
    db: () => ({
      collection: (name: string) => {
        if (name === "kofi_payments") return paymentCollection;
        if (name === "sponsorship_state") {
          return {
            findOne: async () => (activeMonth ? { _id: "settlement" as const, activeMonth } : null),
            insertOne: async (state: { activeMonth: string }) => {
              activeMonth = state.activeMonth;
            },
            updateOne: async (
              _filter: unknown,
              update: { $set?: { activeMonth: string }; $setOnInsert?: { activeMonth: string } },
            ) => {
              activeMonth = update.$set?.activeMonth ?? update.$setOnInsert?.activeMonth ?? activeMonth;
              return { matchedCount: 1 };
            },
          };
        }
        return {
          createIndexes: async () => [],
          findOne: async ({ eventId }: { eventId: string }) =>
            consumedEvents.find((event) => event.eventId === eventId) ?? null,
          updateOne: async (
            { eventId }: { eventId: string },
            { $set }: { $set: { expiresAt: Date } },
          ) => {
            consumedEvents.push({ eventId, expiresAt: $set.expiresAt });
          },
        };
      },
    }),
  } as unknown as MongoClient;
  const service = new SponsorshipService(mongo);

  await service.recordPayment({
    amount: 25,
    currency: "USD",
    eventId: "first",
    receivedAt: new Date("2026-09-01T12:00:00Z"),
  });
  await service.recordPayment({
    amount: 10,
    currency: "USD",
    eventId: "second",
    receivedAt: new Date("2026-09-02T12:00:00Z"),
  });

  await expect(service.getProgress(new Date("2026-09-30T12:00:00Z"))).resolves.toMatchObject({
    month: "2026-09",
    raised: 35,
  });
  await expect(service.getProgress(new Date("2026-10-01T12:00:00Z"))).resolves.toMatchObject({
    month: "2026-10",
    raised: 15,
  });
  await expect(service.getProgress(new Date("2026-11-01T12:00:00Z"))).resolves.toMatchObject({
    month: "2026-11",
    raised: 0,
  });
  expect(payments).toEqual([]);
  expect(consumedEvents.map((event) => event.eventId)).toEqual(["first", "second"]);
});
