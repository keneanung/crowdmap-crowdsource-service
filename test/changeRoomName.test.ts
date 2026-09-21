/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { beforeEach, expect, test } from "@jest/globals";
import request from "supertest";
import { app } from "../src/app.js";
import { setupChangeServiceMock } from "./setup/iocSetup.js";

interface MapResponse {
  areas: { rooms: { id: number; name: string }[] }[];
}

beforeEach(() => {
  setupChangeServiceMock();
});

test("Should accept and return room name changes", async () => {
  await request(app)
    .post("/change")
    .send({
      type: "room-name",
      roomNumber: 1,
      name: "New Room Name",
      reporter: "Test Reporter",
    })
    .expect(201);

  await request(app)
    .get("/change")
    .expect(200)
    .expect((res) => {
      expect(res.body).toStrictEqual([
        {
          type: "room-name",
          roomNumber: 1,
          name: "New Room Name",
          reporters: 1,
          changeId: "018bcfe5-6800-7777-8d30-5e6a25dbfac1",
        },
      ]);
    });
});

test("Should incorporate room name changes into the map", async () => {
  await request(app).post("/change").send({
    type: "room-name",
    roomNumber: 1,
    name: "New Room Name",
    reporter: "Test Reporter",
  });

  await request(app)
    .get("/map?format=json&timesSeen=0")
    .expect(200)
    .expect("X-Map-Version", "466.AYvP5WgAd3c.1")
    .expect((res) => {
      const responseText = res.text;
      const map: any = JSON.parse(responseText);
      const area: any = map.areas[5];
      const room: any = area.rooms[0];
      expect(room).toMatchSnapshot();
    });
});

test("Should include a reporter's unvetted changes in their map and version", async () => {
  await request(app).post("/change").send({
    type: "room-name",
    roomNumber: 1,
    name: "My unvetted room name",
    reporter: "Personal Mapper",
  });

  await request(app)
    .get("/map?format=json&timesSeen=2&reporter=Personal%20Mapper")
    .expect(200)
    .expect("X-Map-Version", "466.AYvP5WgAd3c.1")
    .expect((res) => {
      const map: MapResponse = JSON.parse(res.text);
      expect(map.areas[5].rooms[0].name).toBe("My unvetted room name");
    });

  await request(app)
    .get("/map/version?timesSeen=2&reporter=Personal%20Mapper")
    .expect(200)
    .expect((res) => {
      expect(res.body).toBe("466.AYvP5WgAd3c.1");
    });
});

test("Should download a map containing only explicitly selected changes", async () => {
  const baselineResponse = await request(app)
    .get("/map?format=json&timesSeen=0")
    .expect(200);
  const baselineMap: MapResponse = JSON.parse(baselineResponse.text);
  const baselineRoom2 = baselineMap.areas
    .flatMap((area) => area.rooms)
    .find((room) => room.id === 2);
  expect(baselineRoom2).toBeDefined();
  if (!baselineRoom2) throw new Error("Baseline map does not contain room 2");

  await request(app).post("/change").send({
    type: "room-name",
    roomNumber: 1,
    name: "Selected room name",
    reporter: "Test Reporter",
  });
  await request(app).post("/change").send({
    type: "room-name",
    roomNumber: 2,
    name: "Unselected room name",
    reporter: "Test Reporter",
  });

  await request(app)
    .get(
      "/map?format=json&timesSeen=0&include=018bcfe5-6800-7777-8d30-5e6a25dbfac1",
    )
    .expect(200)
    .expect("X-Map-Version", "466.AYvP5WgAd3c.1")
    .expect((res) => {
      const map: MapResponse = JSON.parse(res.text);
      expect(map.areas[5].rooms[0].name).toBe("Selected room name");
      const room2 = map.areas
        .flatMap((area) => area.rooms)
        .find((room) => room.id === 2);
      if (!room2) throw new Error("Downloaded map does not contain room 2");
      expect(room2.name).toBe(baselineRoom2.name);
    });
});
