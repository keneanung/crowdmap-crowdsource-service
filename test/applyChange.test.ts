import { beforeEach, expect, test } from "@jest/globals";
import request from "supertest";
import { app } from "../src/app";
import { setupChangeServiceMock } from "./setup/iocSetup";

import { config } from "../src/config/values";
import { writeMocks } from "./setup/writeMocks";

beforeEach(() => {
  setupChangeServiceMock();
});

test("applyChange returns a conflict error, when the version does not match the current server map version", async () => {
  await request(app)
    .post("/change/apply")
    .set("x-api-key", "abc123456")
    .send({
      version: "255",
      obsoleteChanges: [],
    })
    .expect(409)
    .expect((res) => {
      expect(res.body).toEqual({
        message:
          "The map version provided does not match the current map version",
      });
    });
});

test("applyChange return an unauthorized error when no api token is provided", async () => {
  await request(app)
    .post("/change/apply")
    .send({
      version: "466",
      obsoleteChanges: [],
    })
    .expect(403)
    .expect((res) => {
      expect(res.body).toEqual({
        message: "Invalid Token: Access Denied",
      });
    });
});

test("applyChange returns an unauthorized error when an invalid api token is provided", async () => {
  await request(app)
    .post("/change/apply")
    .set("x-api-key", "wrong-token")
    .send({
      version: "466",
      obsoleteChanges: [],
    })
    .expect(403)
    .expect((res) => {
      expect(res.body).toEqual({
        message: "Invalid Token: Access Denied",
      });
    });
});

test("applyChange returns an unauthorized error when a user with an invalid role tries to apply a change", async () => {
  let apiKey = "";
  await request(app)
    .post("/admin/user")
    .set("x-api-key", "abc123456")
    .send({
      name: "new_user",
      roles: [],
    })
    .expect(201)
    .then((res) => {
      apiKey = res.body as string;
    });

  await request(app)
    .post("/change/apply")
    .set("x-api-key", apiKey)
    .send({
      version: "466",
      obsoleteChanges: [],
    })
    .expect(403)
    .expect((res) => {
      expect(res.body).toEqual({
        message: "Access Denied",
      });
    });
});

test("applyChange should return a conflict error, when the server version is different from the version specified in the body", async () => {
  await request(app)
    .post("/change/apply")
    .set("x-api-key", "abc123456")
    .send({
      version: "465",
      obsoleteChanges: [],
    })
    .expect(409)
    .expect((res) => {
      expect(res.body).toEqual({
        message:
          "The map version provided does not match the current map version",
      });
    });
});

test("applyChange should remove changes applied to the base map", async () => {
  await request(app).post("/change").send({
    type: "room-name",
    roomNumber: 1,
    name: "Test Room",
    reporter: "Test Reporter",
  });

  // Get the change to extract its UUID
  const changesResponse = await request(app).get("/change").expect(200);
  const changes = changesResponse.body;
  expect(changes).toHaveLength(1);
  const changeId = changes[0].changeId;

  await request(app)
    .post("/change/apply")
    .set("x-api-key", "abc123456")
    .send({
      version: "466",
      obsoleteChanges: [changeId],
    })
    .expect(204);

  await request(app)
    .get("/change")
    .expect(200)
    .expect((res) => {
      expect(res.body).toEqual([]);
    });
});

test("applyChange should leave changes not applied alone", async () => {
  await request(app).post("/change").send({
    type: "room-name",
    roomNumber: 1,
    name: "Test Room",
    reporter: "Test Reporter",
  });
  await request(app).post("/change").send({
    type: "room-name",
    roomNumber: 2,
    name: "Test Room 2",
    reporter: "Test Reporter",
  });

  // Get the changes to extract their UUIDs
  const changesResponse = await request(app).get("/change").expect(200);
  const changes = changesResponse.body;
  expect(changes).toHaveLength(2);
  
  // Apply the first change by its UUID
  const firstChangeId = changes[0].changeId;

  await request(app)
    .post("/change/apply")
    .set("x-api-key", "abc123456")
    .send({
      version: "466",
      obsoleteChanges: [firstChangeId],
    })
    .expect(204);

  await request(app)
    .get("/change")
    .expect(200)
    .expect((res) => {
      expect(res.body).toHaveLength(1);
      const remainingChange = res.body[0];
      expect(remainingChange).toMatchObject({
        type: "room-name",
        roomNumber: 2,
        name: "Test Room 2",
        reporters: 1,
      });
      // The remaining change should have a valid UUID
      expect(typeof remainingChange.changeId).toBe('string');
      expect(remainingChange.changeId).toMatch(/^[0-9a-f-]{36}$/i);
    });
});

test("applyChange should download new map version files", async () => {
  await request(app).post("/change").send({
    type: "room-name",
    roomNumber: 1,
    name: "Test Room",
    reporter: "Test Reporter",
  });

  // Get the change to extract its UUID
  const changesResponse = await request(app).get("/change").expect(200);
  const changes = changesResponse.body;
  expect(changes).toHaveLength(1);
  const changeId = changes[0].changeId;

  await request(app)
    .post("/change/apply")
    .set("x-api-key", "abc123456")
    .send({
      version: "466",
      obsoleteChanges: [changeId],
    })
    .expect(204);

  expect(writeMocks[config.versionFile].buffer).not.toEqual("466");
});

test("applyChange should download new map files", async () => {
  await request(app).post("/change").send({
    type: "room-name",
    roomNumber: 1,
    name: "Test Room",
    reporter: "Test Reporter",
  });

  // Get the change to extract its UUID
  const changesResponse = await request(app).get("/change").expect(200);
  const changes = changesResponse.body;
  expect(changes).toHaveLength(1);
  const changeId = changes[0].changeId;

  await request(app)
    .post("/change/apply")
    .set("x-api-key", "abc123456")
    .send({
      version: "466",
      obsoleteChanges: [changeId],
    })
    .expect(204);

  // lets take this as an indication that we tried to download a new map file (because we modified it)
  expect(writeMocks[config.mapFile]).toBeDefined();
});
