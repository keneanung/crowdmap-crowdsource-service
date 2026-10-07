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

test("observation withdrawal preserves other support and ignores a replaced selection", async () => {
  await addReport();
  await request(app)
    .post("/change")
    .send({
      type: "room-name",
      roomNumber: 1,
      name: "Wrong name",
      reporter: "Another Mapper",
    })
    .expect(201);
  const observationResponse = await request(app)
    .get("/change/observations")
    .expect(200);
  const observations = observationResponse.body as { observationId: string }[];
  expect(observations).toHaveLength(2);
  await request(app)
    .post("/change/delete")
    .set("x-api-key", "abc123456")
    .send({ observationIds: [observations[0].observationId] })
    .expect(200)
    .expect({ deleted: 1 });
  const remaining = await request(app).get("/change").expect(200);
  expect(remaining.body).toHaveLength(1);
  expect((remaining.body as { reporters: number }[])[0].reporters).toBe(1);
  await request(app)
    .post("/change")
    .send({
      type: "room-name",
      roomNumber: 1,
      name: "Better name",
      reporter: "Another Mapper",
    })
    .expect(201);
  await request(app)
    .post("/change/delete")
    .set("x-api-key", "abc123456")
    .send({ observationIds: [observations[1].observationId] })
    .expect(200)
    .expect({ deleted: 0 });
  const final = await request(app).get("/change").expect(200);
  expect((final.body as { name: string }[])[0].name).toBe("Better name");
});
test("observation deletion requires authorization and an unambiguous selection", async () => {
  await request(app)
    .post("/change/delete")
    .send({ observationIds: ["unknown"] })
    .expect(403);
  await request(app)
    .post("/change/delete")
    .set("x-api-key", "abc123456")
    .send({ changeIds: [], observationIds: [] })
    .expect(422);
  await request(app)
    .post("/change/delete")
    .set("x-api-key", "abc123456")
    .send({})
    .expect(422);
});
