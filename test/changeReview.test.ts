import { describe, expect, test } from "@jest/globals";
import {
  ChangeRoomName,
  DeleteArea,
  DeleteRoom,
  LockSpecialExit,
  ModifyRoomExit,
  RenameArea,
  SetRoomHash,
  SetRoomSymbol,
  SetRoomWeight,
} from "../src/models/business/change.js";
import { reconcileChange } from "../src/models/business/changeReview.js";

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

const mapWithoutRoom = (): Mudlet.MudletMap => {
  const map = mapWithRoom("Same");
  map.rooms = {};
  return map;
};

const mapWithArea = (name: string): Mudlet.MudletMap => {
  const map = mapWithRoom("Same");
  map.areas[7] = { rooms: [] } as unknown as MudletArea;
  map.areaNames[7] = name;
  return map;
};

const mapWithoutArea = (): Mudlet.MudletMap => mapWithRoom("Same");

const mapWithRoomWeight = (weight: number): Mudlet.MudletMap => {
  const map = mapWithRoom("Same");
  map.rooms[10].weight = weight;
  return map;
};

const mapWithRoomSymbol = (symbol: string): Mudlet.MudletMap => {
  const map = mapWithRoom("Same");
  map.rooms[10].symbol = symbol;
  return map;
};

const mapWithRoomHash = (hash: string): Mudlet.MudletMap => {
  const map = mapWithRoom("Same");
  map.mpRoomDbHashToRoomId[hash] = 10;
  return map;
};

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

  test("flags a deleted room even when the reported exit was already absent", () => {
    const exitChange = new ModifyRoomExit(
      10,
      ["reporter"],
      "north",
      12,
      "exit-change",
    );
    const mapWithoutRoom = mapWithRoom("Same");
    mapWithoutRoom.rooms = {};

    expect(
      reconcileChange(exitChange, mapWithRoom("Same"), mapWithoutRoom).status,
    ).toBe("upstream-conflict");
  });

  test("flags a deleted room for a special-exit lock report", () => {
    const lockChange = new LockSpecialExit(
      10,
      ["reporter"],
      "enter portal",
      12,
      "lock-change",
    );
    const mapWithoutRoom = mapWithRoom("Same");
    mapWithoutRoom.rooms = {};

    expect(
      reconcileChange(lockChange, mapWithRoom("Same"), mapWithoutRoom).status,
    ).toBe("upstream-conflict");
  });

  describe.each([
    {
      change: new DeleteRoom(10, ["reporter"], "delete-room-change"),
      conflictNewMap: mapWithRoom("Same"),
      conflictOldMap: mapWithoutRoom(),
      name: "delete-room",
      oldMap: mapWithRoom("Same"),
      resolvedMap: mapWithoutRoom(),
    },
    {
      change: new RenameArea(
        7,
        "Reported area",
        ["reporter"],
        "rename-area-change",
      ),
      conflictNewMap: mapWithArea("Different upstream area"),
      conflictOldMap: mapWithArea("Old area"),
      name: "rename-area",
      oldMap: mapWithArea("Old area"),
      resolvedMap: mapWithArea("Reported area"),
    },
    {
      change: new DeleteArea(7, ["reporter"], "delete-area-change"),
      conflictNewMap: mapWithArea("Upstream area"),
      conflictOldMap: mapWithoutArea(),
      name: "delete-area",
      oldMap: mapWithArea("Old area"),
      resolvedMap: mapWithoutArea(),
    },
    {
      change: new SetRoomWeight(
        10,
        ["reporter"],
        2,
        "set-room-weight-change",
      ),
      conflictNewMap: mapWithRoomWeight(3),
      conflictOldMap: mapWithRoomWeight(1),
      name: "set-room-weight",
      oldMap: mapWithRoomWeight(1),
      resolvedMap: mapWithRoomWeight(2),
    },
    {
      change: new SetRoomSymbol(
        10,
        ["reporter"],
        "R",
        "set-room-symbol-change",
      ),
      conflictNewMap: mapWithRoomSymbol("U"),
      conflictOldMap: mapWithRoomSymbol("O"),
      name: "set-room-symbol",
      oldMap: mapWithRoomSymbol("O"),
      resolvedMap: mapWithRoomSymbol("R"),
    },
    {
      change: new SetRoomHash(
        10,
        ["reporter"],
        "reported-hash",
        "set-room-hash-change",
      ),
      conflictNewMap: mapWithRoomHash("different-upstream-hash"),
      conflictOldMap: mapWithRoomHash("old-hash"),
      name: "set-room-hash",
      oldMap: mapWithRoomHash("old-hash"),
      resolvedMap: mapWithRoomHash("reported-hash"),
    },
  ])("$name reconciliation", ({
    change,
    conflictNewMap,
    conflictOldMap,
    oldMap,
    resolvedMap,
  }) => {
    test("recognizes the desired upstream state as resolved", () => {
      expect(reconcileChange(change, oldMap, resolvedMap)).toEqual({
        changeId: change.changeId,
        status: "resolved",
      });
    });

    test("flags a different upstream state as a conflict", () => {
      expect(
        reconcileChange(change, conflictOldMap, conflictNewMap).status,
      ).toBe("upstream-conflict");
    });
  });

  test("replaces a room's previous hash when applying a hash change", () => {
    const map = mapWithRoom("Same");
    map.mpRoomDbHashToRoomId["old-hash"] = 10;

    new SetRoomHash(10, ["reporter"], "new-hash").apply(map);

    expect(map.mpRoomDbHashToRoomId).toEqual({ "new-hash": 10 });
  });

  test("does not assign a hash to a missing room", () => {
    const map = mapWithoutRoom();

    new SetRoomHash(10, ["reporter"], "new-hash").apply(map);

    expect(map.mpRoomDbHashToRoomId).toEqual({});
  });
});
