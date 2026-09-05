import { beforeEach, expect, jest, test } from "@jest/globals";
import request from "supertest";
import { app } from "../src/app.js";
import { setupChangeServiceMock } from "./setup/iocSetup.js";

import { MudletMapReader } from "mudlet-map-binary-reader";
jest.setTimeout(15_000);
import { readFile, rm, writeFile } from "node:fs/promises";
import { config } from "../src/config/values.js";
import { fetchMock } from "./setup/mockFetch.js";

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

  await request(app)
    .post("/change/apply")
    .set("x-api-key", "abc123456")
    .send({
      version: "466",
      obsoleteChanges: ["018bcfe5-6800-7777-8d30-5e6a25dbfac1"],
    })
    .expect(200)
    .expect({ automaticallyResolved: 0, upstreamConflicts: 0 });

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

  await request(app)
    .post("/change/apply")
    .set("x-api-key", "abc123456")
    .send({
      version: "466",
      obsoleteChanges: ["018bcfe5-6800-7777-8d30-5e6a25dbfac1"],
    })
    .expect(200);

  await request(app)
    .get("/change")
    .expect(200)
    .expect((res) => {
      expect(res.body).toEqual([
        {
          type: "room-name",
          roomNumber: 2,
          name: "Test Room 2",
          reporters: 1,
          changeId: "018bcfe5-6801-752c-84de-0e9be2aa733e",
        },
      ]);
    });
});

test("applyChange automatically removes changes already present upstream", async () => {
  await request(app).post("/change").send({
    type: "set-room-coordinates",
    roomNumber: 1,
    x: 32568,
    y: 0,
    z: 0,
    reporter: "Test Reporter",
  });

  await request(app)
    .post("/change/apply")
    .set("x-api-key", "abc123456")
    .send({ version: "466", obsoleteChanges: [] })
    .expect(200)
    .expect({ automaticallyResolved: 1, upstreamConflicts: 0 });

  await request(app).get("/change").expect(200).expect([]);
});

test("applyChange flags pending changes whose target changed upstream", async () => {
  await request(app).post("/change").send({
    type: "room-name",
    roomNumber: 1,
    name: "Crowd-sourced name",
    reporter: "Test Reporter",
  });

  const upstreamMap = MudletMapReader.readBuffer(await readFile(config.mapFile));
  upstreamMap.rooms[1].name = "Different upstream name";
  const upstreamMapFile = `${config.mapFile}.upstream`;
  await writeFile(upstreamMapFile, MudletMapReader.writeBuffer(upstreamMap));
  fetchMock.mockResolvedValueOnce(
    new Response(await readFile(upstreamMapFile), { status: 200 }),
  );

  try {
    await request(app)
      .post("/change/apply")
      .set("x-api-key", "abc123456")
      .send({ version: "466", obsoleteChanges: [] })
      .expect(200)
      .expect({ automaticallyResolved: 0, upstreamConflicts: 1 });
  } finally {
    await rm(upstreamMapFile, { force: true });
  }

  await request(app)
    .get("/change")
    .expect(200)
    .expect((res) => {
      expect(res.body).toEqual([
        expect.objectContaining({
          type: "room-name",
          roomNumber: 1,
          name: "Crowd-sourced name",
          upstreamConflict: {
            baselineVersion: "467",
            reason: expect.stringContaining("Different upstream name"),
          },
        }),
      ]);
    });
}, 15_000);

test("applyChange should download new map version files", async () => {
  await request(app).post("/change").send({
    type: "room-name",
    roomNumber: 1,
    name: "Test Room",
    reporter: "Test Reporter",
  });

  await request(app)
    .post("/change/apply")
    .set("x-api-key", "abc123456")
    .send({
      version: "466",
      obsoleteChanges: ["018bcfe5-6800-7777-8d30-5e6a25dbfac1"],
    })
    .expect(200);

  expect(await readFile(config.versionFile, "utf8")).not.toEqual("466");
});

test("applyChange should download new map files", async () => {
  await request(app).post("/change").send({
    type: "room-name",
    roomNumber: 1,
    name: "Test Room",
    reporter: "Test Reporter",
  });

  await request(app)
    .post("/change/apply")
    .set("x-api-key", "abc123456")
    .send({
      version: "466",
      obsoleteChanges: ["018bcfe5-6800-7777-8d30-5e6a25dbfac1"],
    })
    .expect(200);

  // lets take this as an indication that we tried to download a new map file (because we modified it)
  expect((await readFile(config.mapFile)).length).toBeGreaterThan(0);
});

test("applyChange keeps changes when a baseline download fails", async () => {
  await request(app).post("/change").send({
    type: "room-name",
    roomNumber: 1,
    name: "Test Room",
    reporter: "Test Reporter",
  });
  fetchMock.mockResolvedValueOnce(new Response("failure", { status: 503 }));

  await request(app)
    .post("/change/apply")
    .set("x-api-key", "abc123456")
    .send({
      version: "466",
      obsoleteChanges: ["018bcfe5-6800-7777-8d30-5e6a25dbfac1"],
    })
    .expect(500);

  await request(app)
    .get("/change")
    .expect(200)
    .expect((res) => {
      expect(res.body).toHaveLength(1);
    });
  expect((await readFile(config.versionFile, "utf8")).trim()).toEqual("466");
});
