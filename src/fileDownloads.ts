import * as fs from "fs";
import * as path from "node:path";
import { randomUUID } from "node:crypto";
import { Readable } from "stream";
import { pipeline } from "node:stream/promises";
import { config } from "./config/values";

const DOWNLOAD_TIMEOUT_MS = 30_000;

export const downloadMapVersion = async (
  destination: string = config.versionFile,
) => {
  try {
    await downloadFile(config.versionDownloadUrl, destination);
  } catch (err) {
    throw Error("Failed to download version file", {
      cause: err,
    });
  }
};

export const downloadMapFile = async (destination: string = config.mapFile) => {
  try {
    await downloadFile(config.mapDownloadUrl, destination);
  } catch (err) {
    throw Error("Failed to download map file", {
      cause: err,
    });
  }
};

const downloadFile = async (source: string, destination: string) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, DOWNLOAD_TIMEOUT_MS);
  const temporaryFile = `${destination}.${randomUUID()}.tmp`;

  try {
    const res = await fetch(source, { signal: controller.signal });
    if (!res.ok) {
      throw Error(`Download returned HTTP ${res.status.toString()}`);
    }
    if (res.body === null) {
      throw Error("Download returned no body");
    }

    await fs.promises.mkdir(path.dirname(destination), { recursive: true });
    await pipeline(
      Readable.fromWeb(res.body),
      fs.createWriteStream(temporaryFile, { flags: "wx" }),
    );
    await fs.promises.rename(temporaryFile, destination);
  } finally {
    clearTimeout(timeout);
    await fs.promises.rm(temporaryFile, { force: true });
  }
};
