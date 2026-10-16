import {
  MongoClient,
  MongoServerError,
  type Document,
  type Filter,
} from "mongodb";
import { randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";

interface ChangeWriteLock {
  _id: string;
  owner?: string;
  expiresAt?: Date;
  fence?: number;
}

export interface ChangeWriteLease {
  readonly fence: number;
  assertHeld(): Promise<void>;
  filter<T extends Document>(filter: Filter<T>): Filter<T>;
}

// Each acquisition advances a durable fence. Protected document writes check
// that fence, so an old holder cannot overwrite a newer holder's work.
export async function withChangeWriteLock<T>(
  mongo: MongoClient,
  database: string | undefined,
  projectId: string,
  action: (lease: ChangeWriteLease) => Promise<T>,
): Promise<T> {
  const locks = mongo
    .db(database)
    .collection<ChangeWriteLock>("change_write_locks");
  try {
    await locks.insertOne({ _id: projectId });
  } catch (error) {
    if (!(error instanceof MongoServerError) || error.code !== 11000)
      throw error;
  }
  const owner = randomUUID();
  const expiresAt = {
    $dateAdd: { startDate: "$$NOW", unit: "second", amount: 60 },
  };
  const deadline = Date.now() + 90_000;
  let lock: ChangeWriteLock | null;
  while (
    !(lock = await locks.findOneAndUpdate(
      {
        _id: projectId,
        $or: [
          { owner: { $exists: false } },
          { $expr: { $lte: ["$expiresAt", "$$NOW"] } },
        ],
      },
      [
        {
          $set: {
            owner: { $literal: owner },
            expiresAt,
            fence: { $add: [{ $ifNull: ["$fence", 0] }, 1] },
          },
        },
      ],
      { returnDocument: "after" },
    ))
  ) {
    if (Date.now() >= deadline)
      throw new Error("Timed out waiting for change storage lock");
    await delay(25);
  }
  const fence = lock.fence;
  if (typeof fence !== "number")
    throw new Error("Missing change storage fence");
  const ownership = {
    _id: projectId,
    owner,
    fence,
    $expr: { $gt: ["$expiresAt", "$$NOW"] },
  };
  let renewal = Promise.resolve();
  let leaseError: Error | undefined;
  const lease: ChangeWriteLease = {
    fence,
    async assertHeld() {
      if (leaseError) throw leaseError;
      if (!(await locks.findOne(ownership)))
        throw new Error("Change storage lease was lost");
    },
    filter<TDocument extends Document>(
      filter: Filter<TDocument>,
    ): Filter<TDocument> {
      return {
        $and: [
          filter,
          {
            $or: [
              { writeFence: { $exists: false } },
              { writeFence: { $lte: fence } },
            ],
          },
        ],
      } as Filter<TDocument>;
    },
  };
  const timer = setInterval(() => {
    renewal = renewal.then(async () => {
      if (leaseError) return;
      try {
        const renewed = await locks.findOneAndUpdate(ownership, [
          { $set: { expiresAt } },
        ]);
        if (!renewed) throw new Error("Change storage lease was lost");
      } catch (error) {
        leaseError = error instanceof Error ? error : new Error(String(error));
      }
    });
  }, 10_000);
  timer.unref();
  try {
    const result = await action(lease);
    clearInterval(timer);
    await renewal;
    await lease.assertHeld();
    return result;
  } finally {
    clearInterval(timer);
    await renewal;
    // Keep the fence across releases and application restarts.
    await locks.findOneAndUpdate(
      { _id: projectId, owner, fence },
      { $unset: { owner: "", expiresAt: "" } },
    );
  }
}
