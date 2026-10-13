import { isDeepStrictEqual } from "node:util";

export interface ChangelogFact {
  id: string;
  areaId: number | null;
  areaName: string;
  category: string;
  count: number;
  examples: string[];
  movement?: {
    fromAreaId: number;
    fromAreaName: string;
    toAreaId: number;
    toAreaName: string;
  };
  finalRooms?: {
    roomId: number;
    name: string;
    areaId: number;
    coordinates: number[];
    weight: number;
    symbol: string;
    environment: number;
  }[];
}

export interface ChangelogEntry {
  areaId: number | null;
  areaName: string;
  text: string;
  factIds: string[];
}

export interface ChangelogNotes {
  source: "ai" | "deterministic" | "empty";
  summary: string;
  entries: ChangelogEntry[];
}

export interface MapChangelog extends ChangelogNotes {
  baseVersion: string;
  mapVersion: string;
}

// Reader colors/buffers have prototypes that structuredClone intentionally drops.
// Compare serialized state, not runtime object identity or prototypes.
const plain = (value: unknown): unknown => {
  if (value === null || typeof value !== "object") return value;
  if (ArrayBuffer.isView(value))
    return Array.from(
      new Uint8Array(value.buffer, value.byteOffset, value.byteLength),
    );
  if (Array.isArray(value)) return Array.from(value, plain);
  return Object.fromEntries(
    Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => [key, plain(item)]),
  );
};
const same = (a: unknown, b: unknown): boolean =>
  isDeepStrictEqual(plain(a), plain(b));
const areaName = (map: Mudlet.MudletMap, id: number): string | undefined =>
  Object.hasOwn(map.areaNames, id) ? map.areaNames[id] : undefined;
const directions = [
  "north",
  "northeast",
  "east",
  "southeast",
  "south",
  "southwest",
  "west",
  "northwest",
  "up",
  "down",
  "in",
  "out",
] as const;
const properties = [
  "name",
  "area",
  "x",
  "y",
  "z",
  "weight",
  "symbol",
  "environment",
] as const;
// Map names may contain terminal control characters; remove them from samples.
const clean = (value: unknown): string =>
  String(value)
    .split("")
    .map((char) =>
      char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127 ? " " : char,
    )
    .join("")
    .slice(0, 160);

