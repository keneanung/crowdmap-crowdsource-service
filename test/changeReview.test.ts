import { describe, expect, test } from "@jest/globals";
import { ChangeRoomName, ModifyRoomExit } from "../src/models/business/change";
import { reconcileChange } from "../src/models/business/changeReview";

const mapWithRoom = (name: string, north = -1): Mudlet.MudletMap =>
  ({
    areaNames: {},
    areas: {},
    mCustomEnvColors: {},
    mRoomIdHash: {},
    mUserData: {},
    mapFontFudgeFactor: 0,
    mapSymbolFont: {},
    mpRoomDbHashToRoomId: {},
    rooms: {
      10: {
        exitWeights: {},
        mSpecialExitLocks: [],
        mSpecialExits: {},
        name,
        north,
        userData: {},
      },
    },
  }) as unknown as Mudlet.MudletMap;

describe("baseline change reconciliation", () => {
  const nameChange = new ChangeRoomName(
    10,
    ["reporter"],
    "Reported name",
    "name-change",
  );

  test("marks a report resolved when the new upstream map satisfies it", () => {
    expect(
      reconcileChange(
        nameChange,
        mapWithRoom("Old name"),
        mapWithRoom("Reported name"),
      ),
    ).toEqual({ changeId: "name-change", status: "resolved" });
  });

  test("flags a conflict when upstream changed the same target differently", () => {
    const result = reconcileChange(
      nameChange,
      mapWithRoom("Old name"),
      mapWithRoom("Different upstream name"),
    );

    expect(result.status).toBe("upstream-conflict");
    expect(result.reason).toContain("Different upstream name");
    expect(result.reason).toContain("Reported name");
  });

  test("leaves an unapplied report pending when upstream did not touch its target", () => {
    expect(
      reconcileChange(
        nameChange,
        mapWithRoom("Old name"),
        mapWithRoom("Old name"),
      ),
    ).toEqual({ changeId: "name-change", status: "pending" });
  });

  test("compares exit destinations independently from other room fields", () => {
    const exitChange = new ModifyRoomExit(
      10,
      ["reporter"],
      "north",
      12,
      "exit-change",
    );
    expect(
      reconcileChange(
        exitChange,
        mapWithRoom("Same", 11),
        mapWithRoom("Same", 12),
      ),
    ).toEqual({ changeId: "exit-change", status: "resolved" });
  });
});
