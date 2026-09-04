import { ALL_VISIBLE, createSettings, MapRenderer } from "mudlet-map-renderer";
import {
  parseMudletMap,
  readerFromLoadedMap,
  type LoadedMudletMap,
} from "mudlet-map-renderer/binary";

type ReviewChange = Record<string, unknown> & { changeId: string; type: string; roomNumber?: number; destination?: number };
type Snapshot = { loaded: LoadedMudletMap; reader: ReturnType<typeof readerFromLoadedMap> };

const baselineElement = document.querySelector<HTMLDivElement>("#baseline-map")!;
const candidateElement = document.querySelector<HTMLDivElement>("#candidate-map")!;
const baselineStatus = document.querySelector<HTMLElement>("#baseline-map-status")!;
const candidateStatus = document.querySelector<HTMLElement>("#candidate-map-status")!;
const comparisonElement = document.querySelector<HTMLElement>("#map-comparison")!;

let baseline: Snapshot | undefined;
let candidate: Snapshot | undefined;
let baselineRenderer: MapRenderer | undefined;
let candidateRenderer: MapRenderer | undefined;
let currentChanges: ReviewChange[] = [];
let differenceMode = false;
let syncing = false;
let blinkTimer: number | undefined;

function room(snapshot: Snapshot | undefined, roomId: number) {
  if (!snapshot || snapshot.loaded.kind !== "plain") return undefined;
  return snapshot.loaded.map.flatMap((area) => area.rooms).find((item) => item.id === roomId);
}

function allChangedRoomIds(changes: ReviewChange[]) {
  const ids = new Set<number>();
  changes.forEach((change) => {
    if (typeof change.roomNumber === "number") ids.add(change.roomNumber);
    if (typeof change.destination === "number" && change.type.includes("exit")) ids.add(change.destination);
  });
  return ids;
}

function exitPairs(changes: ReviewChange[]) {
  const pairs = new Set<string>();
  changes.forEach((change) => {
    if (typeof change.roomNumber !== "number" || typeof change.destination !== "number" || !change.type.includes("exit")) return;
    pairs.add([change.roomNumber, change.destination].sort((a, b) => a - b).join(":"));
  });
  return pairs;
}

function snapshotUrl(timesSeen: number, ids: string[]) {
  const query = new URLSearchParams({ format: "binary", timesSeen: String(timesSeen) });
  ids.forEach((id) => query.append("include", id));
  return "map?" + query;
}

async function fetchSnapshot(url: string): Promise<Snapshot> {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Map request failed (HTTP " + response.status + ")");
  const loaded = parseMudletMap(new Uint8Array(await response.arrayBuffer()));
  return { loaded, reader: readerFromLoadedMap(loaded) };
}

function rendererFor(snapshot: Snapshot, element: HTMLDivElement) {
  const settings = createSettings();
  settings.backgroundColor = "#081321";
  settings.gridEnabled = true;
  settings.areaName = false;
  settings.highlight.fillAlpha = 0.18;
  settings.highlight.strokeWidth = 0.11;
  return new MapRenderer(snapshot.reader, settings, element);
}

function draw(renderer: MapRenderer | undefined, snapshot: Snapshot | undefined, roomId?: number) {
  if (!renderer || !snapshot) return;
  const target = room(snapshot, roomId || 0) || (snapshot.loaded.kind === "plain" ? snapshot.loaded.map[0]?.rooms[0] : undefined);
  if (!target) return;
  renderer.drawArea(target.area, target.z);
  renderer.setPosition(target.id);
}

function applyLens(renderer: MapRenderer | undefined, changes: ReviewChange[]) {
  if (!renderer) return;
  if (!differenceMode) {
    renderer.setLens(ALL_VISIBLE);
    return;
  }
  const ids = allChangedRoomIds(changes);
  const pairs = exitPairs(changes);
  renderer.setLens({
    isVisible: (item) => ids.has(item.id),
    getExitTreatment: (exit) => pairs.has([exit.a, exit.b].sort((a, b) => a - b).join(":")) ? "full" : "hidden",
    getVersion: () => 1,
  });
}

function highlight(renderer: MapRenderer | undefined, own: Snapshot | undefined, other: Snapshot | undefined, changes: ReviewChange[], missingColor: string) {
  if (!renderer) return;
  renderer.clearHighlights();
  allChangedRoomIds(changes).forEach((id) => {
    const here = room(own, id);
    const there = room(other, id);
    if (!here) return;
    renderer.renderHighlight(id, !there ? missingColor : "#ffbe55");
  });
}

