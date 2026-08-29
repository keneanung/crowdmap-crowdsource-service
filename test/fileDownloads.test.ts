import { expect, test } from "@jest/globals";
import { config } from "../src/config/values";
import { downloadMapVersion } from "../src/fileDownloads";
import { fetchMock } from "./setup/mockFetch";
import { writeMocks } from "./setup/writeMocks";

test("downloads finish before the destination becomes available", async () => {
  await downloadMapVersion();

  expect(writeMocks[config.versionFile].buffer).toEqual("467");
});

test("rejects unsuccessful download responses without replacing the file", async () => {
  fetchMock.mockResolvedValueOnce(new Response("failure", { status: 503 }));
  const previousFile = writeMocks[config.versionFile];

  await expect(downloadMapVersion()).rejects.toThrow(
    "Failed to download version file",
  );
  expect(writeMocks[config.versionFile]).toBe(previousFile);
});
