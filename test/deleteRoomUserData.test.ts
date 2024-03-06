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

test("Should accept and return room user data deletions", async () => {
  await request(app)
    .post("/change")
    .send({
      type: "delete-room-user-data",
      roomNumber: 1,
      key: "test user data",
      reporter: "Test Reporter",
    })
    .expect(201);

  await request(app)
    .get("/change")
    .expect(200)
    .expect((res) => {
      expect(res.body).toStrictEqual([
        {
          type: "delete-room-user-data",
          roomNumber: 1,
          key: "test user data",
          reporters: 1,
        },
      ]);
    });
});

test("Should incorporate room user data deletions into the map", async () => {
  await request(app).post("/change").send({
    type: "delete-room-user-data",
    roomNumber: 1,
    key: "gotoMapping",
    reporter: "Test Reporter",
  });

  await request(app)
    .get("/map?format=json&timesSeen=0")
    .expect(200)
    .expect("X-Map-Version", "466.1.1")
    .expect((res) => {
      const responseText = res.text;
      const map: any = JSON.parse(responseText);
      const area: any = map.areas[5];
      const room: any = area.rooms[0];
      expect(room).toMatchSnapshot();
    });
});
