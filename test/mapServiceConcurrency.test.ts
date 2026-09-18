import { expect, jest, test } from "@jest/globals";
import { Change } from "../src/models/business/change.js";
import { config, type MapProject } from "../src/config/values.js";
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

test("staged review expiry waits for an in-flight baseline mutation", async () => {
  let finishMutation: () => void = () => undefined;
  const mutationPending = new Promise<void>((resolve) => {
    finishMutation = resolve;
  });
  const stagedUpstreamReviews = new Map([
    ["review", { directory: "/tmp/nonexistent-staged-review" }],
  ]);
  const runtime = {
    baselineUpdateQueue: mutationPending,
    baselineUpdateRevision: 0,
    stagedUpstreamReviews,
  };
  const mapService = new MapService({} as ChangeService) as unknown as {
    enqueueStagedReviewExpiry(
      runtimeState: typeof runtime,
      project: MapProject,
      reviewId: string,
    ): void;
  };

  mapService.enqueueStagedReviewExpiry(runtime, config.projects[0], "review");
  await Promise.resolve();

  expect(stagedUpstreamReviews.has("review")).toBe(true);
  finishMutation();
  await runtime.baselineUpdateQueue;
  expect(stagedUpstreamReviews.has("review")).toBe(false);
});
