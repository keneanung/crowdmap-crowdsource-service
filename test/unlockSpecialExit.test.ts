 
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

test("Should accept and return special exit unlocking", async () => {
  await request(app)
    .post("/change")
    .send({
      type: "unlock-special-exit",
      roomNumber: 1,
      exitCommand: "worm warp",
      destination: 1337,
      reporter: "Test Reporter",
    })
    .expect(201);

  await request(app)
    .get("/change")
    .expect(200)
    .expect((res) => {
      expect(res.body).toStrictEqual([
        {
          type: "unlock-special-exit",
          roomNumber: 1,
          exitCommand: "worm warp",
          destination: 1337,
          reporters: 1,
          changeId: "018bcfe5-6800-7777-8d30-5e6a25dbfac1",
        },
      ]);
    });
});

test("Should incorporate special exit unlocking into the map", async () => {
  await request(app).post("/change").send({
    type: "modify-special-exit",
    roomNumber: 1,
    exitCommand: "worm warp",
    destination: 1337,
    reporter: "Test Reporter",
  });
  await request(app).post("/change").send({
    type: "lock-special-exit",
    roomNumber: 1,
    exitCommand: "north",
    destination: 1337,
    reporter: "Test Reporter",
  });
  await request(app).post("/change").send({
    type: "unlock-special-exit",
    roomNumber: 1,
    exitCommand: "north",
    destination: 1337,
    reporter: "Test Reporter",
  });

  await request(app)
    .get("/map?format=json&timesSeen=0")
    .expect(200)
    .expect("X-Map-Version", "466.AYvP5WgCcYU.3")
    .expect((res) => {
      const responseText = res.text;
      const map: any = JSON.parse(responseText);
      const area: any = map.areas[5];
      const room: any = area.rooms[0];
      expect(room).toMatchSnapshot();
    });
});
