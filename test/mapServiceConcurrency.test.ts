import { expect, jest, test } from "@jest/globals";
import { Change } from "../src/models/business/change.js";
import { ChangeService } from "../src/services/changeService.js";
import { MapService } from "../src/services/mapService.js";

test("a rejected baseline update does not invalidate an in-flight snapshot", async () => {
  let resolveChanges: (changes: Change[]) => void = () => undefined;
  const changesPending = new Promise<Change[]>((resolve) => {
    resolveChanges = resolve;
  });
  const getChanges = jest.fn(() => changesPending);
  const changeService = {
    addChange: jest.fn(),
    applyChanges: jest.fn(),
    getChanges,
  } as unknown as ChangeService;
  const mapService = new MapService(changeService);

  const snapshotPending = mapService.getChangesSnapshot(0);
  await Promise.resolve();
  expect(getChanges).toHaveBeenCalledTimes(1);

  await expect(
    mapService.applyBaselineUpdate("outdated-version", [], undefined),
  ).rejects.toThrow(
    "The map version provided does not match the current map version",
  );
  resolveChanges([]);

  await expect(snapshotPending).resolves.toMatchObject({ rawVersion: "466" });
  expect(getChanges).toHaveBeenCalledTimes(1);
});

test("pending-report deletions are serialized with map mutations", async () => {
  let finishFirstDeletion: (deleted: number) => void = () => undefined;
  const firstDeletionPending = new Promise<number>((resolve) => {
    finishFirstDeletion = resolve;
  });
  const deleteChanges = jest
    .fn<(changeIds: string[], projectId?: string) => Promise<number>>()
    .mockImplementationOnce(() => firstDeletionPending)
    .mockResolvedValueOnce(1);
  const changeService = {
    deleteChanges,
  } as unknown as ChangeService;
  const mapService = new MapService(changeService);

  const first = mapService.deletePendingChanges(["first"]);
  const second = mapService.deletePendingChanges(["second"]);
  await Promise.resolve();

  expect(deleteChanges).toHaveBeenCalledTimes(1);
  expect(deleteChanges).toHaveBeenCalledWith(["first"], "default");

  finishFirstDeletion(1);
  await expect(first).resolves.toBe(1);
  await expect(second).resolves.toBe(1);
  expect(deleteChanges).toHaveBeenNthCalledWith(2, ["second"], "default");
});

test("pending-report deletion invalidates an in-flight change snapshot", async () => {
  let finishSnapshotRead: (changes: Change[]) => void = () => undefined;
  const snapshotReadPending = new Promise<Change[]>((resolve) => {
    finishSnapshotRead = resolve;
  });
  const getChanges = jest
    .fn<(timesSeen: number, include: string[], exclude: string[], projectId?: string) => Promise<Change[]>>()
    .mockImplementationOnce(() => snapshotReadPending)
    .mockResolvedValueOnce([]);
  const deleteChanges = jest.fn(() => Promise.resolve(1));
  const changeService = {
    deleteChanges,
    getChanges,
  } as unknown as ChangeService;
  const mapService = new MapService(changeService);

  const snapshotPending = mapService.getChangesSnapshot(0);
  await Promise.resolve();
  expect(getChanges).toHaveBeenCalledTimes(1);

  await expect(mapService.deletePendingChanges(["deleted"])).resolves.toBe(1);
  finishSnapshotRead([]);

  await expect(snapshotPending).resolves.toMatchObject({ changes: [] });
  expect(getChanges).toHaveBeenCalledTimes(2);
});
