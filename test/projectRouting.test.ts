import { afterAll, beforeAll, expect, test } from "@jest/globals";
import request from "supertest";
import { app } from "../src/app.js";
import { config, type MapProject } from "../src/config/values.js";
import { setupChangeServiceMock } from "./setup/iocSetup.js";

const original = {
  projects: config.projects,
  projectResolver: config.projectResolver,
  hostProjectMap: config.hostProjectMap,
  platformHost: config.platformHost,
};
const createProject = (id: string): MapProject => ({
  id,
  name: `${id.toUpperCase()} map`,
  mapFile: config.mapFile,
  versionFile: config.versionFile,
  mapDownloadUrl: config.mapDownloadUrl,
  versionDownloadUrl: config.versionDownloadUrl,
});

beforeAll(() => {
  config.projects = [createProject("alpha"), createProject("beta")];
  config.projectResolver = "host";
  config.hostProjectMap = {
    "alpha.example.test": "alpha",
    "beta.example.test": "beta",
  };
  config.platformHost = "maps.example.test";
  setupChangeServiceMock();
});

afterAll(() => {
  config.projects = original.projects;
  config.projectResolver = original.projectResolver;
  config.hostProjectMap = original.hostProjectMap;
  config.platformHost = original.platformHost;
});

test("the same public paths are isolated by configured host", async () => {
  const submission = {
    type: "room-name",
    roomNumber: 42,
    reporter: "reporter",
    name: "Alpha-only name",
  };
  await request(app)
    .post("/change")
    .set("Host", "alpha.example.test")
    .send(submission)
    .expect(201);

  await request(app)
    .get("/change")
    .set("Host", "alpha.example.test")
    .expect(200)
    .expect((response) => {
      expect(response.body).toHaveLength(1);
    });
  await request(app)
    .get("/change")
    .set("Host", "beta.example.test")
    .expect(200)
    .expect((response) => {
      expect(response.body).toEqual([]);
    });
});

test("unknown hosts are rejected and the platform host renders a selector", async () => {
  await request(app)
    .get("/change")
    .set("Host", "unknown.example.test")
    .expect(404);
  await request(app)
    .get("/")
    .set("Host", "maps.example.test")
    .expect(200)
    .expect((response) => {
      expect(response.text).toContain("ALPHA map");
      expect(response.text).toContain("alpha.example.test");
    });
  await request(app)
    .get("/review.html")
    .set("Host", "maps.example.test")
    .expect(404);
});

test("container health remains available independently of host routing", async () => {
  await request(app)
    .get("/utility/healthcheck")
    .set("Host", "localhost")
    .expect(200, { status: "ok" });
});

test("project admins cannot administer another project and site admins can", async () => {
  let projectAdminKey = "";
  await request(app)
    .post("/admin/user")
    .set("Host", "maps.example.test")
    .set("x-api-key", "abc123456")
    .send({
      name: "alpha-admin",
      roles: ["map_admin"],
      mapAdminProjects: ["alpha"],
    })
    .expect(201)
    .then((response) => {
      projectAdminKey = response.body as string;
    });

  await request(app)
    .post("/change/apply")
    .set("Host", "beta.example.test")
    .set("x-api-key", projectAdminKey)
    .send({ version: "wrong", obsoleteChanges: [] })
    .expect(403);
  await request(app)
    .post("/change/apply")
    .set("Host", "alpha.example.test")
    .set("x-api-key", projectAdminKey)
    .send({ version: "wrong", obsoleteChanges: [] })
    .expect(409);
  await request(app)
    .post("/change/apply")
    .set("Host", "beta.example.test")
    .set("x-api-key", "abc123456")
    .send({ version: "wrong", obsoleteChanges: [] })
    .expect(409);
});
