import { expect, jest, test } from "@jest/globals";
import { MongoClient, MongoServerError } from "mongodb";
import { User } from "../src/models/business/user.js";
import { MongoUserDbService } from "../src/services/userDbService.js";

test("API key rotation updates the hash used by authentication", async () => {
  const updateOne = jest.fn<
    (filter: unknown, update: unknown) => Promise<void>
  >(async () => Promise.resolve());
  const createIndexes = jest.fn(async () => Promise.resolve([]));
  const mongo = {
    connect: jest.fn(async () => Promise.resolve()),
    db: jest.fn(() => ({
      collection: jest.fn(() => ({ createIndexes, updateOne })),
    })),
  } as unknown as MongoClient;
  const user: User = {
    name: "test-user",
    roles: [],
    salt: "salt",
    hashed_api_key: "old-hash",
  };

  await new MongoUserDbService(mongo).updateApiKey(
    user,
    "new-hash",
    "cm1_new-id",
  );

  expect(updateOne).toHaveBeenCalledWith(
    { name: "test-user" },
    {
      $set: {
        hashed_api_key: "new-hash",
        api_key_id: "cm1_new-id",
      },
    },
  );
});

test("concurrent user bootstrap treats a duplicate name as already existing", async () => {
  const duplicateError = new MongoServerError({
    code: 11000,
    message: "duplicate key",
  });
  const updateOne = jest.fn(async () => Promise.reject(duplicateError));
  const findOne = jest.fn<(filter: unknown) => Promise<User | null>>(async () =>
    Promise.resolve({ name: "admin" } as User),
  );
  const createIndexes = jest.fn(async () => Promise.resolve([]));
  const mongo = {
    connect: jest.fn(async () => Promise.resolve()),
    db: jest.fn(() => ({
      collection: jest.fn(() => ({ createIndexes, findOne, updateOne })),
    })),
  } as unknown as MongoClient;
  const user: User = {
    name: "admin",
    roles: ["site_admin"],
    salt: "salt",
    hashed_api_key: "hash",
  };

  await expect(
    new MongoUserDbService(mongo).addUserIfMissing(user),
  ).resolves.toBe(false);
  expect(findOne).toHaveBeenCalledWith({ name: "admin" });
});

test("user bootstrap preserves unrelated duplicate-key errors", async () => {
  const duplicateError = new MongoServerError({
    code: 11000,
    message: "duplicate key",
  });
  const updateOne = jest.fn(async () => Promise.reject(duplicateError));
  const findOne = jest.fn<(filter: unknown) => Promise<User | null>>(async () =>
    Promise.resolve(null),
  );
  const createIndexes = jest.fn(async () => Promise.resolve([]));
  const mongo = {
    connect: jest.fn(async () => Promise.resolve()),
    db: jest.fn(() => ({
      collection: jest.fn(() => ({ createIndexes, findOne, updateOne })),
    })),
  } as unknown as MongoClient;
  const user: User = {
    name: "admin",
    roles: ["site_admin"],
    salt: "salt",
    hashed_api_key: "hash",
  };

  await expect(
    new MongoUserDbService(mongo).addUserIfMissing(user),
  ).rejects.toBe(duplicateError);
});
