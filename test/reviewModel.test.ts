import { describe, expect, test } from "@jest/globals";
import {
  canApply,
  changeSummary,
  changeTime,
  filterChanges,
  groupChanges,
  groupChangesByLocation,
  isRelated,
  relationBetween,
  relationshipDetails,
  ReviewChange,
  ReviewLocationContext,
  targetKey,
  typeLabel,
  unselectedChangeIds,
} from "../website/javascripts/review-model.js";

const changes: ReviewChange[] = [
  {
    changeId: "name-one",
    type: "room-name",
    reporters: 2,
    roomNumber: 10,
    name: "First name",
  },
  {
    changeId: "name-two",
    type: "room-name",
    reporters: 1,
    roomNumber: 10,
    name: "Competing name",
  },
  {
    changeId: "coordinates",
    type: "set-room-coordinates",
    reporters: 1,
    roomNumber: 10,
    x: 3,
    y: 4,
    z: 0,
  },
  {
    changeId: "exit-change",
    type: "modify-exit",
    reporters: 1,
    roomNumber: 10,
    direction: "north",
    destination: 11,
  },
  {
    changeId: "exit-delete",
    type: "delete-exit",
    reporters: 1,
    roomNumber: 10,
    direction: "north",
  },
];

describe("change review model", () => {
  test("groups competing operations by their semantic map target", () => {
    expect(targetKey(changes[0])).toBe("room:10:name");
    expect(targetKey(changes[2])).toBe("room:10:coordinates");
    expect(targetKey(changes[3])).toBe("room:10:exit:north:destination");
    expect(targetKey(changes[4])).toBe("room:10:exit:north:destination");
  });

  test("marks only changes sharing a review target as related", () => {
    const groups = groupChanges(changes);

    expect(isRelated(changes[0], groups)).toBe(true);
    expect(isRelated(changes[1], groups)).toBe(true);
    expect(isRelated(changes[2], groups)).toBe(false);
    expect(isRelated(changes[3], groups)).toBe(true);
    expect(relationshipDetails(changes[0], groups)).toEqual([
      expect.objectContaining({
        change: changes[1],
        reason: expect.stringContaining("incompatible"),
      }),
    ]);
  });

  test("explains structural relationships beyond an identical target", () => {
    const deleteRoom: ReviewChange = {
      changeId: "delete-room",
      type: "delete-room",
      reporters: 1,
      roomNumber: 11,
    };

    expect(relationBetween(deleteRoom, changes[3])).toContain(
      "exit leads to room 11",
    );
    expect(relationBetween(changes[2], changes[3])).toBeNull();
  });

  test("filters related, selected, and searched changes", () => {
    const groups = groupChanges(changes);
    const selected = new Set(["coordinates"]);

    expect(
      filterChanges(changes, groups, "conflicts", "", selected),
    ).toHaveLength(4);
    expect(filterChanges(changes, groups, "selected", "", selected)).toEqual([
      changes[2],
    ]);
    expect(
      filterChanges(changes, groups, "all", "competing", selected),
    ).toEqual([changes[1]]);
    expect(
      filterChanges(changes, groups, "all", "exit-delete", selected),
    ).toEqual([changes[4]]);

    const upstreamConflict = {
      ...changes[2],
      changeId: "coordinates-conflict",
      upstreamConflict: { baselineVersion: "467", reason: "Upstream moved it" },
    };
    expect(
      filterChanges(
        [changes[2], upstreamConflict],
        groupChanges([changes[2], upstreamConflict]),
        "upstream",
        "",
        selected,
      ),
    ).toEqual([upstreamConflict]);
  });

  test("builds readable labels and summaries without review metadata", () => {
    expect(typeLabel("modify-special-exit")).toBe("Modify Special Exit");
    expect(changeSummary(changes[2])).toBe("Room 10 · x: 3 · y: 4 · z: 0");
    expect(
      changeSummary({
        ...changes[2],
        upstreamResolved: true,
        upstreamConflict: {
          baselineVersion: "467",
          reason: "Upstream moved it",
        },
      }),
    ).toBe("Room 10 · x: 3 · y: 4 · z: 0");
  });

  test("allows versioned baseline-only updates without marking a change", () => {
    expect(canApply("466", "map-admin-key")).toBe(true);
    expect(canApply("466", "  ")).toBe(false);
    expect(canApply("", "map-admin-key")).toBe(false);
  });

  test("treats every pending report as obsolete when none are selected", () => {
    expect(unselectedChangeIds(changes, new Set())).toEqual(
      changes.map((change) => change.changeId),
    );
    expect(unselectedChangeIds(changes, new Set(["coordinates"]))).toEqual(
      changes
        .filter((change) => change.changeId !== "coordinates")
        .map((change) => change.changeId),
    );
  });
});

