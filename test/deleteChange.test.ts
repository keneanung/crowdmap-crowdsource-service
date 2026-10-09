import { beforeEach, expect, test } from "@jest/globals";
import request from "supertest";
import { app } from "../src/app.js";
import { setupChangeServiceMock } from "./setup/iocSetup.js";

beforeEach(() => {
  setupChangeServiceMock();
});

async function addReport(): Promise<string> {
  await request(app).post("/change").send({
    type: "room-name",
    roomNumber: 1,
    name: "Wrong name",
    reporter: "Test Reporter",
  });
  const response = await request(app).get("/change").expect(200);
  const reports = response.body as { changeId: string }[];
  const report = reports.at(0);
  if (!report) throw new Error("Expected the submitted report to be returned");
  return report.changeId;
}

test("map administrators can delete selected pending reports", async () => {
  const changeId = await addReport();

  await request(app)
    .post("/change/delete")
    .set("x-api-key", "abc123456")
    .send({ changeIds: [changeId] })
    .expect(200)
    .expect({ deleted: 1 });

  await request(app).get("/change").expect(200).expect([]);
});

test("deleting a report requires authentication", async () => {
  const changeId = await addReport();
  await request(app)
    .post("/change/delete")
    .send({ changeIds: [changeId] })
    .expect(403);
  await request(app)
    .get("/change")
    .expect(200)
    .expect((response) => {
      expect(response.body).toHaveLength(1);
    });
});

test("deleting unknown reports is idempotent", async () => {
  await request(app)
    .post("/change/delete")
    .set("x-api-key", "abc123456")
    .send({ changeIds: ["unknown-change"] })
    .expect(200)
    .expect({ deleted: 0 });
});

test("discarding a change removes every supporter but preserves independent changes", async () => {
  const changeId = await addReport();
  await request(app)
    .post("/change")
    .send({
      type: "room-name",
      roomNumber: 1,
      name: "Wrong name",
      reporter: "Another Mapper",
    })
    .expect(201);
  await request(app)
    .post("/change")
    .send({
      type: "room-name",
      roomNumber: 2,
      name: "Independent",
      reporter: "Another Mapper",
    })
    .expect(201);
  const before = await request(app).get("/change?timesSeen=0").expect(200);
  expect(
    (before.body as { changeId: string; reporters: number }[]).find(
      (c) => c.changeId === changeId,
    )?.reporters,
  ).toBe(2);
  await request(app)
    .post("/change/delete")
    .set("x-api-key", "abc123456")
    .send({ changeIds: [changeId] })
    .expect(200)
    .expect({ deleted: 1 });
  const remaining = await request(app).get("/change?timesSeen=0").expect(200);
  expect(remaining.body).toEqual([
    expect.objectContaining({
      roomNumber: 2,
      name: "Independent",
      reporters: 1,
    }),
  ]);
});

test("review APIs expose changes rather than individual observations", async () => {
  await request(app).get("/change/observations").expect(404);
  await request(app)
    .post("/change/delete")
    .set("x-api-key", "abc123456")
    .send({ observationIds: ["unknown"] })
    .expect(422);
  await request(app)
    .post("/change/delete")
    .set("x-api-key", "abc123456")
    .send({})
    .expect(422);
});
