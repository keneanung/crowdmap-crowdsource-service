import { jest } from "@jest/globals";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const baselineMap = readFileSync(join(__dirname, "baselineFiles", "map"));

global.fetch = jest.fn(async (input: string | URL | Request) => {
  const url = input instanceof Request ? input.url : input.toString();
  const body = url.includes("version") ? "467" : baselineMap;
  return Promise.resolve(new Response(body, { status: 200 }));
});