test("map-wide summaries identify the map and preserve proposed values", () => {
  expect(
    changeSummary({
      changeId: "data",
      type: "set-map-user-data",
      key: "source",
      value: "survey",
    }),
  ).toBe("Map · key: source · value: survey");
  expect(
    changeSummary({
      changeId: "area",
      type: "rename-area",
      areaId: 7,
      name: "Garden",
    }),
  ).toBe("Area 7 · name: Garden");
});

describe("review queue location hierarchy", () => {
  const context: ReviewLocationContext = {
    loaded: true,
    rooms: new Map([
      [10, { areaId: 2, name: "Gate" }],
      [11, { areaId: 2, name: "Path" }],
      [20, { areaId: 7, name: "Former room", absent: true }],
    ]),
    areas: new Map([
      [2, { name: "Garden" }],
      [7, { name: "Former area", absent: true }],
    ]),
  };
  const report = (id: string, fields: Partial<ReviewChange>): ReviewChange => ({
    changeId: id,
    type: "room-name",
    ...fields,
  });

  test("groups by numeric area and room, then UUIDv7 creation time", () => {
    const older = report("01990000-0000-7000-8000-000000000001", {
      roomNumber: 10,
    });
    const newer = report("01990000-0001-7000-8000-000000000001", {
      roomNumber: 10,
    });
    const otherRoom = report("other", { roomNumber: 11 });
    const areaEdit = report("area", { type: "rename-area", areaId: 2 });
    const mapEdit = report("map", { type: "set-map-user-data" });
    const grouped = groupChangesByLocation(
      [newer, otherRoom, mapEdit, areaEdit, older],
      context,
    );
    expect(grouped.map((group) => group.key)).toEqual(["area:2", "map"]);
    expect(grouped[0].label).toBe("Area 2 · Garden");
    expect(grouped[0].rooms.map((room) => room.roomId)).toEqual([
      undefined,
      10,
      11,
    ]);
    expect(grouped[0].rooms[1].label).toBe("Room 10 · Gate");
    expect(grouped[0].rooms[1].changes).toEqual([older, newer]);
    expect(changeTime(older)?.getTime()).toBe(parseInt("019900000000", 16));
    expect(changeTime(otherRoom)).toBeNull();
  });

  test("retains deleted target identity and former area, with explicit absence labels", () => {
    const grouped = groupChangesByLocation(
      [
        report("deleted", { roomNumber: 20 }),
        report("missing-area", { type: "delete-area", areaId: 9 }),
        report("missing-room", { roomNumber: 30 }),
      ],
      context,
    );
    expect(grouped[0].label).toBe(
      "Area 7 · Former area · absent from baseline",
    );
    expect(grouped[0].rooms[0].label).toBe(
      "Room 20 · Former room · absent from baseline",
    );
    expect(grouped[1].label).toBe("Area 9 · absent from baseline");
    expect(grouped[2].label).toBe("Rooms with unknown area");
    expect(grouped[2].rooms[0].label).toBe("Room 30 · absent from baseline");
  });

  test("keeps moves with the baseline room and uses unambiguous proposed areas for absent rooms", () => {
    const move = report("move", {
      type: "set-room-area",
      roomNumber: 10,
      areaId: 7,
    });
    const assignment = report("assignment", {
      type: "set-room-area",
      roomNumber: 30,
      areaId: 2,
    });
    const name = report("name", { roomNumber: 30 });
    const all = [move, assignment, name];
    expect(
      groupChangesByLocation(all, context)[0].rooms.map((room) => room.roomId),
    ).toEqual([10, 30]);
    // A filtered-out area assignment must still place the room consistently.
    expect(groupChangesByLocation([name], context, all)[0].areaId).toBe(2);
    const conflicting = report("conflicting", {
      type: "set-room-area",
      roomNumber: 30,
      areaId: 7,
    });
    expect(
      groupChangesByLocation([name], context, [...all, conflicting])[0].key,
    ).toBe("unknown");
  });

  test("keeps unknown targets usable before map context is available", () => {
    expect(
      groupChangesByLocation([report("room", { roomNumber: 1 })])[0].rooms[0]
        .label,
    ).toBe("Room 1");
  });
});
