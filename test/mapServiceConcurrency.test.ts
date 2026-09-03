import { expect, jest, test } from "@jest/globals";
import { Change } from "../src/models/business/change";
import { ChangeService } from "../src/services/changeService";
import { MapService } from "../src/services/mapService";

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
    mapService.applyBaselineUpdate("outdated-version", []),
  ).rejects.toThrow(
    "The map version provided does not match the current map version",
  );
  resolveChanges([]);

  await expect(snapshotPending).resolves.toMatchObject({ rawVersion: "466" });
  expect(getChanges).toHaveBeenCalledTimes(1);
});
