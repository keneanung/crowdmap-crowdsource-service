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
import { MudletMapReader } from "mudlet-map-binary-reader";
import { readFileSync } from "node:fs";
import { config } from "../src/config/values.js";
import {
  ChangeRoomName,
  DeleteMapLabel,
  DeleteMapUserData,
  DeleteRoomUserData,
  ModifyRoomUserData,
  SetMapLabel,
  SetMapUserData,
  SetRoomCoordinates,
  type Change,
  type MapLabelData,
} from "../src/models/business/change.js";
import type { CurrentObservation } from "../src/models/business/observation.js";
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
  test("replacing and rejoining values keeps IDs, counts and thresholds", async () => {
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
  test("renewed Mongo support changes application order and withdrawal restores the remaining order", async () => {
    const first = new ChangeRoomName(1, ["A"], "First");
    const second = new ChangeRoomName(1, ["B"], "Second");
    const mapName = (changes: Change[]) => {
      const map = MudletMapReader.readBuffer(
        readFileSync("test/setup/baselineFiles/map"),
      );
      changes.forEach((change) => {
        change.apply(map);
      });
      return map.rooms[1].name;
    };
    await service.addChange(first, "alpha");
    await service.addChange(second, "alpha");
    const initial = await service.getChanges(0, [], [], "alpha");
    expect(initial.map((c) => c.changeId)).toEqual([
      first.changeId,
      second.changeId,
    ]);
    expect(mapName(initial)).toBe("Second");
    const previousIds = new Set(
      (await service.getObservations("alpha")).map((o) => o.observationId),
    );
    await service.addChange(new ChangeRoomName(1, ["C"], "First"), "alpha");
    const renewed = await service.getChanges(0, [], [], "alpha");
    expect(renewed.map((c) => c.changeId)).toEqual([
      second.changeId,
      first.changeId,
    ]);
    expect([...renewed[1].reporters].sort()).toEqual(["A", "C"]);
    expect(mapName(renewed)).toBe("First");
    const latest = (await service.getObservations("alpha")).find(
      (o) => !previousIds.has(o.observationId),
    );
    if (!latest) throw new Error("Missing renewed observation");
    expect(
      await service.deleteObservations([latest.observationId], "alpha"),
    ).toBe(1);
    const remaining = await service.getChanges(0, [], [], "alpha");
    expect(remaining.map((c) => c.changeId)).toEqual([
      first.changeId,
      second.changeId,
    ]);
    expect([...remaining[0].reporters]).toEqual(["A"]);
    expect(mapName(remaining)).toBe("Second");
  });

  const label = (text: string): MapLabelData => ({
    text,
    x: 1,
    y: 2,
    z: 0,
    width: 3,
    height: 1,
    fgColor: { alpha: 255, r: 1, g: 2, b: 3 },
    bgColor: { alpha: 255, r: 4, g: 5, b: 6 },
    noScaling: false,
    showOnTop: true,
  });
  test.each([
    {
      name: "room user data",
      set: (reporters: string[], value: string): Change =>
        new ModifyRoomUserData(1, reporters, 'source|["notes"]', value),
      remove: (reporters: string[]): Change =>
        new DeleteRoomUserData(1, reporters, 'source|["notes"]'),
      independent: (): Change[] => [
        new ModifyRoomUserData(1, ["A"], "source", "Separate key"),
        new ModifyRoomUserData(2, ["A"], 'source|["notes"]', "Separate room"),
      ],
    },
    {
      name: "map user data",
      set: (reporters: string[], value: string): Change =>
        new SetMapUserData('source|["notes"]', value, reporters),
      remove: (reporters: string[]): Change =>
        new DeleteMapUserData('source|["notes"]', reporters),
      independent: (): Change[] => [
        new SetMapUserData("source", "Separate key", ["A"]),
      ],
    },
    {
      name: "map labels",
      set: (reporters: string[], value: string): Change =>
        new SetMapLabel(7, 1, label(value), reporters),
      remove: (reporters: string[]): Change =>
        new DeleteMapLabel(7, 1, reporters),
      independent: (): Change[] => [
        new SetMapLabel(7, 2, label("Separate label"), ["A"]),
        new SetMapLabel(8, 1, label("Separate area"), ["A"]),
      ],
    },
  ])(
    "$name replacement isolates keys and targets while preserving another reporter",
    async ({ set, remove, independent }) => {
      const original = set(["A", "B"], "Original");
      const updated = set(["A"], "Updated");
      const unrelated = independent();
      await service.addChange(original, "alpha");
      for (const change of unrelated) await service.addChange(change, "alpha");
      const support = async () =>
        (await service.getChanges(0, [], [], "alpha")).map((c) => ({
          id: c.changeId,
          reporters: [...c.reporters].sort(),
        }));
      const independentSupport = unrelated.map((c) => ({
        id: c.changeId,
        reporters: ["A"],
      }));
      await service.addChange(updated, "alpha");
      expect(await support()).toEqual(
        expect.arrayContaining([
          { id: original.changeId, reporters: ["B"] },
          { id: updated.changeId, reporters: ["A"] },
          ...independentSupport,
        ]),
      );
      expect(await support()).toHaveLength(unrelated.length + 2);
      const deletion = remove(["A"]);
      await service.addChange(deletion, "alpha");
      expect(await support()).toEqual(
        expect.arrayContaining([
          { id: original.changeId, reporters: ["B"] },
          { id: deletion.changeId, reporters: ["A"] },
          ...independentSupport,
        ]),
      );
      expect(await support()).toHaveLength(unrelated.length + 2);
      await service.addChange(remove(["B"]), "alpha");
      expect(await support()).toEqual(
        expect.arrayContaining([
          { id: deletion.changeId, reporters: ["A", "B"] },
          ...independentSupport,
        ]),
      );
      expect(await support()).toHaveLength(unrelated.length + 1);
      const renewed = set(["A"], "Updated");
      await service.addChange(renewed, "alpha");
      expect(renewed.changeId).not.toBe(updated.changeId);
      expect(await support()).toEqual(
        expect.arrayContaining([
          { id: deletion.changeId, reporters: ["B"] },
          { id: renewed.changeId, reporters: ["A"] },
          ...independentSupport,
        ]),
      );
      expect(await support()).toHaveLength(unrelated.length + 2);
    },
  );
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
  test("cleanup preserves other projects, properties and personal visibility", async () => {
    await service.addChange(new ChangeRoomName(1, ["A"], "First"), "alpha");
    await service.addChange(new ChangeRoomName(1, ["A"], "Latest"), "alpha");
    await service.addChange(new SetRoomCoordinates(1, ["A"], 1, 0, 0), "alpha");
    await service.addChange(new ChangeRoomName(1, ["A"], "Beta"), "beta");
    expect(await service.getChanges(2, [], [], "alpha", "A")).toHaveLength(2);
    expect(await service.getChanges(2, [], [], "alpha", "B")).toHaveLength(0);
    expect(await service.getChanges(0, [], [], "beta")).toHaveLength(1);
    expect(
      await client.db(config.dbName).collection("changes").countDocuments(),
    ).toBe(3);
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
  test("interrupted legacy migration resumes without duplicating copied observations", async () => {
    const legacy = new ChangeRoomName(1, ["A", "B"], "Legacy");
    await client
      .db(config.dbName)
      .collection("changes")
      .insertOne({
        ...changeBusinessToDb(legacy),
        projectId: "alpha",
      });
    // Invoke the saved method with the actual collection receiver below.
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const original = Collection.prototype.updateOne;
    const write = jest
      .spyOn(Collection.prototype, "updateOne")
      .mockImplementationOnce(function (this: Collection, ...args) {
        return original.apply(this, args);
      })
      .mockRejectedValueOnce(new Error("interrupted backfill"));
    try {
      await expect(service.getChanges(0, [], [], "alpha")).rejects.toThrow(
        "interrupted backfill",
      );
    } finally {
      write.mockRestore();
    }
    const partial = await client
      .db(config.dbName)
      .collection<CurrentObservation>("observations")
      .findOne({ reporter: "A" });
    expect(partial?.reports).toHaveLength(1);
    expect(
      (
        await client
          .db(config.dbName)
          .collection("changes")
          .findOne({ changeId: legacy.changeId })
      )?.reporters,
    ).toEqual(["A", "B"]);
    service = new MongoChangeService(client);
    const resumed = await service.getChanges(0, [], [], "alpha");
    expect([...resumed[0].reporters].sort()).toEqual(["A", "B"]);
    const observations = await service.getObservations("alpha");
    expect(observations).toHaveLength(2);
    expect(observations.map((o) => o.observationId)).toContain(
      partial?.reports[0].observationId,
    );
    expect(
      (
        await client
          .db(config.dbName)
          .collection("changes")
          .findOne({ changeId: legacy.changeId })
      )?.reporters,
    ).toEqual([]);
  });
  test("migration does not overwrite fresh support beside an unprocessed legacy report", async () => {
    await service.addChange(new ChangeRoomName(1, ["A"], "Fresh"), "alpha");
    const fresh = await service.getObservations("alpha");
    expect(Object.keys(fresh[0]).sort()).toEqual([
      "changeId",
      "observationId",
      "observedAt",
    ]);
    const legacy = new ChangeRoomName(1, ["A", "B"], "Legacy");
    await client
      .db(config.dbName)
      .collection("changes")
      .insertOne({
        ...changeBusinessToDb(legacy),
        projectId: "alpha",
      });
    service = new MongoChangeService(client);
    const active = await service.getChanges(0, [], [], "alpha");
    expect(
      active.map((c) => ({
        ...c.getIdentifyingParts(),
        reporters: [...c.reporters],
      })),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "Legacy", reporters: ["B"] }),
        expect.objectContaining({ name: "Fresh", reporters: ["A"] }),
      ]),
    );
    expect(active).toHaveLength(2);
    expect(await service.getObservations("alpha")).toEqual(
      expect.arrayContaining(fresh),
    );
  });
  test("moderation deletes definitions and recreates changes with fresh IDs", async () => {
    const change = new ChangeRoomName(1, ["A"], "First");
    await service.addChange(change, "alpha");
    expect(await service.deleteChanges([change.changeId], "alpha")).toBe(1);
    expect(await service.getChanges(0, [], [], "alpha")).toHaveLength(0);
    expect(await service.getObservations("alpha")).toEqual([]);
    expect(
      await client.db(config.dbName).collection("changes").countDocuments(),
    ).toBe(0);
    const recreated = new ChangeRoomName(1, ["A"], "First");
    await service.addChange(recreated, "alpha");
    expect((await service.getChanges(0, [], [], "alpha"))[0].changeId).toBe(
      recreated.changeId,
    );
    expect(recreated.changeId).not.toBe(change.changeId);
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
  test("a failed observation write leaves old support intact and cleans up the new definition", async () => {
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
    ).toBe(1);
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
  test("last-support replacement removes the old definition and rejoining gets a fresh ID", async () => {
    const original = new ChangeRoomName(1, ["A"], "Original");
    await service.addChange(original, "alpha");
    await service.addChange(new ChangeRoomName(1, ["A"], "Other"), "alpha");
    expect(
      await client
        .db(config.dbName)
        .collection("changes")
        .findOne({ changeId: original.changeId }),
    ).toBeNull();
    const renewed = new ChangeRoomName(1, ["A"], "Original");
    await service.addChange(renewed, "alpha");
    expect((await service.getChanges(0, [], [], "alpha"))[0].changeId).toBe(
      renewed.changeId,
    );
    expect(renewed.changeId).not.toBe(original.changeId);
    expect(
      await client.db(config.dbName).collection("changes").countDocuments(),
    ).toBe(1);
  });

  test("individual withdrawal keeps a supported change and deletes it after its final observation", async () => {
    const change = new ChangeRoomName(1, ["A", "B"], "Same");
    await service.addChange(change, "alpha");
    const reports = await service.getObservations("alpha");
    await service.deleteObservations([reports[0].observationId], "alpha");
    expect(
      await client.db(config.dbName).collection("changes").countDocuments(),
    ).toBe(1);
    await service.deleteObservations([reports[1].observationId], "alpha");
    expect(
      await client.db(config.dbName).collection("changes").countDocuments(),
    ).toBe(0);
    expect(
      await client
        .db(config.dbName)
        .collection("observations")
        .countDocuments({ "reports.0": { $exists: true } }),
    ).toBe(0);
    expect(
      await client
        .db(config.dbName)
        .collection("observations")
        .countDocuments({ reports: { $size: 0 } }),
    ).toBe(2);
  });

  test.each(["applyChanges", "reconcileChanges"] as const)(
    "%s deletes the parent and its support",
    async (method) => {
      const change = new ChangeRoomName(1, ["A", "B"], "Same");
      await service.addChange(change, "alpha");
      await service[method]([change.changeId], "alpha");
      expect(
        await client.db(config.dbName).collection("changes").countDocuments(),
      ).toBe(0);
      expect(await service.getObservations("alpha")).toEqual([]);
    },
  );

  test("startup cleans old orphans and dangling observations across projects after migration", async () => {
    const supported = new ChangeRoomName(1, ["A"], "Supported");
    const unsupported = new ChangeRoomName(2, [], "Orphan");
    await service.addChange(supported, "alpha");
    await client
      .db(config.dbName)
      .collection("changes")
      .insertOne({ ...changeBusinessToDb(unsupported), projectId: "beta" });
    await client
      .db(config.dbName)
      .collection<CurrentObservation>("observations")
      .insertOne({
        projectId: "gamma",
        reporter: "B",
        property: "missing",
        legacy: false,
        reports: [
          {
            observationId: "dangling",
            changeId: "missing",
            observedAt: new Date(),
            order: "missing",
          },
        ],
      });
    service = new MongoChangeService(client);
    await service.initialize();
    expect(
      await client.db(config.dbName).collection("changes").countDocuments(),
    ).toBe(1);
    expect((await service.getChanges(0, [], [], "alpha"))[0].changeId).toBe(
      supported.changeId,
    );
    expect(await service.getObservations("gamma")).toEqual([]);
    expect(
      await client
        .db(config.dbName)
        .collection("observations")
        .countDocuments({ "reports.0": { $exists: true } }),
    ).toBe(1);
  });

  test("cleanup cannot remove an in-flight definition in another service instance", async () => {
    await service.getChanges(0, [], [], "alpha");
    const other = new MongoChangeService(client);
    await other.getChanges(0, [], [], "alpha");
    // Alternate instances and replacement/support writes on the same project.
    await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        (i % 2 ? service : other).addChange(
          new ChangeRoomName(
            1,
            [`Mapper${i.toString()}`],
            i % 3 ? "Same" : "Other",
          ),
          "alpha",
        ),
      ),
    );
    const changes = await service.getChanges(0, [], [], "alpha");
    expect(changes).toHaveLength(2);
    expect(
      changes.reduce((sum, change) => sum + change.reporters.size, 0),
    ).toBe(20);
    expect(
      await client.db(config.dbName).collection("changes").countDocuments(),
    ).toBe(2);
    expect(await service.getObservations("alpha")).toHaveLength(20);
  });
  test("an interrupted parent deletion is repaired automatically on startup", async () => {
    const change = new ChangeRoomName(1, ["A"], "Remove");
    const independent = new ChangeRoomName(2, ["B"], "Keep");
    await service.addChange(change, "alpha");
    await service.addChange(independent, "alpha");
    const cleanup = jest
      .spyOn(Collection.prototype, "updateMany")
      .mockRejectedValueOnce(new Error("interrupted cleanup"));
    try {
      await expect(
        service.deleteChanges([change.changeId], "alpha"),
      ).rejects.toThrow("interrupted cleanup");
    } finally {
      cleanup.mockRestore();
    }
    // The change was removed first; its support is temporarily dangling.
    expect(
      await client
        .db(config.dbName)
        .collection("changes")
        .findOne({ changeId: change.changeId }),
    ).toBeNull();
    expect(await service.getObservations("alpha")).toHaveLength(2);
    service = new MongoChangeService(client);
    expect(
      (await service.getChanges(0, [], [], "alpha")).map((c) => c.changeId),
    ).toEqual([independent.changeId]);
    expect(
      (await service.getObservations("alpha")).map((o) => o.changeId),
    ).toEqual([independent.changeId]);
  });

  test("cleanup waits for a definition whose observation write is in flight", async () => {
    const original = new ChangeRoomName(1, ["A"], "Original");
    await service.addChange(original, "alpha");
    const other = new MongoChangeService(client);
    await other.getChanges(0, [], [], "alpha");
    let release!: () => void;
    let started!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const writing = new Promise<void>((resolve) => {
      started = resolve;
    });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const updateOne = Collection.prototype.updateOne;
    const write = jest
      .spyOn(Collection.prototype, "updateOne")
      .mockImplementationOnce(async function (this: Collection, ...args) {
        started();
        await gate;
        return updateOne.apply(this, args);
      });
    const incoming = new ChangeRoomName(2, ["B"], "Incoming");
    const submission = service.addChange(incoming, "alpha");
    await writing;
    let cleaned = false;
    const cleanup = other
      .deleteChanges([original.changeId], "alpha")
      .then(() => {
        cleaned = true;
      });
    try {
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(cleaned).toBe(false);
      expect(
        await client
          .db(config.dbName)
          .collection("changes")
          .findOne({ changeId: incoming.changeId }),
      ).not.toBeNull();
    } finally {
      release();
      await Promise.all([submission, cleanup]);
      write.mockRestore();
    }
    expect(
      (await service.getChanges(0, [], [], "alpha")).map((c) => c.changeId),
    ).toEqual([incoming.changeId]);
    expect(
      (await service.getObservations("alpha")).map((o) => o.changeId),
    ).toEqual([incoming.changeId]);
  });

  test("an expired lease from a stopped instance does not block cleanup", async () => {
    await client
      .db(config.dbName)
      .collection<{ _id: string; owner: string; expiresAt: Date }>(
        "change_write_locks",
      )
      .insertOne({ _id: "alpha", owner: "stopped", expiresAt: new Date(0) });
    const change = new ChangeRoomName(1, ["A"], "Fresh");
    await service.addChange(change, "alpha");
    expect((await service.getChanges(0, [], [], "alpha"))[0].changeId).toBe(
      change.changeId,
    );
  });
  test("stale orphan deletion cannot remove support accepted after lease takeover", async () => {
    await service.getChanges(0, [], [], "alpha");
    const other = new MongoChangeService(client);
    await other.getChanges(0, [], [], "alpha");
    const orphan = new ChangeRoomName(8, [], "Previously unsupported");
    await client
      .db(config.dbName)
      .collection("changes")
      .insertOne({ ...changeBusinessToDb(orphan), projectId: "alpha" });
    let started!: () => void;
    let release!: () => void;
    const deleting = new Promise<void>((resolve) => {
      started = resolve;
    });
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    // Pause after both orphan selection and the ownership check, before MongoDB executes the delete.
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const deleteOne = Collection.prototype.deleteOne;
    const write = jest
      .spyOn(Collection.prototype, "deleteOne")
      .mockImplementationOnce(async function (this: Collection, ...args) {
        started();
        await gate;
        return deleteOne.apply(this, args);
      });
    const submission = service.addChange(
      new ChangeRoomName(2, ["A"], "Trigger cleanup"),
      "alpha",
    );
    const rejected = expect(submission).rejects.toThrow(
      "Change storage lease was lost",
    );
    await deleting;
    try {
      await client
        .db(config.dbName)
        .collection<{ _id: string; expiresAt: Date }>("change_write_locks")
        .updateOne({ _id: "alpha" }, { $set: { expiresAt: new Date(0) } });
      await other.addChange(
        new ChangeRoomName(8, ["B"], "Previously unsupported"),
        "alpha",
      );
      expect(
        (await other.getChanges(0, [], [], "alpha")).find(
          (c) => c.changeId === orphan.changeId,
        )?.reporters.size,
      ).toBe(1);
    } finally {
      release();
      await rejected;
      write.mockRestore();
    }
    expect(
      (await other.getChanges(0, [], [], "alpha")).find(
        (c) => c.changeId === orphan.changeId,
      )?.reporters.size,
    ).toBe(1);
    expect(
      (await other.getObservations("alpha")).filter(
        (o) => o.changeId === orphan.changeId,
      ),
    ).toHaveLength(1);
  });

  test("stale observation writes cannot replace support accepted after lease takeover", async () => {
    await service.addChange(new ChangeRoomName(1, ["A"], "Original"), "alpha");
    const other = new MongoChangeService(client);
    await other.getChanges(0, [], [], "alpha");
    let started!: () => void;
    let release!: () => void;
    const writing = new Promise<void>((resolve) => {
      started = resolve;
    });
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const updateOne = Collection.prototype.updateOne;
    const write = jest
      .spyOn(Collection.prototype, "updateOne")
      .mockImplementationOnce(async function (this: Collection, ...args) {
        started();
        await gate;
        return updateOne.apply(this, args);
      });
    const submission = service.addChange(
      new ChangeRoomName(1, ["A"], "Stale"),
      "alpha",
    );
    const rejected = expect(submission).rejects.toThrow(
      "Change storage lease was lost",
    );
    await writing;
    const accepted = new ChangeRoomName(1, ["A"], "Accepted");
    try {
      await client
        .db(config.dbName)
        .collection<{ _id: string; expiresAt: Date }>("change_write_locks")
        .updateOne({ _id: "alpha" }, { $set: { expiresAt: new Date(0) } });
      await other.addChange(accepted, "alpha");
    } finally {
      release();
      await rejected;
      write.mockRestore();
    }
    expect(
      (await other.getChanges(0, [], [], "alpha")).map((c) => c.changeId),
    ).toEqual([accepted.changeId]);
    expect(
      (await other.getObservations("alpha")).map((o) => o.changeId),
    ).toEqual([accepted.changeId]);
  });

  test("deleting one migrated parent preserves its sibling observation across restart", async () => {
    const first = new ChangeRoomName(1, ["A"], "First");
    const sibling = new ChangeRoomName(1, ["A"], "Sibling");
    await client
      .db(config.dbName)
      .collection("changes")
      .insertMany(
        [first, sibling].map((change) => ({
          ...changeBusinessToDb(change),
          projectId: "alpha",
        })),
      );
    const before = await service.getObservations("alpha");
    const retained = before.find((o) => o.changeId === sibling.changeId);
    expect(retained).toBeDefined();
    expect(await service.deleteChanges([first.changeId], "alpha")).toBe(1);
    expect(await service.getObservations("alpha")).toEqual([retained]);
    expect(
      (await service.getChanges(0, [], [], "alpha")).map((c) => ({
        changeId: c.changeId,
        reporters: [...c.reporters],
      })),
    ).toEqual([{ changeId: sibling.changeId, reporters: ["A"] }]);
    service = new MongoChangeService(client);
    expect(await service.getObservations("alpha")).toEqual([retained]);
    expect((await service.getChanges(0, [], [], "alpha"))[0].changeId).toBe(
      sibling.changeId,
    );
  });
  test.each(["withdrawal", "deletion", "reconciliation"] as const)(
    "stale observation writes cannot resurrect support after %s",
    async (removal) => {
      const change = new ChangeRoomName(1, ["A", "B"], "Shared");
      await service.addChange(change, "alpha");
      const other = new MongoChangeService(client);
      await other.getChanges(0, [], [], "alpha");
      const observation = await client
        .db(config.dbName)
        .collection<CurrentObservation>("observations")
        .findOne({ projectId: "alpha", reporter: "A" });
      if (!observation) throw new Error("Missing reporter A's observation");
      let started!: () => void;
      let release!: () => void;
      const writing = new Promise<void>((resolve) => {
        started = resolve;
      });
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      // Pause an already-issued write after its ownership check. A later check
      // cannot cancel this MongoDB operation; the identity fence must reject it.
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const updateOne = Collection.prototype.updateOne;
      const write = jest
        .spyOn(Collection.prototype, "updateOne")
        .mockImplementationOnce(async function (this: Collection, ...args) {
          started();
          await gate;
          return updateOne.apply(this, args);
        });
      const submission = service.addChange(
        new ChangeRoomName(1, ["A"], "Shared"),
        "alpha",
      );
      const rejected = expect(submission).rejects.toThrow(
        "Change storage lease was lost",
      );
      await writing;
      try {
        await client
          .db(config.dbName)
          .collection<{ _id: string; expiresAt: Date }>("change_write_locks")
          .updateOne({ _id: "alpha" }, { $set: { expiresAt: new Date(0) } });
        if (removal === "withdrawal") {
          expect(
            await other.deleteObservations(
              [observation.reports[0].observationId],
              "alpha",
            ),
          ).toBe(1);
        } else if (removal === "deletion") {
          expect(await other.deleteChanges([change.changeId], "alpha")).toBe(1);
        } else {
          await other.reconcileChanges([change.changeId], "alpha");
        }
      } finally {
        release();
        await rejected;
        write.mockRestore();
      }
      const expectedSupport = removal === "withdrawal" ? 1 : 0;
      expect(await other.getObservations("alpha")).toHaveLength(
        expectedSupport,
      );
      expect(await other.getChanges(2, [], [], "alpha")).toEqual([]);
      const active = await other.getChanges(0, [], [], "alpha");
      expect(active).toHaveLength(expectedSupport);
      if (removal === "withdrawal")
        expect([...active[0].reporters]).toEqual(["B"]);
      // A tombstone permits a fresh lease to reuse the identity normally.
      service = new MongoChangeService(client);
      expect(await service.getObservations("alpha")).toHaveLength(
        expectedSupport,
      );
      const fresh = new ChangeRoomName(1, ["A"], "Fresh");
      await service.addChange(fresh, "alpha");
      expect(
        (await service.getChanges(0, [], [], "alpha")).find(
          (c) => c.changeId === fresh.changeId,
        )?.reporters.size,
      ).toBe(1);
    },
  );
});
