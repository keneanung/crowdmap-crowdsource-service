import { beforeEach, describe, expect, test } from "@jest/globals";
import request from "supertest";
import { app } from "../src/app.js";
import { setupChangeServiceMock } from "./setup/iocSetup.js";

beforeEach(() => {
  setupChangeServiceMock();
});

describe.each([
  ["delete-room", { roomNumber: 42 }],
  ["rename-area", { areaId: 7, name: "New name" }],
  ["delete-area", { areaId: 7 }],
  ["set-room-weight", { roomNumber: 42, weight: 3 }],
  ["set-room-symbol", { roomNumber: 42, symbol: "W" }],
  ["set-room-hash", { roomNumber: 42, hash: "room-hash" }],
  ["set-exit-door", { roomNumber: 42, direction: "north", status: 3 }],
  ["set-map-user-data", { key: "mapFeatures", value: "features" }],
  ["delete-map-user-data", { key: "mapFeatures" }],
  ["delete-map-label", { areaId: 7, labelId: 3 }],
  [
    "set-map-label",
    {
      areaId: 7,
      labelId: 3,
      label: {
        text: "label",
        x: 1,
        y: 2,
        z: 3,
        width: 4,
        height: 5,
        fgColor: { alpha: 255, r: 1, g: 2, b: 3 },
        bgColor: { alpha: 128, r: 4, g: 5, b: 6 },
        noScaling: false,
        showOnTop: true,
      },
    },
  ],
])("%s submissions", (type, fields) => {
  test("are accepted and returned", async () => {
    await request(app)
      .post("/change")
      .send({ type, reporter: "Test Reporter", ...fields })
      .expect(201);

    await request(app)
      .get("/change")
      .expect(200)
      .expect((response) => {
        expect(response.body).toEqual([
          expect.objectContaining({ type, reporters: 1, ...fields }),
        ]);
      });
  });
});
