import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from "@jest/globals";
import { Collection, MongoClient } from "mongodb";
import { config } from "../src/config/values.js";
import {
  ChangeRoomName,
  SetRoomCoordinates,
} from "../src/models/business/change.js";
import { changeBusinessToDb } from "../src/models/db/change.js";
import { MongoChangeService } from "../src/services/changeService.js";

const suite = process.env.OBSERVATION_TEST_MONGO_URL ? describe : describe.skip;
suite("current observations on standalone MongoDB", () => {
  const client = new MongoClient(
    process.env.OBSERVATION_TEST_MONGO_URL ?? "mongodb://127.0.0.1:27028",
  );
  const previousName = config.dbName;
  let service: MongoChangeService;
  beforeAll(async () => {
    config.dbName = `crowdmap_observation_test_${process.pid.toString()}`;
    await client.connect();
  });
  beforeEach(async () => {
    await client.db(config.dbName).dropDatabase();
    service = new MongoChangeService(client);
  });
  afterAll(async () => {
    await client.db(config.dbName).dropDatabase();
    await client.close();
    config.dbName = previousName;
  });
  test("replacing and rejoining values keeps IDs, counts, thresholds and renewed order", async () => {
    const a = new ChangeRoomName(1, ["A", "B"], "Original");
    await service.addChange(a, "alpha");
    await service.addChange(new ChangeRoomName(1, ["A"], "Other"), "alpha");
    const old = await service.getChanges(0, [], [], "alpha");
    expect(old.map((c) => [...c.reporters])).toEqual([["B"], ["A"]]);
    expect(await service.getChanges(2, [], [], "alpha")).toHaveLength(0);
    await service.addChange(new ChangeRoomName(1, ["A"], "Original"), "alpha");
    const current = await service.getChanges(2, [], [], "alpha");
    expect(current).toHaveLength(1);
    expect(current[0].changeId).toBe(a.changeId);
    expect(current[0].reporters.size).toBe(2);
  });
  test("concurrent first writes never leave one reporter supporting multiple values", async () => {
    await Promise.all(
      Array.from({ length: 25 }, (_, i) =>
        service.addChange(new SetRoomCoordinates(1, ["A"], i, 0, 0), "alpha"),
      ),
    );
    const current = await service.getChanges(0, [], [], "alpha");
    expect(current).toHaveLength(1);
    expect(current[0].reporters.size).toBe(1);
    expect(
      await client
        .db(config.dbName)
        .collection("observations")
        .countDocuments(),
    ).toBe(1);
  });
  test("projects, properties, personal visibility and unsupported definitions stay isolated", async () => {
    await service.addChange(new ChangeRoomName(1, ["A"], "First"), "alpha");
    await service.addChange(new ChangeRoomName(1, ["A"], "Latest"), "alpha");
    await service.addChange(new SetRoomCoordinates(1, ["A"], 1, 0, 0), "alpha");
    await service.addChange(new ChangeRoomName(1, ["A"], "Beta"), "beta");
    expect(await service.getChanges(2, [], [], "alpha", "A")).toHaveLength(2);
    expect(await service.getChanges(2, [], [], "alpha", "B")).toHaveLength(0);
    expect(await service.getChanges(0, [], [], "beta")).toHaveLength(1);
    expect(
      await client.db(config.dbName).collection("changes").countDocuments(),
    ).toBe(4);
  });
  test("legacy conflicting support is preserved until fresh observation and never resurrected", async () => {
    const first = new ChangeRoomName(1, ["A", "B"], "First");
    const other = new ChangeRoomName(1, ["A"], "Other");
    await client
      .db(config.dbName)
      .collection("changes")
      .insertMany(
        [first, other].map((c) => ({
          ...changeBusinessToDb(c),
          projectId: "alpha",
        })),
      );
    expect(
      (await service.getChanges(0, [], [], "alpha")).map(
        (c) => c.reporters.size,
      ),
    ).toEqual([2, 1]);
    await service.addChange(new ChangeRoomName(1, ["A"], "New"), "alpha");
    expect(
      (await service.getChanges(0, [], [], "alpha")).map((c) => [
        ...c.reporters,
      ]),
    ).toEqual([["B"], ["A"]]);
    await service.deleteChanges([first.changeId], "alpha");
    service = new MongoChangeService(client);
    expect(await service.getChanges(0, [], [], "alpha")).toHaveLength(1);
  });
  test("moderation withdraws support without deleting immutable definitions", async () => {
    const change = new ChangeRoomName(1, ["A"], "First");
    await service.addChange(change, "alpha");
    expect(await service.deleteChanges([change.changeId], "alpha")).toBe(1);
    expect(await service.getChanges(0, [], [], "alpha")).toHaveLength(0);
    await service.addChange(new ChangeRoomName(1, ["A"], "First"), "alpha");
    expect((await service.getChanges(0, [], [], "alpha"))[0].changeId).toBe(
      change.changeId,
    );
  });
  test("concurrent confirmations share one immutable definition", async () => {
    await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        service.addChange(
          new ChangeRoomName(1, [`Mapper${i.toString()}`], "Same"),
          "alpha",
        ),
      ),
    );
    const active = await service.getChanges(0, [], [], "alpha");
    expect(active).toHaveLength(1);
    expect(active[0].reporters.size).toBe(20);
    expect(
      await client.db(config.dbName).collection("changes").countDocuments(),
    ).toBe(1);
  });
  test("a failed observation write leaves old support intact and an inactive definition", async () => {
    await service.addChange(new ChangeRoomName(1, ["A"], "First"), "alpha");
    const write = jest
      .spyOn(Collection.prototype, "updateOne")
      .mockRejectedValueOnce(new Error("forced observation failure"));
    try {
      await expect(
        service.addChange(new ChangeRoomName(1, ["A"], "New"), "alpha"),
      ).rejects.toThrow("forced observation failure");
    } finally {
      write.mockRestore();
    }
    const active = await service.getChanges(0, [], [], "alpha");
    expect(active).toHaveLength(1);
    expect(active[0].getIdentifyingParts()).toMatchObject({ name: "First" });
    expect(
      await client.db(config.dbName).collection("changes").countDocuments(),
    ).toBe(2);
    await service.addChange(new ChangeRoomName(1, ["A"], "New"), "alpha");
    expect(
      (await service.getChanges(0, [], [], "alpha"))[0].getIdentifyingParts(),
    ).toMatchObject({ name: "New" });
  });
  test("individual observation moderation preserves other support and stale IDs are harmless", async () => {
    await service.addChange(new ChangeRoomName(1, ["A"], "Same"), "alpha");
    const first = (await service.getObservations("alpha"))[0];
    await service.addChange(new ChangeRoomName(1, ["B"], "Same"), "alpha");
    const second = (await service.getObservations("alpha")).find(
      (o) => o.observationId !== first.observationId,
    );
    if (!second) throw new Error("Missing second observation");
    expect(
      await service.deleteObservations([first.observationId], "alpha"),
    ).toBe(1);
    expect(
      (await service.getChanges(0, [], [], "alpha"))[0].reporters.size,
    ).toBe(1);
    await service.addChange(new ChangeRoomName(1, ["B"], "Better"), "alpha");
    expect(
      await service.deleteObservations([second.observationId], "alpha"),
    ).toBe(0);
    expect(
      (await service.getChanges(0, [], [], "alpha"))[0].getIdentifyingParts(),
    ).toMatchObject({ name: "Better" });
  });
});
