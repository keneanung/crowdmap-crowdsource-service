/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { beforeEach, expect, test } from "@jest/globals";
import request from "supertest";
import { app } from "../src/app";
import { setupChangeServiceMock } from "./setup/iocSetup";

beforeEach(() => {
  setupChangeServiceMock();
});

test("Should accept and return movements of rooms between areas", async () => {
  await request(app)
    .post("/change")
    .send({
      type: "set-room-area",
      roomNumber: 1,
      areaId: 55,
      reporter: "Test Reporter",
    })
    .expect(201);

  await request(app)
    .get("/change")
    .expect(200)
    .expect((res) => {
      expect(res.body).toStrictEqual([
        {
          type: "set-room-area",
          roomNumber: 1,
          areaId: 55,
          reporters: 1,
        },
      ]);
    });
});

test("Should incorporate movements of rooms between areas into the map", async () => {
  await request(app).post("/change").send({
    type: "set-room-area",
    areaId: 55,
    roomNumber: 1,
    reporter: "Test Reporter",
  });

  await request(app)
    .get("/map?format=json&timesSeen=0")
    .expect(200)
    .expect("X-Map-Version", "466.1.1")
    .expect((res) => {
      const responseText = res.text;
      const map: any = JSON.parse(responseText);
      const area: any = map.areas.find((a: any) => a.id === 55);
      const room: any = area.rooms[0];
      expect(room).toMatchSnapshot();
    });
});
