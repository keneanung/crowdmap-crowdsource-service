import { expect, test } from "@jest/globals";
import { spawnSync } from "node:child_process";
import request from "supertest";
import { app } from "../src/app.js";
import { serializeLuaChangelog } from "../src/services/luaChangelog.js";
import { setupChangeServiceMock } from "./setup/iocSetup.js";

test("Lua 5.1 loads area details with line breaks and a final single-line summary", () => {
  const source = serializeLuaChangelog({
    source: "ai",
    summary: "Latest\nsummary",
    entries: [
      {
        areaId: 55,
        areaName: 'Hashan "shops"',
        text: 'Changed \\paths, ]], quotes " and \u00001; <red>\nMore details.',
        factIds: ["PRIVATE"],
      },
      {
        areaId: 55,
        areaName: 'Hashan "shops"',
        text: "Added rooms.",
        factIds: [],
      },
      { areaId: 56, areaName: "Cyrene", text: "Changed exits.", factIds: [] },
    ],
  });
  const result = spawnSync(
    "lua5.1",
    [
      "-e",
      "local env={}; local f,e=loadstring(io.read('*a')); assert(f,e); setfenv(f,env); f(); assert(#env.changelog==3); assert(env.changelog[3]=='Latest summary'); io.write(env.changelog[1]);",
    ],
    { input: source, encoding: "utf8" },
  );
  expect(result.error).toBeUndefined();
  expect(result.status).toBe(0);
  expect(result.stdout).toContain('Hashan "shops"\n    • Changed \\paths');
  expect(result.stdout).toContain(
    "\u00001; ‹red›\n      More details.\n    • Added rooms.",
  );
  expect(source).not.toContain("PRIVATE");
  expect(source).not.toContain("baseVersion");
});

test("empty Lua notes still supply a Latest changes item", () => {
  expect(
    serializeLuaChangelog({
      source: "empty",
      summary: "No changes from the base map.",
      entries: [],
    }),
  ).toBe('changelog = {\n  "No changes from the base map.",\n}\n');
});

test("Lua format is raw text and shares version validation with default JSON", async () => {
  setupChangeServiceMock();
  const version = (await request(app).get("/map/version?timesSeen=2"))
    .body as string;
  const response = await request(app)
    .get("/map/changelog")
    .query({ timesSeen: 2, expectedVersion: version, format: "lua" });
  expect(response.status).toBe(200);
  expect(response.headers["content-type"]).toContain("text/plain");
  expect(response.headers["x-map-version"]).toBe(version);
  expect(response.text).toBe(
    'changelog = {\n  "No changes from the base map.",\n}\n',
  );
  expect(
    (
      await request(app)
        .get("/map/changelog")
        .query({ timesSeen: 2, expectedVersion: version })
    ).body,
  ).toMatchObject({ source: "empty" });
  expect(
    (
      await request(app).get(
        "/map/changelog?timesSeen=2&expectedVersion=old&format=lua",
      )
    ).status,
  ).toBe(409);
  expect(
    (
      await request(app)
        .get("/map/changelog")
        .query({ timesSeen: 2, expectedVersion: version, format: "invalid" })
    ).status,
  ).toBe(422);
});
