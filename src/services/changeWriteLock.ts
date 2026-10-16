import { MongoClient, MongoServerError } from "mongodb";
import { randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";

interface ChangeWriteLock {
  _id: string;
  owner?: string;
  expiresAt?: Date;
}

// Standalone MongoDB cannot transact across definitions and observations.
// Serialize their mutation and cleanup per project, including across app instances.
export async function withChangeWriteLock<T>(
  mongo: MongoClient,
  database: string | undefined,
  projectId: string,
  action: () => Promise<T>,
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
  // Allow a stopped writer's 60-second lease to expire before giving up.
  const deadline = Date.now() + 90_000;
  while (
    !(await locks.findOneAndUpdate(
      {
        _id: projectId,
        $or: [
          { owner: { $exists: false } },
          { $expr: { $lte: ["$expiresAt", "$$NOW"] } },
        ],
      },
      [{ $set: { owner: { $literal: owner }, expiresAt } }],
      { returnDocument: "after" },
    ))
  ) {
    if (Date.now() >= deadline)
      throw new Error("Timed out waiting for change storage lock");
    await delay(25);
  }

  let renewal = Promise.resolve();
  let leaseError: Error | undefined;
  const timer = setInterval(() => {
    renewal = renewal.then(async () => {
      if (leaseError) return;
      try {
        const lock = await locks.findOneAndUpdate({ _id: projectId, owner }, [
          { $set: { expiresAt } },
        ]);
        if (!lock) throw new Error("Change storage lease was lost");
      } catch (error) {
        leaseError = error instanceof Error ? error : new Error(String(error));
      }
    });
  }, 10_000);
  timer.unref();
  try {
    const result = await action();
    await renewal;
    if (leaseError) throw leaseError;
    return result;
  } finally {
    clearInterval(timer);
    await renewal;
    // Keep the document so contenders cannot race with its recreation.
    await locks.findOneAndUpdate(
      { _id: projectId, owner },
      { $unset: { owner: "", expiresAt: "" } },
    );
  }
}
