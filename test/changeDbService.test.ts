import { expect, jest, test } from "@jest/globals";
import { MongoClient, MongoServerError } from "mongodb";
import { config, type MapProject } from "../src/config/values.js";
import { ChangeRoomName } from "../src/models/business/change.js";
import { MongoChangeService } from "../src/services/changeService.js";

test("change reporters are merged with one atomic upsert", async () => {
  const updateOne = jest.fn<
    (filter: unknown, update: unknown, options: unknown) => Promise<void>
  >(async () => Promise.resolve());
  const createIndexes = jest.fn(async () => Promise.resolve([]));
  const indexExists = jest.fn(async () => Promise.resolve(false));
  const dropIndex = jest.fn(async () => Promise.resolve());
  const countDocuments = jest.fn(async () => Promise.resolve(0));
  const updateMany = jest.fn(async () => Promise.resolve());
  const mongo = {
    connect: jest.fn(async () => Promise.resolve()),
    db: jest.fn(() => ({
      collection: jest.fn(() => ({
        createIndexes,
        indexExists,
        dropIndex,
        updateOne,
        countDocuments,
        updateMany,
      })),
    })),
  } as unknown as MongoClient;
  const service = new MongoChangeService(mongo);

  await service.addChange(
    new ChangeRoomName(42, ["reporter-a"], "A room", "change-id"),
  );

  expect(createIndexes).toHaveBeenCalledTimes(1);
  expect(updateOne).toHaveBeenCalledWith(
    { projectId: "default", type: "room-name", roomNumber: 42, name: "A room" },
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
  const countDocuments = jest.fn(async () => Promise.resolve(0));
  const updateMany = jest.fn(async () => Promise.resolve());
  const mongo = {
    connect: jest.fn(async () => Promise.resolve()),
    db: jest.fn(() => ({
      collection: jest.fn(() => ({
        createIndexes,
        indexExists,
        dropIndex,
        updateOne,
        countDocuments,
        updateMany,
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
  const deleteMany = jest.fn<(filter: unknown) => Promise<void>>(async () =>
    Promise.resolve(),
  );
  const mongo = {
    connect: jest.fn(async () => Promise.resolve()),
    db: jest.fn(() => ({
      collection: jest.fn(() => ({
        deleteMany,
        countDocuments: jest.fn(async () => Promise.resolve(0)),
        updateMany: jest.fn(async () => Promise.resolve()),
        createIndexes: jest.fn(async () => Promise.resolve([])),
        indexExists: jest.fn(async () => Promise.resolve(false)),
      })),
    })),
  } as unknown as MongoClient;
  const service = new MongoChangeService(mongo);

  await service.reconcileChanges(["resolved-change"]);

  expect(deleteMany).toHaveBeenCalledWith({
    projectId: "default",
    changeId: { $in: ["resolved-change"] },
  });
});

test("identical logical changes coexist and reads/deletes remain project-scoped", async () => {
  const updateOne = jest.fn<
    (filter: unknown, update: unknown, options: unknown) => Promise<void>
  >(async () => Promise.resolve());
  const deleteMany = jest.fn<(filter: unknown) => Promise<void>>(async () =>
    Promise.resolve(),
  );
  const find = jest.fn<
    (query: unknown) => { sort: () => { toArray: () => Promise<[]> } }
  >(() => ({ sort: () => ({ toArray: () => Promise.resolve([]) }) }));
  const createIndexes = jest.fn<(indexes: unknown[]) => Promise<[]>>(async () =>
    Promise.resolve([]),
  );
  const collection = {
    countDocuments: jest.fn(() => Promise.resolve(0)),
    updateMany: jest.fn(),
    indexExists: jest.fn(() => Promise.resolve(false)),
    dropIndex: jest.fn(),
    createIndexes,
    updateOne,
    deleteMany,
    find,
  };
  const mongo = {
    connect: jest.fn(async () => Promise.resolve()),
    db: jest.fn(() => ({ collection: jest.fn(() => collection) })),
  } as unknown as MongoClient;
  const service = new MongoChangeService(mongo);
  const change = new ChangeRoomName(42, ["reporter"], "Same", "same-change-id");

  await service.forProject("alpha").addChange(change);
  await service.forProject("beta").addChange(change);
  await service.forProject("alpha").getChanges(0);
  await service.forProject("beta").reconcileChanges(["same-change-id"]);

  expect(updateOne.mock.calls[0]?.[0]).toMatchObject({ projectId: "alpha" });
  expect(updateOne.mock.calls[1]?.[0]).toMatchObject({ projectId: "beta" });
  expect(find).toHaveBeenCalledWith(
    expect.objectContaining({ projectId: "alpha" }),
  );
  expect(deleteMany).toHaveBeenCalledWith({
    projectId: "beta",
    changeId: { $in: ["same-change-id"] },
  });
  expect(createIndexes.mock.calls[0]?.[0]).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        key: expect.objectContaining({ projectId: 1 }),
        unique: true,
      }),
    ]),
  );
});

test("legacy changes migrate only when their project assignment is unambiguous", async () => {
  const originalProjects = config.projects;
  const updateMany = jest.fn<
    (filter: unknown, update: unknown) => Promise<void>
  >(() => Promise.resolve());
  const collection = {
    countDocuments: jest.fn(() => Promise.resolve(2)),
    updateMany,
    indexExists: jest.fn(() => Promise.resolve(false)),
    createIndexes: jest.fn(() => Promise.resolve([])),
    find: jest.fn(() => ({
      sort: () => ({ toArray: () => Promise.resolve([]) }),
    })),
  };
  const mongo = {
    connect: jest.fn(() => Promise.resolve()),
    db: jest.fn(() => ({ collection: jest.fn(() => collection) })),
  } as unknown as MongoClient;
  try {
    await new MongoChangeService(mongo).initialize();
    expect(updateMany).toHaveBeenCalledWith(
      { projectId: { $exists: false } },
      { $set: { projectId: "default" } },
    );

    const secondProject: MapProject = {
      ...config.projects[0],
      id: "second",
      name: "Second",
      mapFile: "/tmp/second-map",
      versionFile: "/tmp/second-version",
    };
    config.projects = [config.projects[0], secondProject];
    await expect(new MongoChangeService(mongo).initialize()).rejects.toThrow(
      "legacy changes have no projectId",
    );
  } finally {
    config.projects = originalProjects;
  }
});
