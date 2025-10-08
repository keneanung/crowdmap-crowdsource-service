import { beforeEach, expect, test } from "@jest/globals";
import request from "supertest";
import { app } from "../src/app";
import { setupChangeServiceMock } from "./setup/iocSetup";

beforeEach(() => {
  setupChangeServiceMock();
});

test("getChanges returns empty array when no changes", async () => {
  await request(app)
    .get("/change")
    .expect(200)
    .expect((res) => {
      expect(res.body).toEqual([]);
    });
});

test("the version endpoint returns the baseline version when no changes", async () => {
  await request(app)
    .get("/map/version?timesSeen=0")
    .expect(200)
    .expect((res) => {
      expect(res.body).toEqual("466.AAAAAAAAAAA.0");
    });
});

test("the map endoint returns the baseline JSON map when no changes and JSONis requested", async () => {
  await request(app)
    .get("/map?timesSeen=0&format=json")
    .expect(200)
    .expect("Content-Type", "application/json; charset=utf-8")
    .expect((res) => {
      expect(res.body).toMatchSnapshot();
    });
});

test("the map endoint returns the baseline binary map when no changes and binary is requested", async () => {
  await request(app)
    .get("/map?timesSeen=0&format=binary")
    .expect(200)
    .expect("Content-Type", "application/octet-stream")
    .expect((res) => {
      expect(res.body).toBeDefined();
    });
});

test("the map endpoint returns the map version in the header", async () => {
  await request(app)
    .get("/map?timesSeen=0&format=json")
    .expect(200)
    .expect("X-Map-Version", "466.AAAAAAAAAAA.0");
});

test("GET /docs returns the Swagger UI", async () => {
  await request(app)
    .get("/docs/")
    .expect(200)
    .expect("Content-Type", "text/html; charset=utf-8");
});

test("GET /unknown-path returns 404 Not Found", async () => {
  await request(app)
    .get("/unknown-path")
    .expect(404)
    .expect("Content-Type", "application/json; charset=utf-8")
    .expect((res) => {
      expect(res.body).toEqual({
        message: "Not Found",
      });
    });
});
