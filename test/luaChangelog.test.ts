import { expect, test } from "@jest/globals";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import request from "supertest";
import { app } from "../src/app.js";
import { serializeLuaChangelog } from "../src/services/luaChangelog.js";
import { setupChangeServiceMock } from "./setup/iocSetup.js";

test("Lua 5.1 loads separate notes safely and puts the opening headline last", () => {
  const text =
    'Aster Keep grows.\n\nChanged \\paths, ]], quotes " and \u00001; <red>.';
  const result = spawnSync(
    "lua5.1",
    [
      "-e",
      "local env={}; local f,e=loadstring(io.read('*a')); assert(f,e); setfenv(f,env); f(); assert(#env.changelog==2); assert(env.changelog[2]=='Aster Keep grows.'); io.write(env.changelog[1]);",
    ],
    { input: serializeLuaChangelog({ source: "ai", text }), encoding: "utf8" },
  );
  expect(result.error).toBeUndefined();
  expect(result.status).toBe(0);
  expect(result.stdout).toBe(
    text.split("\n\n")[1].replaceAll("<", "‹").replaceAll(">", "›"),
  );
});

test("Lua Latest changes excerpt is bounded", () => {
  const lua = serializeLuaChangelog({ source: "ai", text: "x".repeat(700) });
  expect(lua).toContain('"' + "x".repeat(597) + '..."');
});

test("plain prose and Lua share the version-first endpoint and source metadata", async () => {
  setupChangeServiceMock();
  const version = (await request(app).get("/map/version?timesSeen=2"))
    .body as string;
  const query = { timesSeen: 2, expectedVersion: version };
  const text = await request(app).get("/map/changelog").query(query);
  expect(text.status).toBe(200);
  expect(text.text).toBe("No changes from the base map.");
  expect(text.headers["content-type"]).toContain("text/plain");
  expect(text.headers["x-changelog-source"]).toBe("empty");
  const lua = await request(app)
    .get("/map/changelog")
    .query({ ...query, format: "lua" });
  expect(lua.text).toBe(
    serializeLuaChangelog({ source: "empty", text: text.text }),
  );
  expect(lua.headers["x-map-version"]).toBe(version);
  expect(
    (
      await request(app)
        .get("/map/changelog")
        .query({ ...query, expectedVersion: "old", format: "lua" })
    ).status,
  ).toBe(409);
  expect(
    (
      await request(app)
        .get("/map/changelog")
        .query({ ...query, format: "json" })
    ).status,
  ).toBe(422);
});

test("OpenAPI describes changelog output as ordinary text", () => {
  const spec = JSON.parse(
    readFileSync(new URL("../generated/swagger.json", import.meta.url), "utf8"),
  ) as {
    paths: Record<
      string,
      { get: { responses: Record<string, { content: unknown }> } }
    >;
  };
  expect(spec.paths["/map/changelog"].get.responses["200"].content).toEqual({
    "text/plain": { schema: { type: "string" } },
  });
});

test("Lua excerpt preserves an emoji at the truncation boundary", () => {
  const text = "x".repeat(596) + "😀" + "y".repeat(10);
  const result = spawnSync(
    "lua5.1",
    [
      "-e",
      "local f=assert(loadstring(io.read('*a'))); local env={}; setfenv(f,env); f(); io.write(env.changelog[2]);",
    ],
    {
      input: serializeLuaChangelog({ source: "ai", text }),
      encoding: "utf8",
    },
  );
  expect(result.error).toBeUndefined();
  expect(result.status).toBe(0);
  expect(result.stdout).toBe("x".repeat(596) + "😀...");
  expect(Array.from(result.stdout)).toHaveLength(600);
});

test("single-paragraph prose uses its first sentence as a title without repeating it", () => {
  const sentences = [
    "In Aster Keep, sixteen new rooms were added along with twelve new normal exits.",
    "Worm warp special exits were removed from Central Wilderness and Cyrene Road.",
    "Three rooms in Hashan were renamed to Parallax, The Phaestean Forge, and The Sun's Surface.",
    "Housekeeping updates were applied to the new rooms in Aster Keep.",
  ];
  const result = spawnSync(
    "lua5.1",
    [
      "-e",
      "local env={}; local f=assert(loadstring(io.read('*a'))); setfenv(f,env); f(); for _,v in ipairs(env.changelog) do io.write(v, '\\n') end",
    ],
    {
      input: serializeLuaChangelog({ source: "ai", text: sentences.join(" ") }),
      encoding: "utf8",
    },
  );
  expect(result.error).toBeUndefined();
  expect(result.status).toBe(0);
  expect(result.stdout.trim().split("\n")).toEqual([
    sentences.slice(1).join(" "),
    sentences[0],
  ]);
  const lua = serializeLuaChangelog({
    source: "ai",
    text: sentences.join(" "),
  });
  expect(lua.split("\n").filter((line) => line.startsWith('  "'))).toHaveLength(
    2,
  );
  expect(lua.match(/In Aster Keep/g)).toHaveLength(1);
});

test("one short note appears only once", () => {
  expect(
    serializeLuaChangelog({
      source: "empty",
      text: "No changes from the base map.",
    }),
  ).toBe('changelog = {\n  "No changes from the base map.",\n}\n');
});

test("each nonempty body line gets its own Lua array entry", () => {
  expect(
    serializeLuaChangelog({
      source: "ai",
      text: "New rooms added.\nFirst line. Another sentence on the same line.\r\n\r\nSecond line without punctuation\nFinal update.",
    }),
  ).toBe(
    'changelog = {\n  "First line. Another sentence on the same line.",\n  "Second line without punctuation",\n  "Final update.",\n  "New rooms added.",\n}\n',
  );
});
