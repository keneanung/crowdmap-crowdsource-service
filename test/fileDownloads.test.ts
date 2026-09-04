import { expect, test } from "@jest/globals";
import { readFile } from "node:fs/promises";
import { config } from "../src/config/values.js";
import { downloadMapVersion } from "../src/fileDownloads.js";
import { fetchMock } from "./setup/mockFetch.js";

test("downloads finish before the destination becomes available", async () => {
  await downloadMapVersion();

  expect(await readFile(config.versionFile, "utf8")).toEqual("467");
});

test("rejects unsuccessful download responses without replacing the file", async () => {
  fetchMock.mockResolvedValueOnce(new Response("failure", { status: 503 }));
  const previousFile = await readFile(config.versionFile);

  await expect(downloadMapVersion()).rejects.toThrow(
    "Failed to download version file",
  );
  expect(await readFile(config.versionFile)).toEqual(previousFile);
});
