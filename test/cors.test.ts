import { beforeEach, expect, test } from "@jest/globals";
import request from "supertest";
import { app } from "../src/app";
import { setupChangeServiceMock } from "./setup/iocSetup";

beforeEach(() => {
  setupChangeServiceMock();
});

test("GET /docs returns the Swagger UI from a different origin", async () => {
  await request(app)
    .get("/docs/")
    .set("Origin", "https://nexus.achaea.com")
    .expect(200)
    .expect((res) => {
      expect(res.headers["access-control-allow-origin"]).toEqual("*");
    });
});

test("Should incorporate special exit changes into the map", async () => {
  await request(app)
    .post("/change")
    .set("Origin", "https://nexus.achaea.com")
    .send({
      type: "modify-special-exit",
      roomNumber: 1,
      exitCommand: "north",
      destination: 1337,
      reporter: "Test Reporter",
    })
    .expect(201);
});
