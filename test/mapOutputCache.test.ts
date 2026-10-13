import { expect, jest, test } from "@jest/globals";
import { renderMetrics } from "../src/observability.js";
import { MapOutputCache } from "../src/services/mapOutputCache.js";

const current = (): boolean => true;

test("eviction respects both bytes and recent use", async () => {
  const cache = new MapOutputCache(6, 2);
  const a = jest.fn(() => Promise.resolve(Buffer.from("aaa")));
  const b = jest.fn(() => Promise.resolve(Buffer.from("bbb")));
  const c = jest.fn(() => Promise.resolve(Buffer.from("cccc")));
  await cache.get("a", a, current);
  await cache.get("b", b, current);
  await cache.get("a", a, current);
  await cache.get("c", c, current);
  // c requires eviction of both earlier entries to satisfy the byte limit.
  await cache.get("a", a, current);
  expect(a).toHaveBeenCalledTimes(2);
  expect(c).toHaveBeenCalledTimes(1);
});

test("least recently used entry is evicted at the entry limit", async () => {
  const cache = new MapOutputCache(100, 2);
  const generate = jest.fn(() => Promise.resolve(Buffer.from("data")));
  await cache.get("a", generate, current);
  await cache.get("b", generate, current);
  await cache.get("a", generate, current);
  await cache.get("c", generate, current);
  await cache.get("a", generate, current);
  expect(generate).toHaveBeenCalledTimes(3);
  await cache.get("b", generate, current);
  expect(generate).toHaveBeenCalledTimes(4);
});

test("retained cache size is observable", async () => {
  const cache = new MapOutputCache(6, 2);
  await cache.get("a", () => Promise.resolve(Buffer.from("aaa")), current);
  await cache.get("b", () => Promise.resolve(Buffer.from("bbb")), current);
  expect(renderMetrics()).toContain("crowdmap_map_cache_bytes 6");
  expect(renderMetrics()).toContain("crowdmap_map_cache_entries 2");
  expect(renderMetrics()).toContain(
    'crowdmap_map_cache_events_total{event="hit"}',
  );
});

test.each([
  [0, 2],
  [100, 0],
  [1, 2],
])(
  "disabled and oversized entries are not retained (%i bytes, %i entries)",
  async (maxBytes, maxEntries) => {
    const cache = new MapOutputCache(maxBytes, maxEntries);
    const generate = jest.fn(() => Promise.resolve(Buffer.from("data")));
    await cache.get("a", generate, current);
    await cache.get("a", generate, current);
    expect(generate).toHaveBeenCalledTimes(2);
  },
);

test("failed and obsolete generation is not retained", async () => {
  const cache = new MapOutputCache(100, 2);
  const generate = jest
    .fn<() => Promise<Buffer>>()
    .mockRejectedValueOnce(new Error("worker failed"))
    .mockResolvedValue(Buffer.from("data"));
  await expect(cache.get("a", generate, current)).rejects.toThrow(
    "worker failed",
  );
  await cache.get("a", generate, () => false);
  await cache.get("a", generate, current);
  await cache.get("a", generate, current);
  expect(generate).toHaveBeenCalledTimes(3);
});

test("equivalent simultaneous requests share generation, including oversized outputs", async () => {
  const cache = new MapOutputCache(1, 2);
  let complete: (data: Buffer) => void = () => undefined;
  const generate = jest.fn(
    () =>
      new Promise<Buffer>((resolve) => {
        complete = resolve;
      }),
  );
  const first = cache.get("a", generate, current);
  const second = cache.get("a", generate, current);
  await Promise.resolve();
  complete(Buffer.from("data"));
  const [left, right] = await Promise.all([first, second]);
  expect(left).toEqual(right);
  expect(generate).toHaveBeenCalledTimes(1);
});
