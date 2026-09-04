import { jest } from "@jest/globals";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const baselineMap = readFileSync(
  join(currentDirectory, "baselineFiles", "map"),
);

export const fetchMock = jest.fn(async (input: string | URL | Request) => {
  const url = input instanceof Request ? input.url : input.toString();
  const body = url.includes("version") ? "467" : baselineMap;
  return Promise.resolve(new Response(body, { status: 200 }));
});

global.fetch = fetchMock;
