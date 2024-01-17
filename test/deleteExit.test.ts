/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { beforeEach, expect, test } from "@jest/globals";
import request from "supertest";
import { app } from "../src/app";
import { setupChangeServiceMock } from "./iocSetup";

beforeEach(() => {
  setupChangeServiceMock();
});

test("Should accept and return exit deletion", async () => {
  await request(app)
    .post("/change")
    .send({
      type: "delete-exit",
      roomNumber: 39478,
      direction: "east",
      reporter: "Test Reporter",
    })
    .expect(201);

  await request(app)
    .get("/change")
    .expect(200)
    .expect((res) => {
      expect(res.body).toStrictEqual([
        {
          type: "delete-exit",
          roomNumber: 39478,
          direction: "east",
          reporters: 1,
        },
      ]);
    });
});

test("Should incorporate exit deletions into the map", async () => {
  await request(app).post("/change").send({
    type: "delete-exit",
    roomNumber: 39478,
    direction: "east",
    reporter: "Test Reporter",
  });

  await request(app)
    .get("/map?format=json&timesSeen=0")
    .expect(200)
    .expect("X-Map-Version", "466.1.1")
    .expect((res) => {
      const responseText = res.text;
      const map: any = JSON.parse(responseText);
      const area: any = map.areas[230];
      const room: any = area.rooms[27];
      expect(room).toMatchSnapshot();
    });
});
