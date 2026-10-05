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
) {
  const source = await readFile(
    new URL("../website/javascripts/review-map.ts", import.meta.url),
    "utf8",
  );
  const compiled = await transform(source, { loader: "ts", format: "cjs" });
  const renderers: Renderer[] = [];
  const snapshots = [baselineRooms, candidateRooms].map((rooms) => ({
    kind: "plain",
    map: [{ rooms }],
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
      show: (ids: string[], changes: unknown[], id: number) => Promise<void>;
      focus: (id: number) => void;
    },
  };
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
              constructor() {
                super();
                renderers.push(this);
              }
            },
          },
    document: { querySelector: element },
    window,
    URLSearchParams,
    CustomEvent: jest.fn(),
    fetch: () =>
      Promise.resolve({ ok: true, arrayBuffer: () => new ArrayBuffer(0) }),
  });
  await window.CrowdmapReviewMap.show(["report"], [], roomId);
  return { renderers, element, focus: window.CrowdmapReviewMap.focus };
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
  const { element, focus } = await preview(
    [existing],
    [existing, { ...added, area: 8 }],
    42,
  );
  expect(element("#baseline-map").style.visibility).toBe("hidden");
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
