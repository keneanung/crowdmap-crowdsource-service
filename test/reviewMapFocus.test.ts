import { expect, jest, test } from "@jest/globals";
import { transform } from "esbuild";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";

interface Room {
  id: number;
  area: number;
  x: number;
  y: number;
  z: number;
}

class Renderer {
  area?: number;
  level?: number;
  position?: number;
  center?: number;
  point?: { x: number; y: number };
  camera = {
    panToMapPoint: (x: number, y: number) => {
      this.point = { x, y };
    },
  };
  drawArea(area: number, level: number) {
    this.area = area;
    this.level = level;
  }
  setPosition(id: number) {
    this.position = id;
  }
  centerOn(id: number) {
    this.center = id;
  }
  clearPosition() {
    this.position = undefined;
  }
  on = jest.fn();
  setLens = jest.fn();
  clearHighlights = jest.fn();
  renderHighlight = jest.fn();
  destroy = jest.fn();
}

async function preview(
  baselineRooms: Room[],
  candidateRooms: Room[],
  roomId: number,
  options: {
    ids?: string[];
    allReports?: boolean;
    expectedVersion?: string;
    candidateVersion?: string;
    rawVersions?: [string, string];
    changedRoomIds?: number[];
    onRoomRead?: () => void;
  } = {},
) {
  const source = await readFile(
    new URL("../website/javascripts/review-map.ts", import.meta.url),
    "utf8",
  );
  const compiled = await transform(source, { loader: "ts", format: "cjs" });
  const renderers: Renderer[] = [];
  const snapshots = [baselineRooms, candidateRooms].map((rooms) => ({
    kind: "plain",
    map: [
      {
        get rooms() {
          options.onRoomRead?.();
          return rooms;
        },
      },
    ],
  }));
  const elements = new Map<
    string,
    {
      style: { visibility: string };
      textContent: string;
      replaceChildren: () => void;
      classList: { remove: () => void };
    }
  >();
  const element = (selector: string) => {
    let result = elements.get(selector);
    if (!result) {
      result = {
        style: { visibility: "" },
        textContent: "",
        replaceChildren: jest.fn(),
        classList: { remove: jest.fn() },
      };
      elements.set(selector, result);
    }
    return result;
  };
  const window = {
    clearInterval: jest.fn(),
    dispatchEvent: jest.fn(),
    CrowdmapReviewMap: undefined as unknown as {
      show: (
        ids: string[],
        changes: unknown[],
        id: number,
        reviewId?: string,
        allReports?: boolean,
        expectedVersion?: string,
      ) => Promise<void>;
      focus: (id: number) => boolean;
    },
  };
  let requestIndex = 0;
  const fetch = jest
    .fn<(_url: string) => Promise<unknown>>()
    .mockImplementation(() => {
      const index = requestIndex++;
      return Promise.resolve({
        ok: true,
        headers: {
          get: (name: string) =>
            name === "X-Map-Version"
              ? index === 1
                ? (options.candidateVersion ?? "v1")
                : "baseline"
              : (options.rawVersions?.[index] ?? "raw-v1"),
        },
        arrayBuffer: () => new ArrayBuffer(0),
      });
    });
  runInNewContext(compiled.code, {
    module: { exports: {} },
    require: (name: string) =>
      name.endsWith("/binary")
        ? {
            parseMudletMap: () => snapshots.shift(),
            readerFromLoadedMap: (snapshot: { map: { rooms: Room[] }[] }) => ({
              getArea: (area: number) =>
                snapshot.map[0].rooms.some((room) => room.area === area)
                  ? {}
                  : undefined,
            }),
          }
        : {
            ALL_VISIBLE: {},
            createSettings: () => ({ highlight: {} }),
            MapRenderer: class extends Renderer {
              constructor(
                private reader: { getArea: (area: number) => unknown },
              ) {
                super();
                renderers.push(this);
              }
              override drawArea(area: number, level: number) {
                if (!this.reader.getArea(area)) throw new Error("Unknown area");
                super.drawArea(area, level);
              }
            },
          },
    document: { querySelector: element },
    window,
    URLSearchParams,
    CustomEvent: jest.fn(),
    fetch,
  });
  const ids = options.ids ?? ["report"];
  const changes = ids.map((changeId, index) => ({
    changeId,
    type: "room-name",
    roomNumber: options.changedRoomIds?.[index] ?? roomId,
  }));
  await window.CrowdmapReviewMap.show(
    ids,
    changes,
    roomId,
    undefined,
    options.allReports,
    options.expectedVersion,
  );
  return { renderers, element, fetch, focus: window.CrowdmapReviewMap.focus };
}

const existing = { id: 1, area: 7, x: 0, y: 0, z: 0 };
const added = { id: 42, area: 7, x: 10, y: 20, z: 2 };