/** Compare final map state, including side effects, rather than report payloads. */
export function buildOverview(
  before: Mudlet.MudletMap,
  after: Mudlet.MudletMap,
): ChangelogFact[] {
  const groups = new Map<string, Omit<ChangelogFact, "id">>();
  const add = (
    areaId: number | null,
    category: string,
    example: string,
    movement?: ChangelogFact["movement"],
  ) => {
    const key = JSON.stringify([
      areaId,
      category,
      movement?.fromAreaId,
      movement?.toAreaId,
    ]);
    let group = groups.get(key);
    if (!group) {
      group = {
        areaId,
        areaName:
          areaId === null
            ? "General"
            : clean(
                areaName(after, areaId) ??
                  areaName(before, areaId) ??
                  `Area ${String(areaId)}`,
              ),
        category,
        count: 0,
        examples: [],
        ...(movement ? { movement } : {}),
      };
      groups.set(key, group);
    }
    group.count++;
    if (group.examples.length < 2) group.examples.push(clean(example));
    return group;
  };
  for (const id of [
    ...new Set([...Object.keys(before.areas), ...Object.keys(after.areas)]),
  ]
    .map(Number)
    .sort((a, b) => a - b)) {
    if (!Object.hasOwn(before.areas, id))
      add(id, "areas added", `Area ${String(id)}`);
    else if (!Object.hasOwn(after.areas, id))
      add(id, "areas deleted", `Area ${String(id)}`);
    else if (before.areaNames[id] !== after.areaNames[id])
      add(
        id,
        "area names changed",
        `${clean(before.areaNames[id])} -> ${clean(after.areaNames[id])}`,
      );
  }
  for (const id of [
    ...new Set([...Object.keys(before.rooms), ...Object.keys(after.rooms)]),
  ]
    .map(Number)
    .sort((a, b) => a - b)) {
    let old = Object.hasOwn(before.rooms, id) ? before.rooms[id] : undefined;
    const current = Object.hasOwn(after.rooms, id)
      ? after.rooms[id]
      : undefined;
    const area = current?.area ?? old?.area ?? null;
    const label = `Room ${String(id)} (${clean(current?.name ?? old?.name ?? "unknown")})`;
    if (!old && current) {
      const added = add(area, "rooms added", label);
      const samples = (added.finalRooms ??= []);
      if (samples.length < 2)
        samples.push({
          roomId: id,
          name: clean(current.name),
          areaId: current.area,
          coordinates: [current.x, current.y, current.z],
          weight: current.weight,
          symbol: clean(current.symbol),
          environment: current.environment,
        });
      // Scalar initialization is consolidated above. Count final connections
      // against an empty room so routing details are not lost.
      old = {
        ...current,
        mSpecialExits: {},
        mSpecialExitLocks: [],
        exitWeights: {},
        doors: {},
        userData: {},
        customLines: {},
        customLinesArrow: {},
        customLinesColor: {},
        customLinesStyle: {},
      };
      for (const direction of directions) old[direction] = -1;
    }
    if (!current || !old) {
      add(area, "rooms deleted", label);
      continue;
    }
    for (const property of properties) {
      if (same(old[property], current[property])) continue;
      if (property === "area") {
        add(area, "rooms moved", label, {
          fromAreaId: old.area,
          fromAreaName: clean(
            areaName(before, old.area) ?? `Area ${String(old.area)}`,
          ),
          toAreaId: current.area,
          toAreaName: clean(
            areaName(after, current.area) ?? `Area ${String(current.area)}`,
          ),
        });
      } else {
        add(
          area,
          `room ${property} changed`,
          `${label}: ${clean(old[property])} -> ${clean(current[property])}`,
        );
      }
    }
    for (const direction of directions) {
      if (old[direction] !== current[direction]) {
        const category =
          current[direction] === -1
            ? "normal exits removed"
            : old[direction] === -1
              ? "normal exits added"
              : "normal exits changed";
        add(
          area,
          category,
          `${label}: ${direction} ${String(old[direction])} -> ${String(current[direction])}`,
        );
      }
    }
    for (const property of [
      "mSpecialExits",
      "exitWeights",
      "doors",
      "userData",
    ] as const) {
      for (const key of [
        ...new Set([
          ...Object.keys(old[property]),
          ...Object.keys(current[property]),
        ]),
      ].sort()) {
        if (isDeepStrictEqual(old[property][key], current[property][key]))
          continue;
        if (property === "userData")
          add(area, "room metadata properties changed", label);
        else {
          const category =
            property === "mSpecialExits"
              ? !Object.hasOwn(current[property], key)
                ? "special exits removed"
                : !Object.hasOwn(old[property], key)
                  ? "special exits added"
                  : "special exits changed"
              : `${property === "doors" ? "exit doors" : "exit weights"} changed`;
          add(
            area,
            category,
            `${label}: ${clean(key)} ${clean(old[property][key])} -> ${clean(current[property][key])}`,
          );
        }
      }
    }
    for (const property of [
      "customLines",
      "customLinesArrow",
      "customLinesColor",
      "customLinesStyle",
    ] as const) {
      for (const key of [
        ...new Set([
          ...Object.keys(old[property]),
          ...Object.keys(current[property]),
        ]),
      ].sort()) {
        if (!same(old[property][key], current[property][key]))
          add(
            area,
            "exit drawing properties changed",
            `${label}: ${clean(key)} (${property})`,
          );
      }
    }
    for (const command of [
      ...new Set([...old.mSpecialExitLocks, ...current.mSpecialExitLocks]),
    ].sort()) {
      if (
        old.mSpecialExitLocks.includes(command) !==
        current.mSpecialExitLocks.includes(command)
      )
        add(
          area,
          "special exit locks changed",
          `${label}: ${clean(command)} ${current.mSpecialExitLocks.includes(command) ? "locked" : "unlocked"}`,
        );
    }
  }
  for (const key of [
    ...new Set([
      ...Object.keys(before.mUserData),
      ...Object.keys(after.mUserData),
    ]),
  ].sort()) {
    if (!same(before.mUserData[key], after.mUserData[key]))
      add(null, "map metadata properties changed", "Metadata property changed");
  }
  for (const hash of [
    ...new Set([
      ...Object.keys(before.mpRoomDbHashToRoomId),
      ...Object.keys(after.mpRoomDbHashToRoomId),
    ]),
  ].sort()) {
    if (before.mpRoomDbHashToRoomId[hash] !== after.mpRoomDbHashToRoomId[hash])
      add(null, "room hash mappings changed", "Room hash mapping changed");
  }
  for (const area of [
    ...new Set([...Object.keys(before.labels), ...Object.keys(after.labels)]),
  ]
    .map(Number)
    .sort((a, b) => a - b)) {
    const old = new Map(
      (before.labels[area] ?? []).map((label) => [label.id, label]),
    );
    const current = new Map(
      (after.labels[area] ?? []).map((label) => [label.id, label]),
    );
    for (const id of [...new Set([...old.keys(), ...current.keys()])].sort(
      (a, b) => a - b,
    )) {
      if (!same(old.get(id), current.get(id)))
        add(
          area,
          !old.has(id)
            ? "labels added"
            : !current.has(id)
              ? "labels removed"
              : "labels changed",
          `Label ${String(id)}`,
        );
    }
  }
  return [...groups.values()]
    .sort(
      (a, b) =>
        (a.areaId ?? -1) - (b.areaId ?? -1) ||
        a.category.localeCompare(b.category) ||
        (a.movement?.fromAreaId ?? -1) - (b.movement?.fromAreaId ?? -1),
    )
    .map((fact, index) => ({ id: `f${String(index + 1)}`, ...fact }));
}

export function deterministicNotes(facts: ChangelogFact[]): ChangelogNotes {
  if (facts.length === 0)
    return {
      source: "empty",
      summary: "No changes from the base map.",
      entries: [],
    };
  return {
    source: "deterministic",
    summary: "Changes from the base map, grouped by area.",
    entries: facts.map((fact) => ({
      areaId: fact.areaId,
      areaName: fact.areaName,
      text: fact.movement
        ? `Moved ${String(fact.count)} ${fact.count === 1 ? "room" : "rooms"} from ${fact.movement.fromAreaName} (area ${String(fact.movement.fromAreaId)}) to ${fact.movement.toAreaName} (area ${String(fact.movement.toAreaId)}).`
        : `${String(fact.count)} ${fact.category}.`,
      factIds: [fact.id],
    })),
  };
}
