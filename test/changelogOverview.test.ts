import { expect, test } from "@jest/globals";
import { MudletMapReader } from "mudlet-map-binary-reader";
import { readFileSync } from "node:fs";
import { config } from "../src/config/values.js";
import { buildOverview } from "../src/models/business/changelog.js";
import {
  editorialOverview,
  modelOverview,
} from "../src/services/changelogOverview.js";

function baseline() {
  return MudletMapReader.readBuffer(readFileSync(config.projects[0].mapFile));
}

test("complete special-exit routes are grouped by exact command, not sampled", () => {
  const before = baseline();
  const after = structuredClone(before);
  const ids = Object.keys(before.rooms).map(Number).slice(0, 4);
  const area = before.rooms[ids[0]].area;
  before.rooms[ids[1]].name = "Exact destination";
  after.rooms[ids[1]].name = "Exact destination";
  const command = "a long, game-specific command " + "x".repeat(200);
  for (const id of ids) {
    before.rooms[id].area = area;
    after.rooms[id].area = area;
    before.rooms[id].mSpecialExits[command] = ids[1];
    Reflect.deleteProperty(after.rooms[id].mSpecialExits, command);
  }
  const facts = buildOverview(before, after);
  const removed = facts.find((f) => f.category === "special exits removed");
  expect(removed?.count).toBe(4);
  expect(removed?.examples).toHaveLength(2);
  expect(removed?.details).toHaveLength(4);
  const overview = modelOverview(facts, {
    game: "Example MUD",
    mapName: "Example map",
  });
  expect(overview.game).toBe("Example MUD");
  const change = overview.areas
    .flatMap((a) => a.changes)
    .find((f) => f.category === "special exits removed");
  expect(change?.specialExits).toHaveLength(1);
  expect(change?.specialExits?.[0]).toMatchObject({
    command,
    operation: "removed",
    exitsChanged: 4,
  });
  expect(
    change?.specialExits?.[0].routes.map((r) => r.fromRoom.roomId),
  ).toEqual(ids);
  expect(change?.specialExits?.[0].routes[0].toRoomBefore).toMatchObject({
    roomId: ids[1],
    roomName: "Exact destination",
    areaId: area,
  });
  expect(change?.specialExits?.[0].routes.map((r) => r.toRoomAfter)).toEqual([
    null,
    null,
    null,
    null,
  ]);
  expect(JSON.stringify(overview)).not.toContain("examples");
});

test("metadata distinguishes property totals, distinct rooms and initialization without exposing values", () => {
  const before = baseline();
  const after = structuredClone(before);
  const id = Number(Object.keys(before.rooms)[0]);
  after.rooms[id].userData.first = "SECRET VALUE";
  after.rooms[id].userData.second = "SECRET VALUE";
  const added = 1000000;
  after.rooms[added] = {
    ...structuredClone(before.rooms[id]),
    userData: { a: "PRIVATE VALUE", b: "PRIVATE VALUE", c: "PRIVATE VALUE" },
  };
  const facts = buildOverview(before, after);
  expect(facts.every((f) => f.details.length === f.count)).toBe(true);
  const overview = modelOverview(facts);
  const metadata = overview.areas
    .flatMap((a) => a.changes)
    .find((f) => f.category === "room metadata properties changed")?.metadata;
  expect(overview.totals.metadataOnExistingRooms).toEqual({
    propertiesChanged: 2,
    roomsAffected: 1,
  });
  expect(overview.totals.metadataInitializedOnNewRooms).toEqual({
    propertiesInitialized: 3,
    roomsAffected: 1,
  });
  expect(metadata).toMatchObject({
    propertiesChanged: 5,
    roomsAffected: 2,
    existingRoomsChanged: 1,
    newRoomsInitialized: 1,
  });
  expect(metadata?.perRoom.map((r) => r.propertiesChanged).sort()).toEqual([
    2, 3,
  ]);
  const input = JSON.stringify(overview);
  expect(input).not.toContain("SECRET");
  expect(input).not.toContain("PRIVATE");
});

test("all new rooms and name changes have typed details beyond sample limits", () => {
  const before = baseline();
  const after = structuredClone(before);
  const ids = Object.keys(before.rooms).map(Number).slice(0, 4);
  for (const id of ids) after.rooms[id].name = `Renamed ${String(id)}`;
  for (let id = 1000000; id < 1000004; id++)
    after.rooms[id] = {
      ...structuredClone(before.rooms[ids[0]]),
      name: "New room",
      userData: {},
    };
  const facts = buildOverview(before, after);
  expect(facts.every((f) => f.details.length === f.count)).toBe(true);
  const names = facts
    .filter((f) => f.category === "room name changed")
    .flatMap((f) => f.details);
  expect(names).toHaveLength(4);
  expect(names[3]).toMatchObject({
    kind: "roomProperty",
    property: "name",
    before: before.rooms[ids[3]].name,
    after: `Renamed ${String(ids[3])}`,
  });
  expect(
    facts.filter((f) => f.category === "rooms added").flatMap((f) => f.details),
  ).toHaveLength(4);
});