test("a new room frames its candidate location in both panes without choosing an unrelated baseline room", async () => {
  const { renderers, focus } = await preview([existing], [existing, added], 42);
  expect(renderers[0].area).toBe(7);
  expect(renderers[0].level).toBe(2);
  expect(renderers[0].position).toBeUndefined();
  expect(renderers[0].point).toEqual({ x: 10, y: 20 });
  expect(renderers[1].position).toBe(42);
  focus(1);
  expect(renderers[0].position).toBe(1);
  focus(42);
  expect(renderers[0].position).toBeUndefined();
  expect(renderers[1].center).toBe(42);
});

test("a new area leaves the missing baseline pane blank and restores it on existing-room focus", async () => {
  const { element, focus, renderers } = await preview(
    [existing],
    [existing, { ...added, area: 8 }],
    42,
  );
  expect(element("#baseline-map").style.visibility).toBe("hidden");
  expect(renderers[0].area).toBeUndefined();
  expect(renderers[1].area).toBe(8);
  expect(renderers[1].center).toBe(42);
  expect(element("#candidate-map").style.visibility).toBe("");
  focus(1);
  expect(element("#baseline-map").style.visibility).toBe("");
});

test("a deleted room frames its baseline location in the candidate pane", async () => {
  const { renderers } = await preview([existing, added], [existing], 42);
  expect(renderers[0].position).toBe(42);
  expect(renderers[1].position).toBeUndefined();
  expect(renderers[1].point).toEqual({ x: 10, y: 20 });
});

test("a deleted area leaves the missing candidate pane blank without drawing it", async () => {
  const { element, renderers } = await preview(
    [existing, { ...added, area: 8 }],
    [existing],
    42,
  );
  expect(element("#candidate-map").style.visibility).toBe("hidden");
  expect(renderers[1].area).toBeUndefined();
  expect(renderers[0].area).toBe(8);
  expect(renderers[0].center).toBe(42);
});

test("focusing a room absent from both snapshots preserves the current map views", async () => {
  const { renderers, element, focus, fetch } = await preview(
    [existing],
    [existing],
    1,
  );
  expect(focus(42)).toBe(false);
  expect(renderers[0].position).toBe(1);
  expect(renderers[1].position).toBe(1);
  expect(element("#baseline-map").style.visibility).toBe("");
  expect(element("#candidate-map").style.visibility).toBe("");
  expect(fetch).toHaveBeenCalledTimes(2);
});

test("all-report previews use a bounded URL even with thousands of pending reports", async () => {
  const ids = Array.from(
    { length: 2000 },
    (_, index) => "report-" + String(index),
  );
  const { fetch } = await preview([existing], [existing], 1, {
    ids,
    allReports: true,
  });
  expect(fetch.mock.calls[1][0]).toBe("map?format=binary&timesSeen=0");
});

test("subset previews retain explicit includes and empty selections load only the baseline", async () => {
  const subset = await preview([existing], [existing], 1, {
    ids: ["selected"],
  });
  expect(subset.fetch.mock.calls[1][0]).toBe(
    "map?format=binary&timesSeen=0&include=selected",
  );
  const empty = await preview([existing], [existing], 1, { ids: [] });
  expect(empty.fetch.mock.calls[1][0]).toBe(
    "map?format=binary&timesSeen=2147483647",
  );
});

test("highlighting thousands of rooms reads each snapshot a bounded number of times", async () => {
  const rooms = Array.from({ length: 2000 }, (_, index) => ({
    ...existing,
    id: index + 1,
  }));
  const changedRoomIds = rooms.map((room) => room.id);
  const onRoomRead = jest.fn();
  const { renderers, focus } = await preview(rooms, rooms, 1, {
    ids: changedRoomIds.map(String),
    changedRoomIds,
    allReports: true,
    onRoomRead,
  });
  expect(renderers[0].renderHighlight).toHaveBeenCalledTimes(2000);
  expect(renderers[1].renderHighlight).toHaveBeenCalledTimes(2000);
  expect(onRoomRead.mock.calls.length).toBeLessThan(12);
  const readsAfterHighlighting = onRoomRead.mock.calls.length;
  focus(2000);
  expect(onRoomRead.mock.calls.length - readsAfterHighlighting).toBeLessThan(6);
});

test.each(["report-added", "report-deleted", "baseline-updated"])(
  "all-report previews reject a queue version mismatch after %s",
  async (candidateVersion) => {
    await expect(
      preview([existing], [existing], 1, {
        allReports: true,
        expectedVersion: "queue-v1",
        candidateVersion,
      }),
    ).rejects.toThrow("Refresh the queue before previewing all reports");
  },
);

test("all-report previews accept the loaded queue version", async () => {
  const { fetch } = await preview([existing], [existing], 1, {
    allReports: true,
    expectedVersion: "queue-v1",
    candidateVersion: "queue-v1",
  });
  expect(fetch.mock.calls[1][0]).toBe("map?format=binary&timesSeen=0");
});

test("maps from different baseline versions are not compared", async () => {
  await expect(
    preview([existing], [existing], 1, {
      rawVersions: ["raw-v1", "raw-v2"],
    }),
  ).rejects.toThrow("The baseline changed while loading the maps");
});
