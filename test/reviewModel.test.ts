import { describe, expect, test } from "@jest/globals";
import {
  canApply,
  changeSummary,
  filterChanges,
  groupChanges,
  isRelated,
  relationBetween,
  relationshipDetails,
  ReviewChange,
  targetKey,
  typeLabel,
} from "../website/javascripts/review-model";

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
});