test("an in exit retains its source and destination without reversing the route", () => {
  const before = baseline();
  const [source, target] = Object.keys(before.rooms).map(Number);
  before.rooms[source].in = target;
  const after = structuredClone(before);
  after.rooms[source].in = -1;
  const overview = modelOverview(buildOverview(before, after));
  const exits = overview.areas
    .flatMap((area) => area.changes)
    .find((change) => change.category === "normal exits removed");
  expect(exits?.details?.[0]).toMatchObject({
    kind: "normalExit",
    operation: "removed",
    directionAtSource: "in",
    fromRoom: { roomId: source, roomName: before.rooms[source].name },
    toRoomBefore: { roomId: target, roomName: before.rooms[target].name },
    toRoomAfter: null,
  });
  expect(overview.totals.normalExitsRemoved).toBe(1);
});

test("editorial facts preserve source directions and rename pairs, hide housekeeping specifics", () => {
  const before = baseline();
  const after = structuredClone(before);
  const id = Number(Object.keys(before.rooms)[0]);
  after.rooms[id].name = "A new name";
  after.rooms[id].userData.private = "DO NOT SEND";
  before.rooms[id].north = id;
  after.rooms[id].north = -1;
  const result = editorialOverview(buildOverview(before, after));
  expect(result.housekeeping).toBe("Housekeeping updates were also applied.");
  expect(result.renames?.[0].rooms).toContainEqual({
    from: before.rooms[id].name,
    to: "A new name",
  });
  expect(result.normal_exits_removed).toContainEqual({
    area: before.areaNames[before.rooms[id].area],
    direction: "north",
    count: 1,
  });
  const serialized = JSON.stringify(result);
  expect(serialized).not.toMatch(
    /roomId|propertiesChanged|existing_rooms_in|DO NOT SEND/u,
  );
  expect(editorialOverview([])).toEqual({ no_changes: true });
  expect(
    editorialOverview([
      {
        id: "only",
        areaId: 1,
        areaName: "Secret housekeeping area",
        category: "map metadata properties changed",
        count: 1,
        examples: [],
        details: [{ kind: "mapMetadata" }],
      },
    ]),
  ).toEqual({ housekeeping: "Housekeeping updates were also applied." });
});

test("editorial grouping retains every special exit, move and addition count", () => {
  const room = {
    roomId: 1,
    roomName: "Endpoint must be omitted",
    newlyAdded: false,
  };
  const base = { id: "fixture", areaId: 1, areaName: "Garden", examples: [] };
  const output = editorialOverview([
    { ...base, category: "rooms added", count: 147, details: [] },
    { ...base, category: "normal exits added", count: 296, details: [] },
    {
      ...base,
      category: "rooms moved",
      count: 4,
      movement: {
        fromAreaId: 1,
        fromAreaName: "Garden",
        toAreaId: 2,
        toAreaName: "High Tower",
      },
      details: [],
    },
    {
      ...base,
      category: "special exits removed",
      count: 3,
      details: [1, 2, 3].map((roomId) => ({
        kind: "specialExit" as const,
        room: { ...room, roomId },
        operation: "removed" as const,
        command: "worm warp",
        destinationBefore: null,
        destinationAfter: null,
      })),
    },
    {
      ...base,
      areaId: 2,
      areaName: "High Tower",
      category: "special exits added",
      count: 1,
      details: [
        {
          kind: "specialExit",
          room,
          operation: "added",
          command: "worm warp",
          destinationBefore: null,
          destinationAfter: null,
        },
      ],
    },
  ]);
  expect(output.additions).toEqual([
    { area: "Garden", rooms: 147, normal_exits: 296 },
  ]);
  expect(output.room_moves).toEqual([
    { from_area: "Garden", to_area: "High Tower", rooms: 4 },
  ]);
  expect(output.special_exits).toEqual([
    {
      command: "worm warp",
      operation: "removed",
      areas: [{ area: "Garden", count: 3 }],
    },
    {
      command: "worm warp",
      operation: "added",
      areas: [{ area: "High Tower", count: 1 }],
    },
  ]);
  expect(output.housekeeping).toBeUndefined();
  expect(JSON.stringify(output)).not.toContain("Endpoint must be omitted");
});
