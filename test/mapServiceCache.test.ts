import { afterEach, expect, jest, test } from "@jest/globals";
import { readFile, rm, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { config } from "../src/config/values.js";
import { ChangeRoomName } from "../src/models/business/change.js";
import type {
  MapWorkerRequest,
  MapWorkerResponse,
} from "../src/models/business/mapWorker.js";
import { ChangeService } from "../src/services/changeService.js";
import { MapService } from "../src/services/mapService.js";

const directories = new Set<string>();
afterEach(async () => {
  await Promise.all(
    [...directories].map((directory) =>
      rm(directory, { recursive: true, force: true }),
    ),
  );
  directories.clear();
});

function setup() {
  const getChanges = jest
    .fn<ChangeService["getChanges"]>()
    .mockResolvedValue([]);
  const service = new MapService({ getChanges } as unknown as ChangeService);
  const worker = jest
    .spyOn(
      service as unknown as {
        runMapWorker(request: MapWorkerRequest): Promise<MapWorkerResponse>;
      },
      "runMapWorker",
    )
    .mockImplementation(async (request) => {
      if (request.outputFile)
        await writeFile(request.outputFile, `${request.operation}:map`);
      return { content: "mapData = [];" };
    });
  return { service, getChanges, worker };
}

async function download(
  service: MapService,
  reporter = "Alice",
  format: "binary" | "json" = "binary",
) {
  const snapshot = await service.getChangedMapFile(
    5,
    format,
    [],
    [],
    undefined,
    undefined,
    undefined,
    reporter,
  );
  directories.add(dirname(snapshot.file));
  return snapshot;
}

test("authors, thresholds and filters share effective output while metadata stays fresh", async () => {
  const { service, getChanges, worker } = setup();
  const firstChange = new ChangeRoomName(42, ["Alice"], "Room", "same-id");
  const secondChange = new ChangeRoomName(
    42,
    ["Alice", "Bob"],
    "Room",
    "same-id",
  );
  getChanges
    .mockResolvedValueOnce([firstChange])
    .mockResolvedValue([secondChange]);
  const first = await download(service);
  await rm(dirname(first.file), { recursive: true, force: true });
  const second = await service.getChangedMapFile(
    2,
    "binary",
    ["same-id"],
    [],
    undefined,
    undefined,
    undefined,
    "Bob",
  );
  directories.add(dirname(second.file));
  expect(await readFile(second.file, "utf8")).toBe("binary:map");
  expect(second.file).not.toBe(first.file);
  expect(second.version).toBe(first.version);
  expect(second.changes[0].reporters).toEqual(new Set(["Alice", "Bob"]));
  expect(getChanges).toHaveBeenCalledTimes(2);
  expect(getChanges).toHaveBeenLastCalledWith(
    2,
    ["same-id"],
    [],
    "default",
    "Bob",
  );
  expect(worker).toHaveBeenCalledTimes(1);
});

test("formats, selection, ordering and projects have separate outputs", async () => {
  const { service, getChanges, worker } = setup();
  const a = new ChangeRoomName(42, [], "A", "a");
  const b = new ChangeRoomName(42, [], "B", "b");
  getChanges.mockResolvedValue([a, b]);
  await download(service);
  await download(service, "Bob", "json");
  await service.getRendererSnapshot(5);
  await service.getRendererSnapshot(5, [], [], undefined, "Bob");
  expect(worker).toHaveBeenCalledTimes(3);
  getChanges.mockResolvedValue([b, a]);
  await download(service);
  getChanges.mockResolvedValue([a]);
  await download(service);
  const other = await service.getChangedMapFile(
    5,
    "binary",
    [],
    [],
    undefined,
    undefined,
    { ...config.projects[0], id: "other" },
  );
  directories.add(dirname(other.file));
  expect(worker).toHaveBeenCalledTimes(6);
});

test("simultaneous downloads get independent files from one worker", async () => {
  const { service, worker } = setup();
  const [first, second] = await Promise.all([
    download(service),
    download(service, "Bob"),
  ]);
  expect(worker).toHaveBeenCalledTimes(1);
  expect(first.file).not.toBe(second.file);
  await rm(dirname(first.file), { recursive: true, force: true });
  expect(await readFile(second.file, "utf8")).toBe("binary:map");
});

test("a failed worker is retried and its temporary directory is cleaned", async () => {
  const { service, worker } = setup();
  let failedFile = "";
  worker.mockImplementationOnce((request) => {
    failedFile = request.outputFile ?? "";
    return Promise.reject(new Error("worker failed"));
  });
  await expect(download(service)).rejects.toThrow("worker failed");
  await expect(readFile(failedFile)).rejects.toMatchObject({ code: "ENOENT" });
  await download(service);
  expect(worker).toHaveBeenCalledTimes(2);
});

test("explicit review baselines bypass caching", async () => {
  const { service, worker } = setup();
  for (let i = 0; i < 2; i++) {
    const snapshot = await service.getChangedMapFile(
      5,
      "binary",
      [],
      [],
      config.projects[0].mapFile,
      "466",
    );
    directories.add(dirname(snapshot.file));
  }
  expect(worker).toHaveBeenCalledTimes(2);
});

test("overlapping baseline generations retry and cannot publish stale output", async () => {
  const { service, worker } = setup();
  const runtime = (
    service as unknown as {
      runtime(project: (typeof config.projects)[number]): {
        baselineUpdateRevision: number;
      };
    }
  ).runtime(config.projects[0]);
  worker.mockImplementationOnce(async (request) => {
    runtime.baselineUpdateRevision += 1;
    if (request.outputFile) await writeFile(request.outputFile, "obsolete");
    return {};
  });
  const first = await download(service);
  expect(await readFile(first.file, "utf8")).toBe("binary:map");
  await download(service, "Bob");
  expect(worker).toHaveBeenCalledTimes(2);
  runtime.baselineUpdateRevision += 1;
  // Same public upstream version, new baseline generation.
  await download(service);
  expect(worker).toHaveBeenCalledTimes(3);
});

test("renderer generation retries overlapping mutations", async () => {
  const { service, worker } = setup();
  const runtime = (
    service as unknown as {
      runtime(project: (typeof config.projects)[number]): {
        baselineUpdateRevision: number;
      };
    }
  ).runtime(config.projects[0]);
  worker.mockImplementationOnce(() => {
    runtime.baselineUpdateRevision += 1;
    return Promise.resolve({ content: "obsolete" });
  });
  expect((await service.getRendererSnapshot(5)).content).toBe("mapData = [];");
  await service.getRendererSnapshot(5);
  expect(worker).toHaveBeenCalledTimes(2);
});

test("a baseline mutation during a cache hit retries and removes the obsolete download", async () => {
  const { service, worker } = setup();
  await download(service);
  const runtime = (
    service as unknown as {
      runtime(project: (typeof config.projects)[number]): {
        baselineUpdateRevision: number;
      };
    }
  ).runtime(config.projects[0]);
  const createFile = service.getTempMapFileName.bind(service);
  let obsoleteFile = "";
  jest.spyOn(service, "getTempMapFileName").mockImplementationOnce(async () => {
    obsoleteFile = await createFile();
    runtime.baselineUpdateRevision += 1;
    return obsoleteFile;
  });
  const snapshot = await download(service, "Bob");
  expect(snapshot.file).not.toBe(obsoleteFile);
  await expect(readFile(obsoleteFile)).rejects.toMatchObject({
    code: "ENOENT",
  });
  expect(worker).toHaveBeenCalledTimes(2);
});

test("a rejected baseline update preserves cached output", async () => {
  const { service, worker } = setup();
  await download(service);
  await expect(service.applyBaselineUpdate("outdated", [])).rejects.toThrow(
    "does not match",
  );
  await download(service, "Bob");
  expect(worker).toHaveBeenCalledTimes(1);
});
