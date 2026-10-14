import { isDeepStrictEqual } from "node:util";
import { mudletExitKey } from "./change.js";

export interface ChangelogRoom {
  roomId: number;
  roomName: string;
  newlyAdded: boolean;
}

export interface ChangelogDestination {
  roomId: number;
  roomName: string | null;
  areaId: number | null;
  areaName: string | null;
}

type ExitOperation = "added" | "removed" | "changed";
export type ChangelogDetail =
  | { kind: "room"; operation: "added" | "removed"; room: ChangelogRoom }
  | {
      kind: "roomProperty";
      room: ChangelogRoom;
      property: string;
      before: string | number;
      after: string | number;
    }
  | { kind: "roomMove"; room: ChangelogRoom }
  | {
      kind: "normalExit";
      room: ChangelogRoom;
      operation: ExitOperation;
      direction: string;
      destinationBefore: ChangelogDestination | null;
      destinationAfter: ChangelogDestination | null;
    }
  | {
      kind: "specialExit";
      room: ChangelogRoom;
      operation: ExitOperation;
      command: string;
      destinationBefore: ChangelogDestination | null;
      destinationAfter: ChangelogDestination | null;
    }
  | {
      kind: "exitProperty";
      room: ChangelogRoom;
      exitKey: string;
      property: string;
      before?: number | null;
      after?: number | null;
    }
  | {
      kind: "specialExitLock";
      room: ChangelogRoom;
      command: string;
      locked: boolean;
    }
  | { kind: "roomMetadata"; room: ChangelogRoom }
  | { kind: "mapMetadata" | "hashMapping" }
  | {
      kind: "area";
      operation: ExitOperation;
      areaId: number;
      nameBefore: string | null;
      nameAfter: string | null;
    }
  | { kind: "label"; operation: ExitOperation; labelId: number };

