/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { beforeEach, expect, test } from "@jest/globals";
import request from "supertest";
import { app } from "../src/app.js";
import {
  DeleteRoom,
  DeleteSpecialExit,
} from "../src/models/business/change.js";
import { setupChangeServiceMock } from "./setup/iocSetup.js";

beforeEach(() => {
  setupChangeServiceMock();
});

test("removes metadata associated with a deleted special exit", () => {
  const map = {
    rooms: {
      1: {
        mSpecialExits: { "worm warp": 1337 },
        exitWeights: { "worm warp": 10 },
        doors: { "worm warp": 3 },
        customLines: { "worm warp": [] },
        customLinesArrow: { "worm warp": true },
        customLinesColor: { "worm warp": {} },
        customLinesStyle: { "worm warp": 1 },
        mSpecialExitLocks: ["worm warp"],
      },
    },
  } as unknown as Mudlet.MudletMap;

  new DeleteSpecialExit(1, ["Test Reporter"], "worm warp").apply(map);

  expect(map.rooms[1]).toStrictEqual({
    mSpecialExits: {},
    exitWeights: {},
    doors: {},
    customLines: {},
    customLinesArrow: {},
    customLinesColor: {},
    customLinesStyle: {},
    mSpecialExitLocks: [],
  });
});

test("does not remove normal-exit metadata when commands collide", () => {
  const room = {
    north: 2,
    mSpecialExits: { north: 1337 },
    exitWeights: { north: 10 },
    doors: { north: 3 },
    customLines: { north: [] },
    customLinesArrow: { north: true },
    customLinesColor: { north: {} },
    customLinesStyle: { north: 1 },
    mSpecialExitLocks: ["north"],
  };
  const map = { rooms: { 1: room } } as unknown as Mudlet.MudletMap;

  new DeleteSpecialExit(1, ["Test Reporter"], "north").apply(map);

  expect(room).toStrictEqual({
    north: 2,
    mSpecialExits: {},
    exitWeights: { north: 10 },
    doors: { north: 3 },
    customLines: { north: [] },
    customLinesArrow: { north: true },
    customLinesColor: { north: {} },
    customLinesStyle: { north: 1 },
    mSpecialExitLocks: [],
  });
});

test("does not remove metadata when the special exit does not exist", () => {
  const room = {
    north: 2,
    mSpecialExits: {},
    exitWeights: { north: 10 },
    doors: { north: 3 },
    customLines: { north: [] },
    customLinesArrow: { north: true },
    customLinesColor: { north: {} },
    customLinesStyle: { north: 1 },
    mSpecialExitLocks: ["north"],
  };
  const map = { rooms: { 1: room } } as unknown as Mudlet.MudletMap;

  new DeleteSpecialExit(1, ["Test Reporter"], "north").apply(map);

  expect(room).toStrictEqual({
    north: 2,
    mSpecialExits: {},
    exitWeights: { north: 10 },
    doors: { north: 3 },
    customLines: { north: [] },
    customLinesArrow: { north: true },
    customLinesColor: { north: {} },
    customLinesStyle: { north: 1 },
    mSpecialExitLocks: ["north"],
  });
});

test("removes incoming special-exit metadata when deleting a room", () => {
  const sourceRoom = {
    x: 0,
    y: 0,
    z: 0,
    mSpecialExits: { "worm warp": 2 },
    exitWeights: { "worm warp": 10 },
    doors: { "worm warp": 3 },
    customLines: { "worm warp": [] },
    customLinesArrow: { "worm warp": true },
    customLinesColor: { "worm warp": {} },
    customLinesStyle: { "worm warp": 1 },
    mSpecialExitLocks: ["worm warp"],
  };
  const destinationRoom = {
    area: 1,
    mSpecialExits: {},
  };
  const map = {
    rooms: { 1: sourceRoom, 2: destinationRoom },
    areas: {
      1: {
        rooms: [1, 2],
        max_x: 0,
        max_y: 0,
        max_z: 0,
        min_x: 0,
        min_y: 0,
        min_z: 0,
        span: [0, 0, 0],
        xmaxForZ: {},
        ymaxForZ: {},
        xminForZ: {},
        yminForZ: {},
        zLevels: [],
      },
    },
    mpRoomDbHashToRoomId: {},
  } as unknown as Mudlet.MudletMap;

  new DeleteRoom(2, ["Test Reporter"]).apply(map);

  expect(sourceRoom).toStrictEqual({
    x: 0,
    y: 0,
    z: 0,
    mSpecialExits: {},
    exitWeights: {},
    doors: {},
    customLines: {},
    customLinesArrow: {},
    customLinesColor: {},
    customLinesStyle: {},
    mSpecialExitLocks: [],
  });
  expect(map.rooms).not.toHaveProperty("2");
});

test("Should accept and return special exit deletion", async () => {
  await request(app)
    .post("/change")
    .send({
      type: "delete-special-exit",
      roomNumber: 1,
      exitCommand: "worm warp",
      reporter: "Test Reporter",
    })
    .expect(201);

  await request(app)
    .get("/change")
    .expect(200)
    .expect((res) => {
      expect(res.body).toStrictEqual([
        {
          type: "delete-special-exit",
          roomNumber: 1,
          exitCommand: "worm warp",
          reporters: 1,
          changeId: "018bcfe5-6800-7777-8d30-5e6a25dbfac1",
        },
      ]);
    });
});

test("Should incorporate special exit deletions into the map", async () => {
  await request(app).post("/change").send({
    type: "modify-special-exit",
    roomNumber: 1,
    exitCommand: "worm warp",
    destination: 1337,
    reporter: "Test Reporter",
  });
  await request(app).post("/change").send({
    type: "delete-special-exit",
    roomNumber: 1,
    exitCommand: "worm warp",
    reporter: "Test Reporter",
  });

  await request(app)
    .get("/map?format=json&timesSeen=0")
    .expect(200)
    .expect("X-Map-Version", "466.AYvP5WgBdSw.2")
    .expect((res) => {
      const responseText = res.text;
      const map: any = JSON.parse(responseText);
      const area: any = map.areas[5];
      const room: any = area.rooms[0];
      expect(room).toMatchSnapshot();
    });
});
