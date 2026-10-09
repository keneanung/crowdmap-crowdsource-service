import { expect, jest, test } from "@jest/globals";
import { MongoClient, MongoServerError } from "mongodb";
import { config, type MapProject } from "../src/config/values.js";
import { MongoChangeService } from "../src/services/changeService.js";

function fixture() {
  const definitions = {
    countDocuments: jest.fn(() => Promise.resolve(0)),
    updateMany: jest.fn((_filter: unknown, _update: unknown) =>
      Promise.resolve(undefined),
    ),
    indexExists: jest.fn((_name: string) => Promise.resolve(false)),
    dropIndex: jest.fn((_name: string) => Promise.resolve(undefined)),
    createIndexes: jest.fn((_indexes: unknown[]) => Promise.resolve([])),
    find: jest.fn(() => ({
      async *[Symbol.asyncIterator]() {
        /* empty migration */
      },
    })),
  };
  const observations = {
    createIndexes: jest.fn((_indexes: unknown[]) => Promise.resolve([])),
    aggregate: jest.fn(() => ({ toArray: () => Promise.resolve([]) })),
  };
  const mongo = {
    connect: () => Promise.resolve(undefined),
    db: () => ({
      collection: (name: string) =>
        name === "changes" ? definitions : observations,
    }),
  } as unknown as MongoClient;
  return { service: new MongoChangeService(mongo), definitions, observations };
}
test("migration drops obsolete indexes and creates unique current observation identities", async () => {
  const f = fixture();
  f.definitions.indexExists.mockResolvedValue(true);
  await f.service.getChanges(0);
  expect(f.definitions.dropIndex).toHaveBeenCalledWith(
    "unique_project_logical_change",
  );
  expect(f.definitions.createIndexes).toHaveBeenCalledWith(
    expect.arrayContaining([
      expect.objectContaining({
        name: "unique_project_logical_change_v2",
        unique: true,
      }),
    ]),
  );
  expect(f.observations.createIndexes).toHaveBeenCalledWith(
    expect.arrayContaining([
      {
        key: { projectId: 1, reporter: 1, property: 1 },
        unique: true,
        name: "unique_current_observation",
      },
    ]),
  );
});
test("migration tolerates another instance dropping an obsolete index first", async () => {
  const f = fixture();
  f.definitions.indexExists.mockResolvedValue(true);
  f.definitions.dropIndex.mockRejectedValue(
    new MongoServerError({
      code: 27,
      codeName: "IndexNotFound",
      errmsg: "index missing",
    }),
  );
  await expect(f.service.getChanges(0)).resolves.toEqual([]);
});
test("a fresh database creates indexes when listIndexes reports NamespaceNotFound", async () => {
  const f = fixture();
  f.definitions.indexExists.mockRejectedValue(
    new MongoServerError({
      code: 26,
      codeName: "NamespaceNotFound",
      errmsg: "namespace missing",
    }),
  );
  await expect(f.service.getChanges(0)).resolves.toEqual([]);
  expect(f.definitions.createIndexes).toHaveBeenCalledTimes(1);
});
test("unscoped legacy data is migrated only under an unambiguous project configuration", async () => {
  const projects = config.projects;
  try {
    const single = fixture();
    single.definitions.countDocuments.mockResolvedValue(2);
    await single.service.getChanges(0);
    expect(single.definitions.updateMany).toHaveBeenCalledWith(
      { projectId: { $exists: false } },
      { $set: { projectId: projects[0].id } },
    );
    config.projects = [
      { ...projects[0], id: "alpha" },
      { ...projects[0], id: "beta" },
    ] as MapProject[];
    const multi = fixture();
    multi.definitions.countDocuments.mockResolvedValue(2);
    await expect(multi.service.getChanges(0, [], [], "alpha")).rejects.toThrow(
      "legacy changes have no projectId",
    );
    expect(multi.definitions.updateMany).not.toHaveBeenCalled();
  } finally {
    config.projects = projects;
  }
});