export interface ChangelogFact {
  id: string;
  areaId: number | null;
  areaName: string;
  category: string;
  count: number;
  examples: string[];
  details: ChangelogDetail[];
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

export interface ChangelogNotes {
  source: "ai" | "deterministic" | "empty";
  text: string;
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
const clean = (value: unknown, limit = 160): string =>
  String(value)
    .split("")
    .map((char) =>
      char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127 ? " " : char,
    )
    .join("")
    .slice(0, limit);

/** Compare final map state, including side effects, rather than report payloads. */
export function buildOverview(
  before: Mudlet.MudletMap,
  after: Mudlet.MudletMap,
): ChangelogFact[] {
  const destination = (
    map: Mudlet.MudletMap,
    id: number | undefined,
  ): ChangelogDestination | null => {
    if (id === undefined || id === -1) return null;
    const room = Object.hasOwn(map.rooms, id) ? map.rooms[id] : undefined;
    return {
      roomId: id,
      roomName: room ? clean(room.name) : null,
      areaId: room?.area ?? null,
      areaName: room
        ? clean(areaName(map, room.area) ?? `Area ${String(room.area)}`)
        : null,
    };
  };
  const groups = new Map<string, Omit<ChangelogFact, "id">>();
  const add = (
    areaId: number | null,
    category: string,
    example: string,
    movement: ChangelogFact["movement"],
    detail: ChangelogDetail,
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
        details: [],
        ...(movement ? { movement } : {}),
      };
      groups.set(key, group);
    }
    group.count++;
    group.details.push(detail);
    if (group.examples.length < 2) group.examples.push(clean(example));
    return group;
  };
  for (const id of [
    ...new Set([...Object.keys(before.areas), ...Object.keys(after.areas)]),
  ]
    .map(Number)
    .sort((a, b) => a - b)) {
    if (!Object.hasOwn(before.areas, id))
      add(id, "areas added", `Area ${String(id)}`, undefined, {
        kind: "area",
        operation: "added",
        areaId: id,
        nameBefore: null,
        nameAfter: clean(after.areaNames[id] ?? ""),
      });
    else if (!Object.hasOwn(after.areas, id))
      add(id, "areas deleted", `Area ${String(id)}`, undefined, {
        kind: "area",
        operation: "removed",
        areaId: id,
        nameBefore: clean(before.areaNames[id] ?? ""),
        nameAfter: null,
      });
    else if (before.areaNames[id] !== after.areaNames[id])
      add(
        id,
        "area names changed",
        `${clean(before.areaNames[id])} -> ${clean(after.areaNames[id])}`,
        undefined,
        {
          kind: "area",
          operation: "changed",
          areaId: id,
          nameBefore: clean(before.areaNames[id] ?? ""),
          nameAfter: clean(after.areaNames[id] ?? ""),
        },
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
    const room: ChangelogRoom = {
      roomId: id,
      roomName: clean(current?.name ?? old?.name ?? ""),
      newlyAdded: !old && !!current,
    };
    const label = `Room ${String(id)} (${clean(current?.name ?? old?.name ?? "unknown")})`;
    if (!old && current) {
      const added = add(area, "rooms added", label, undefined, {
        kind: "room",
        operation: "added",
        room,
      });
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
      add(area, "rooms deleted", label, undefined, {
        kind: "room",
        operation: "removed",
        room,
      });
      continue;
    }
    for (const property of properties) {
      if (same(old[property], current[property])) continue;
      if (property === "area") {
        add(
          area,
          "rooms moved",
          label,
          {
            fromAreaId: old.area,
            fromAreaName: clean(
              areaName(before, old.area) ?? `Area ${String(old.area)}`,
            ),
            toAreaId: current.area,
            toAreaName: clean(
              areaName(after, current.area) ?? `Area ${String(current.area)}`,
            ),
          },
          { kind: "roomMove", room },
        );
      } else {
        add(
          area,
          `room ${property} changed`,
          `${label}: ${clean(old[property])} -> ${clean(current[property])}`,
          undefined,
          {
            kind: "roomProperty",
            room,
            property,
            before:
              typeof old[property] === "string"
                ? clean(old[property])
                : old[property],
            after:
              typeof current[property] === "string"
                ? clean(current[property])
                : current[property],
          },
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
          undefined,
          {
            kind: "normalExit",
            room,
            operation:
              current[direction] === -1
                ? "removed"
                : old[direction] === -1
                  ? "added"
                  : "changed",
            direction,
            destinationBefore: destination(before, old[direction]),
            destinationAfter: destination(after, current[direction]),
          },
        );
      }
    }
    const removedExitKeys = new Set<string>([
      ...directions
        .filter(
          (direction) => old[direction] !== -1 && current[direction] === -1,
        )
        .map(mudletExitKey),
      ...Object.keys(old.mSpecialExits).filter(
        (command) => !Object.hasOwn(current.mSpecialExits, command),
      ),
    ]);
    // Removed exit metadata is part of the removal, not a separate edit.
    // Preserve differences on any route that still shares the metadata key.
    const cleanupOnly = (key: string): boolean =>
      removedExitKeys.has(key) &&
      !Object.hasOwn(current.mSpecialExits, key) &&
      !directions.some(
        (direction) =>
          (mudletExitKey(direction) === key || direction === key) &&
          current[direction] !== -1,
      );
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
        if (
          property !== "mSpecialExits" &&
          property !== "userData" &&
          !Object.hasOwn(current[property], key) &&
          cleanupOnly(key)
        )
          continue;
        if (isDeepStrictEqual(old[property][key], current[property][key]))
          continue;
        if (property === "userData")
          add(area, "room metadata properties changed", label, undefined, {
            kind: "roomMetadata",
            room,
          });
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
            undefined,
            property === "mSpecialExits"
              ? {
                  kind: "specialExit",
                  room,
                  operation: !Object.hasOwn(current[property], key)
                    ? "removed"
                    : !Object.hasOwn(old[property], key)
                      ? "added"
                      : "changed",
                  command: clean(key, Infinity),
                  destinationBefore: destination(before, old[property][key]),
                  destinationAfter: destination(after, current[property][key]),
                }
              : {
                  kind: "exitProperty",
                  room,
                  exitKey: clean(key, Infinity),
                  property,
                  before: old[property][key] ?? null,
                  after: current[property][key] ?? null,
                },
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
        if (!Object.hasOwn(current[property], key) && cleanupOnly(key))
          continue;
        if (!same(old[property][key], current[property][key]))
          add(
            area,
            "exit drawing properties changed",
            `${label}: ${clean(key)} (${property})`,
            undefined,
            {
              kind: "exitProperty",
              room,
              exitKey: clean(key, Infinity),
              property,
            },
          );
      }
    }
    for (const command of [
      ...new Set([...old.mSpecialExitLocks, ...current.mSpecialExitLocks]),
    ].sort()) {
      if (
        Object.hasOwn(old.mSpecialExits, command) &&
        !Object.hasOwn(current.mSpecialExits, command) &&
        !current.mSpecialExitLocks.includes(command)
      )
        continue;
      if (
        old.mSpecialExitLocks.includes(command) !==
        current.mSpecialExitLocks.includes(command)
      )
        add(
          area,
          "special exit locks changed",
          `${label}: ${clean(command)} ${current.mSpecialExitLocks.includes(command) ? "locked" : "unlocked"}`,
          undefined,
          {
            kind: "specialExitLock",
            room,
            command: clean(command, Infinity),
            locked: current.mSpecialExitLocks.includes(command),
          },
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
      add(
        null,
        "map metadata properties changed",
        "Metadata property changed",
        undefined,
        { kind: "mapMetadata" },
      );
  }
  for (const hash of [
    ...new Set([
      ...Object.keys(before.mpRoomDbHashToRoomId),
      ...Object.keys(after.mpRoomDbHashToRoomId),
    ]),
  ].sort()) {
    if (before.mpRoomDbHashToRoomId[hash] !== after.mpRoomDbHashToRoomId[hash])
      add(
        null,
        "room hash mappings changed",
        "Room hash mapping changed",
        undefined,
        { kind: "hashMapping" },
      );
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
          undefined,
          {
            kind: "label",
            operation: !old.has(id)
              ? "added"
              : !current.has(id)
                ? "removed"
                : "changed",
            labelId: id,
          },
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
    return { source: "empty", text: "No changes from the base map." };
  const groups = new Map<number | null, { name: string; lines: string[] }>();
  for (const fact of facts) {
    const group = groups.get(fact.areaId) ?? { name: fact.areaName, lines: [] };
    const lines = group.lines;
    lines.push(
      fact.movement
        ? `Moved ${String(fact.count)} ${fact.count === 1 ? "room" : "rooms"} from ${fact.movement.fromAreaName} (area ${String(fact.movement.fromAreaId)}) to ${fact.movement.toAreaName} (area ${String(fact.movement.toAreaId)}).`
        : `${String(fact.count)} ${fact.category}.`,
    );
    groups.set(fact.areaId, group);
  }
  const headingCounts = new Map<string, number>();
  for (const { name } of groups.values())
    headingCounts.set(name, (headingCounts.get(name) ?? 0) + 1);
  return {
    source: "deterministic",
    text: [...groups]
      .map(([id, { name, lines }]) => {
        const heading =
          (headingCounts.get(name) ?? 0) > 1
            ? `${name} (${id === null ? "map-wide" : `area ${String(id)}`})`
            : name;
        return `${heading}: ${lines.join(" ")}`;
      })
      .join("\n\n"),
  };
}
