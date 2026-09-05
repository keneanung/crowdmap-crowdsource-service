import { expect, jest, test } from "@jest/globals";
import { MongoClient } from "mongodb";
import { ChangeRoomName } from "../src/models/business/change.js";
import { MongoChangeService } from "../src/services/changeService.js";

test("change reporters are merged with one atomic upsert", async () => {
  const updateOne = jest.fn<
    (filter: unknown, update: unknown, options: unknown) => Promise<void>
  >(async () => Promise.resolve());
  const createIndexes = jest.fn(async () => Promise.resolve([]));
  const mongo = {
    connect: jest.fn(async () => Promise.resolve()),
    db: jest.fn(() => ({
      collection: jest.fn(() => ({ createIndexes, updateOne })),
    })),
  } as unknown as MongoClient;
  const service = new MongoChangeService(mongo);

  await service.addChange(
    new ChangeRoomName(42, ["reporter-a"], "A room", "change-id"),
  );

  expect(createIndexes).toHaveBeenCalledTimes(1);
  expect(updateOne).toHaveBeenCalledWith(
    { type: "room-name", roomNumber: 42, name: "A room" },
    expect.arrayContaining([{ $unset: "upstreamConflict" }]),
    { upsert: true },
  );
});

test("baseline reconciliation deletes resolved changes and records conflicts", async () => {
  const bulkWrite = jest.fn<(operations: unknown[]) => Promise<void>>(
    async () => Promise.resolve(),
  );
  const mongo = {
    connect: jest.fn(async () => Promise.resolve()),
    db: jest.fn(() => ({
      collection: jest.fn(() => ({
        bulkWrite,
        createIndexes: jest.fn(async () => Promise.resolve([])),
        indexExists: jest.fn(async () => Promise.resolve(false)),
      })),
    })),
  } as unknown as MongoClient;
  const service = new MongoChangeService(mongo);

  await service.reconcileChanges(
    ["resolved-change"],
    new Map([
      [
        "conflicting-change",
        { baselineVersion: "467", reason: "Upstream changed the room name." },
      ],
    ]),
  );

  expect(bulkWrite).toHaveBeenCalledWith([
    {
      deleteMany: {
        filter: { changeId: { $in: ["resolved-change"] } },
      },
    },
    {
      updateOne: {
        filter: { changeId: "conflicting-change" },
        update: {
          $set: {
            upstreamConflict: {
              baselineVersion: "467",
              reason: "Upstream changed the room name.",
            },
          },
        },
      },
    },
  ]);
});
