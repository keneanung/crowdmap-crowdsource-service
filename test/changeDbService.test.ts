import { expect, jest, test } from "@jest/globals";
import { MongoClient, MongoServerError } from "mongodb";
import { ChangeRoomName } from "../src/models/business/change.js";
import { MongoChangeService } from "../src/services/changeService.js";

test("change reporters are merged with one atomic upsert", async () => {
  const updateOne = jest.fn<
    (filter: unknown, update: unknown, options: unknown) => Promise<void>
  >(async () => Promise.resolve());
  const createIndexes = jest.fn(async () => Promise.resolve([]));
  const indexExists = jest.fn(async () => Promise.resolve(false));
  const dropIndex = jest.fn(async () => Promise.resolve());
  const mongo = {
    connect: jest.fn(async () => Promise.resolve()),
    db: jest.fn(() => ({
      collection: jest.fn(() => ({
        createIndexes,
        indexExists,
        dropIndex,
        updateOne,
      })),
    })),
  } as unknown as MongoClient;
  const service = new MongoChangeService(mongo);

  await service.addChange(
    new ChangeRoomName(42, ["reporter-a"], "A room", "change-id"),
  );

  expect(createIndexes).toHaveBeenCalledTimes(1);
  expect(updateOne).toHaveBeenCalledWith(
    { type: "room-name", roomNumber: 42, name: "A room" },
    expect.not.arrayContaining([{ $unset: "upstreamConflict" }]),
    { upsert: true },
  );
});

test("legacy index migration tolerates a concurrent index drop", async () => {
  const updateOne = jest.fn<
    (filter: unknown, update: unknown, options: unknown) => Promise<void>
  >(async () => Promise.resolve());
  const createIndexes = jest.fn(async () => Promise.resolve([]));
  const indexExists = jest.fn(async () => Promise.resolve(true));
  const dropIndex = jest.fn<(name: string) => Promise<void>>(async () =>
    Promise.reject(
      new MongoServerError({
        code: 27,
        codeName: "IndexNotFound",
        errmsg: "index not found",
      }),
    ),
  );
  const mongo = {
    connect: jest.fn(async () => Promise.resolve()),
    db: jest.fn(() => ({
      collection: jest.fn(() => ({
        createIndexes,
        indexExists,
        dropIndex,
        updateOne,
      })),
    })),
  } as unknown as MongoClient;
  const service = new MongoChangeService(mongo);

  await expect(
    service.addChange(
      new ChangeRoomName(42, ["reporter-a"], "A room", "change-id"),
    ),
  ).resolves.toBeUndefined();

  expect(dropIndex).toHaveBeenCalledWith("unique_logical_change");
  expect(createIndexes).toHaveBeenCalledTimes(1);
});

test("baseline reconciliation deletes only resolved changes", async () => {
  const deleteMany = jest.fn<(filter: unknown) => Promise<void>>(
    async () => Promise.resolve(),
  );
  const mongo = {
    connect: jest.fn(async () => Promise.resolve()),
    db: jest.fn(() => ({
      collection: jest.fn(() => ({
        deleteMany,
        createIndexes: jest.fn(async () => Promise.resolve([])),
        indexExists: jest.fn(async () => Promise.resolve(false)),
      })),
    })),
  } as unknown as MongoClient;
  const service = new MongoChangeService(mongo);

  await service.reconcileChanges(["resolved-change"]);

  expect(deleteMany).toHaveBeenCalledWith({
    changeId: { $in: ["resolved-change"] },
  });
});