function sync(from: MapRenderer, to: MapRenderer) {
  from.on("zoom", ({ zoom }) => {
    if (syncing) return;
    syncing = true;
    to.zoomToCenter(zoom);
    syncing = false;
  });
  from.on("pan", (bounds) => {
    if (syncing) return;
    syncing = true;
    to.camera.panToMapPoint((bounds.minX + bounds.maxX) / 2, (bounds.minY + bounds.maxY) / 2);
    syncing = false;
  });
  from.on("roomclick", ({ roomId }) => focus(roomId));
  from.on("areaexitclick", ({ targetRoomId }) => focus(targetRoomId));
}

function announceRoom(roomId: number) {
  window.dispatchEvent(new CustomEvent("crowdmapreview:roomselect", { detail: { roomId } }));
}

export function focus(roomId: number) {
  draw(baselineRenderer, baseline, roomId);
  draw(candidateRenderer, candidate, roomId);
  if (baselineRenderer && room(baseline, roomId)) baselineRenderer.centerOn(roomId, true);
  if (candidateRenderer && room(candidate, roomId)) candidateRenderer.centerOn(roomId, true);
  announceRoom(roomId);
}

export async function show(ids: string[], changes: ReviewChange[], roomId?: number) {
  baselineStatus.textContent = "Loading…";
  candidateStatus.textContent = "Loading…";
  currentChanges = changes;
  window.clearInterval(blinkTimer);
  comparisonElement.classList.remove("blinking");
  try {
    const result = await Promise.all([
      fetchSnapshot(snapshotUrl(2147483647, [])),
      fetchSnapshot(snapshotUrl(0, ids)),
    ]);
    baseline = result[0];
    candidate = result[1];
    baselineRenderer?.destroy();
    candidateRenderer?.destroy();
    baselineElement.replaceChildren();
    candidateElement.replaceChildren();
    baselineRenderer = rendererFor(baseline, baselineElement);
    candidateRenderer = rendererFor(candidate, candidateElement);
    sync(baselineRenderer, candidateRenderer);
    sync(candidateRenderer, baselineRenderer);
    applyLens(baselineRenderer, changes);
    applyLens(candidateRenderer, changes);
    highlight(baselineRenderer, baseline, candidate, changes, "#ff6f7d");
    highlight(candidateRenderer, candidate, baseline, changes, "#5ee1b2");
    draw(baselineRenderer, baseline, roomId);
    draw(candidateRenderer, candidate, roomId);
    baselineStatus.textContent = "Published map";
    candidateStatus.textContent = ids.length ? ids.length + " selected report" + (ids.length === 1 ? "" : "s") : "No reports selected";
    if (roomId) announceRoom(roomId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Map preview unavailable";
    baselineStatus.textContent = message;
    candidateStatus.textContent = message;
  }
}

export function setDifferenceMode(enabled: boolean) {
  differenceMode = enabled;
  applyLens(baselineRenderer, currentChanges);
  applyLens(candidateRenderer, currentChanges);
}

export function setWipe(value: number) {
  comparisonElement.style.setProperty("--wipe-position", String(value) + "%");
}

export function setWipeMode(enabled: boolean) {
  comparisonElement.classList.toggle("wipe", enabled);
  window.setTimeout(() => {
    baselineRenderer?.refresh();
    candidateRenderer?.refresh();
  });
}

export function toggleBlink() {
  if (blinkTimer) {
    window.clearInterval(blinkTimer);
    blinkTimer = undefined;
    comparisonElement.classList.remove("blinking");
    candidateElement.parentElement?.classList.remove("blink-hidden");
    return false;
  }
  blinkTimer = window.setInterval(() => candidateElement.parentElement?.classList.toggle("blink-hidden"), 650);
  comparisonElement.classList.add("blinking");
  return true;
}

export function getRoomComparison(roomId: number) {
  return { baseline: room(baseline, roomId), candidate: room(candidate, roomId), changes: currentChanges.filter((item) => item.roomNumber === roomId || item.destination === roomId) };
}

window.CrowdmapReviewMap = { focus, getRoomComparison, setDifferenceMode, setWipe, setWipeMode, show, toggleBlink };
