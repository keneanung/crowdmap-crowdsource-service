import { expect, jest, test } from "@jest/globals";
import { MongoClient } from "mongodb";
import { User } from "../src/models/business/user";
import { MongoUserDbService } from "../src/services/userDbService";

test("API key rotation updates the hash used by authentication", async () => {
  const updateOne = jest.fn<(filter: unknown, update: unknown) => Promise<void>>(
    async () => Promise.resolve(),
  );
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
    "new-lookup",
  );

  expect(updateOne).toHaveBeenCalledWith(
    { name: "test-user" },
    {
      $set: {
        hashed_api_key: "new-hash",
        api_key_lookup: "new-lookup",
      },
    },
  );
});
