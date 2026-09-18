import { expect, test } from "@jest/globals";
import { MudletMapReader } from "mudlet-map-binary-reader";
import { readFileSync } from "node:fs";
import {
  DeleteMapLabel,
  ModifyExitWeight,
  RenameArea,
  SetExitDoor,
  SetMapLabel,
  SetMapUserData,
  SetRoomArea,
  SetRoomHash,
} from "../src/models/business/change.js";

const loadMap = () =>
  MudletMapReader.readBuffer(readFileSync("test/setup/baselineFiles/map"));

test("zero ordinary exit weights are removed", () => {
  const map = loadMap();
  const room = map.rooms[39478];
  room.exitWeights.east = 4;
  new ModifyExitWeight(39478, [], "east", 0).apply(map);
  expect(room.exitWeights).not.toHaveProperty("east");
});

test("renaming an unknown area lazily creates it for a following room move", () => {
  const map = loadMap();
  new RenameArea(529, "Temporary area", []).apply(map);
  new SetRoomArea(39478, [], 529).apply(map);
  expect(map.areaNames[529]).toBe("Temporary area");
  expect(map.rooms[39478].area).toBe(529);
  expect(map.areas[529].rooms).toContain(39478);
});

test("room hashes survive a binary round trip", () => {
  const map = loadMap();
  new SetRoomHash(39478, [], "go-live-hash").apply(map);
  const reloaded = MudletMapReader.readBuffer(MudletMapReader.writeBuffer(map));
  expect(reloaded.mpRoomDbHashToRoomId["go-live-hash"]).toBe(39478);
});

test("door state, map user data, and labels survive a binary round trip", () => {
  const map = loadMap();
  new SetExitDoor(39478, [], "east", 3).apply(map);
  new SetMapUserData("mapFeatures", "feature-data", []).apply(map);
  const areaId = map.rooms[39478].area;
  const label = {
    text: "go-live label",
    x: 1,
    y: 2,
    z: 3,
    width: 4,
    height: 5,
    fgColor: { alpha: 255, r: 1, g: 2, b: 3 },
    bgColor: { alpha: 128, r: 4, g: 5, b: 6 },
    noScaling: false,
    showOnTop: true,
  };
  new SetMapLabel(areaId, 987, label, []).apply(map);
  const reloaded = MudletMapReader.readBuffer(MudletMapReader.writeBuffer(map));
  expect(reloaded.rooms[39478].doors.east).toBe(3);
  expect(reloaded.mUserData.mapFeatures).toBe("feature-data");
  expect(reloaded.labels[areaId]).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ id: 987, text: "go-live label" }),
    ]),
  );
  new DeleteMapLabel(areaId, 987, []).apply(reloaded);
  expect(reloaded.labels[areaId] ?? []).not.toEqual(
    expect.arrayContaining([expect.objectContaining({ id: 987 })]),
  );
});
