import { expect, test } from "@jest/globals";
import { createHash } from "node:crypto";
import {
  ChangeRoomName,
  CreateRoom,
  DeleteExit,
  DeleteRoom,
  ModifyRoomExit,
  SetRoomCoordinates,
} from "../src/models/business/change.js";
import { observedReport } from "../src/models/business/observation.js";
import { MapService } from "../src/services/mapService.js";
import { MockChangeService } from "./mocks/mockChangeService.js";

test("a reporter replaces previous coordinates without withdrawing other reporters", async () => {
  const service = new MockChangeService();
  await service.addChange(new SetRoomCoordinates(1, ["A", "B"], 1, 2, 3));
  await service.addChange(new SetRoomCoordinates(1, ["A"], 4, 5, 6));
  const changes = await service.getChanges(0);
  expect(changes).toHaveLength(2);
  expect([...changes[0].reporters]).toEqual(["B"]);
  expect([...changes[1].reporters]).toEqual(["A"]);
  expect(await service.getChanges(2)).toHaveLength(0);
});
test("returning to an old value renews its application order while retaining its immutable ID", async () => {
  const service = new MockChangeService();
  const original = new ChangeRoomName(1, ["A", "B"], "Original");
  await service.addChange(original);
  await service.addChange(new ChangeRoomName(1, ["B"], "Other"));
  await service.addChange(new ChangeRoomName(1, ["A"], "Original"));
  const changes = await service.getChanges(0);
  expect(changes).toHaveLength(2);
  expect(changes[1].changeId).toBe(original.changeId);
  expect([...changes[0].reporters]).toEqual(["B"]);
});
test("set and delete share a replacement group while room lifecycle reports remain independent", async () => {
  const service = new MockChangeService();
  await service.addChange(new CreateRoom(1, ["A"]));
  await service.addChange(new ModifyRoomExit(1, ["A"], "north", 2));
  await service.addChange(new DeleteRoom(1, ["A"]));
  await service.addChange(new DeleteExit(1, ["A"], "north"));
  expect((await service.getChanges(0)).map((c) => c.type)).toEqual([
    "create-room",
    "delete-room",
    "delete-exit",
  ]);
});
test("versions distinguish earlier replacements with unchanged newest ID and count", async () => {
  const service = new MockChangeService();
  const map = new MapService(service);
  const a = new ChangeRoomName(1, ["A"], "First");
  const b = new ChangeRoomName(1, ["A"], "Other");
  const newest = new ChangeRoomName(2, ["A"], "Newest");
  service.getChanges = () => Promise.resolve([a, newest]);
  const before = await map.getVersion(0);
  service.getChanges = () => Promise.resolve([b, newest]);
  expect(await map.getVersion(0)).not.toBe(before);
});

test("order falls back to the newest remaining supporter after individual withdrawal", async () => {
  const service = new MockChangeService();
  const first = new ChangeRoomName(1, ["A"], "First");
  const second = new ChangeRoomName(1, ["B"], "Second");
  await service.addChange(first);
  await service.addChange(second);
  await service.addChange(new ChangeRoomName(1, ["C"], "First"));
  expect((await service.getChanges(0)).map((c) => c.changeId)).toEqual([
    second.changeId,
    first.changeId,
  ]);
  const latest = (await service.getObservations()).at(-1);
  if (!latest) throw new Error("Missing latest observation");
  await service.deleteObservations([latest.observationId]);
  expect((await service.getChanges(0)).map((c) => c.changeId)).toEqual([
    first.changeId,
    second.changeId,
  ]);
});
test("identical retries keep map versions stable and ordered changes produce different versions", async () => {
  const service = new MockChangeService();
  const map = new MapService(service);
  const a = new ChangeRoomName(1, ["A"], "Same");
  await service.addChange(a);
  const first = await map.getVersion(0);
  await service.addChange(new ChangeRoomName(1, ["A"], "Same"));
  expect(await map.getVersion(0)).toBe(first);
  const b = new ChangeRoomName(2, ["B"], "Other");
  await service.addChange(b);
  const forward = await map.getVersion(0);
  service.getChanges = () => Promise.resolve([b, a]);
  expect(await map.getVersion(0)).not.toBe(forward);
});

test("observation identities do not fingerprint a reporter from public ordering metadata", () => {
  const first = observedReport("report", "order", new Date(0));
  const next = observedReport("report", "order", new Date(0));
  const guessed = createHash("sha256")
    .update(JSON.stringify(["alpha", "Known mapper", "order"]))
    .digest("hex");
  expect(first.observationId).not.toBe(guessed);
  expect(first.observationId).not.toBe(next.observationId);
});
