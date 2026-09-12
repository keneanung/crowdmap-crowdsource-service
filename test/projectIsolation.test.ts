import { afterEach, expect, jest, test } from "@jest/globals";
import { copyFile, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { MapProject } from "../src/config/values.js";
import { config } from "../src/config/values.js";
import { ChangeRoomName, type Change } from "../src/models/business/change.js";
import {
  HostProjectResolver,
  ProjectRegistry,
} from "../src/projects/projectContext.js";
import { ChangeService } from "../src/services/changeService.js";
import { MapService } from "../src/services/mapService.js";
import { canAdministerProject } from "../src/services/userService.js";

const originalProjects = config.projects;
const originalHostMap = config.hostProjectMap;
const originalPlatformHost = config.platformHost;
afterEach(() => {
  config.projects = originalProjects;
  config.hostProjectMap = originalHostMap;
  config.platformHost = originalPlatformHost;
});

const project = (id: string, directory = "/tmp"): MapProject => ({
  id,
  name: `${id} map`,
  mapFile: join(directory, `${id}.map`),
  versionFile: join(directory, `${id}.version`),
  mapDownloadUrl: `https://example.test/${id}/map`,
  versionDownloadUrl: `https://example.test/${id}/version`,
});

test("host resolution accepts only configured hosts and preserves a platform host", () => {
  config.projects = [project("alpha"), project("beta")];
  config.hostProjectMap = {
    "alpha.example.test": "alpha",
    "beta.example.test": "beta",
  };
  config.platformHost = "maps.example.test";
  const resolver = new HostProjectResolver(new ProjectRegistry());

  expect(
    resolver.resolve({ hostname: "alpha.example.test" }).context?.project.id,
  ).toBe("alpha");
  expect(resolver.resolve({ hostname: "maps.example.test" })).toEqual({
    platform: true,
  });
  expect(() => resolver.resolve({ hostname: "attacker.example.test" })).toThrow(
    "No map project is configured",
  );
});

test("map snapshots use only the requested project's changes and version", async () => {
  const directory = await mkdtemp(join(tmpdir(), "crowdmap-project-test-"));
  const alpha = project("alpha", directory);
  const beta = project("beta", directory);
  await Promise.all([
    writeFile(alpha.versionFile, "alpha-v1"),
    writeFile(beta.versionFile, "beta-v1"),
  ]);
  const changes = new Map<string, Change[]>([
    [
      "alpha",
      [
        new ChangeRoomName(
          1,
          ["a"],
          "Alpha",
          "00000000-0000-0000-0000-000000000001",
        ),
      ],
    ],
    [
      "beta",
      [
        new ChangeRoomName(
          1,
          ["b"],
          "Beta",
          "00000000-0000-0000-0000-000000000002",
        ),
      ],
    ],
  ]);
  const changeService = {
    addChange: jest.fn(),
    applyChanges: jest.fn(),
    reconcileChanges: jest.fn(),
    getChanges: jest.fn(
      (
        _seen: number,
        _include?: string[],
        _exclude?: string[],
        projectId?: string,
      ) => Promise.resolve(changes.get(projectId ?? "") ?? []),
    ),
  } as unknown as ChangeService;
  const service = new MapService(changeService);

  const [alphaSnapshot, betaSnapshot] = await Promise.all([
    service.getChangesSnapshot(0, [], [], alpha),
    service.getChangesSnapshot(0, [], [], beta),
  ]);
  expect(alphaSnapshot.rawVersion).toBe("alpha-v1");
  expect(
    alphaSnapshot.changes.map((change) => (change as ChangeRoomName).name),
  ).toEqual(["Alpha"]);
  expect(betaSnapshot.rawVersion).toBe("beta-v1");
  expect(
    betaSnapshot.changes.map((change) => (change as ChangeRoomName).name),
  ).toEqual(["Beta"]);
  await rm(directory, { recursive: true, force: true });
});

test("map administrators are project-scoped while site administrators are global", () => {
  config.projects = [project("alpha"), project("beta")];
  const projectAdmin = {
    name: "alpha-admin",
    roles: ["map_admin"] as "map_admin"[],
    mapAdminProjects: ["alpha"],
    salt: "salt",
    hashed_api_key: "hash",
  };
  const siteAdmin = {
    name: "site-admin",
    roles: ["site_admin"] as "site_admin"[],
    salt: "salt",
    hashed_api_key: "hash",
  };
  expect(canAdministerProject(projectAdmin, "alpha")).toBe(true);
  expect(canAdministerProject(projectAdmin, "beta")).toBe(false);
  expect(canAdministerProject(siteAdmin, "alpha")).toBe(true);
  expect(canAdministerProject(siteAdmin, "beta")).toBe(true);
});

test("an explicit empty project assignment revokes single-project administration", () => {
  config.projects = [project("alpha")];
  const legacyAdmin = {
    name: "legacy-admin",
    roles: ["map_admin"] as "map_admin"[],
    salt: "salt",
    hashed_api_key: "hash",
  };
  expect(canAdministerProject(legacyAdmin, "alpha")).toBe(true);
  expect(
    canAdministerProject({ ...legacyAdmin, mapAdminProjects: [] }, "alpha"),
  ).toBe(false);
});

test("a broken project does not make a healthy project unavailable", async () => {
  const directory = await mkdtemp(join(tmpdir(), "crowdmap-health-test-"));
  const healthy = project("healthy", directory);
  const broken = project("broken", directory);
  await Promise.all([
    copyFile(
      join(process.cwd(), "test/setup/baselineFiles/map"),
      healthy.mapFile,
    ),
    writeFile(healthy.versionFile, "healthy-v1"),
    writeFile(broken.mapFile, "not a Mudlet map"),
    writeFile(broken.versionFile, "broken-v1"),
  ]);
  const changeService = {
    addChange: jest.fn(),
    applyChanges: jest.fn(),
    reconcileChanges: jest.fn(),
    getChanges: jest.fn(() => Promise.resolve([])),
  } as unknown as ChangeService;
  const service = new MapService(changeService);

  await expect(service.initializeProject(healthy)).resolves.toBeUndefined();
  await expect(service.initializeProject(broken)).rejects.toThrow();
  await expect(service.getRawVersion(healthy)).resolves.toBe("healthy-v1");
  await expect(service.getRawVersion(broken)).rejects.toThrow(
    "Map project broken is unavailable",
  );
  expect(service.projectStatus(broken)).toEqual({
    id: "broken",
    name: "broken map",
    status: "unavailable",
  });

  await copyFile(
    join(process.cwd(), "test/setup/baselineFiles/map"),
    broken.mapFile,
  );
  await expect(service.initializeProject(broken)).resolves.toBeUndefined();
  await expect(service.getRawVersion(broken)).resolves.toBe("broken-v1");
  expect(service.projectStatus(broken).status).toBe("ok");
  await rm(directory, { recursive: true, force: true });
});

test("one project's baseline queue does not block another project", async () => {
  const directory = await mkdtemp(join(tmpdir(), "crowdmap-queue-test-"));
  const alpha = project("alpha", directory);
  const beta = project("beta", directory);
  await Promise.all([
    writeFile(alpha.versionFile, "alpha-v1"),
    writeFile(beta.versionFile, "beta-v1"),
  ]);
  const changeService = {
    addChange: jest.fn(),
    applyChanges: jest.fn(),
    reconcileChanges: jest.fn(),
    getChanges: jest.fn(() => Promise.resolve([])),
  } as unknown as ChangeService;
  const service = new MapService(changeService);
  await Promise.all([
    service.getRawVersion(alpha),
    service.getRawVersion(beta),
  ]);
  let releaseAlpha = (): void => undefined;
  const alphaBlocked = new Promise<void>((resolve) => {
    releaseAlpha = resolve;
  });
  const internal = service as unknown as {
    runtimes: Map<
      string,
      {
        baselineUpdateQueue: Promise<void>;
        baselineUpdateRevision: number;
        stagedUpstreamReviews: Map<string, unknown>;
      }
    >;
  };
  const alphaRuntime = internal.runtimes.get("alpha");
  if (!alphaRuntime) throw new Error("alpha runtime was not initialized");
  alphaRuntime.baselineUpdateQueue = alphaBlocked;

  const alphaSnapshot = service.getChangesSnapshot(0, [], [], alpha);
  await expect(
    service.getChangesSnapshot(0, [], [], beta),
  ).resolves.toMatchObject({
    rawVersion: "beta-v1",
  });
  releaseAlpha();
  await expect(alphaSnapshot).resolves.toMatchObject({
    rawVersion: "alpha-v1",
  });
  await rm(directory, { recursive: true, force: true });
});
