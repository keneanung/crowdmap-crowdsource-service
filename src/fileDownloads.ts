import * as fs from "fs";
import { randomUUID } from "node:crypto";
import * as path from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "stream";
import { config, type MapProject } from "./config/values.js";

const DOWNLOAD_TIMEOUT_MS = 30_000;

export const downloadMapVersion = async (
  projectOrDestination?: MapProject | string,
  explicitDestination?: string,
) => {
  const project =
    typeof projectOrDestination === "object"
      ? projectOrDestination
      : config.projects[0];
  const destination =
    explicitDestination ??
    (typeof projectOrDestination === "string"
      ? projectOrDestination
      : project.versionFile);
  try {
    await downloadFile(project.versionDownloadUrl, destination);
  } catch (err) {
    throw Error("Failed to download version file", {
      cause: err,
    });
  }
};

export const downloadMapFile = async (
  projectOrDestination?: MapProject | string,
  explicitDestination?: string,
) => {
  const project =
    typeof projectOrDestination === "object"
      ? projectOrDestination
      : config.projects[0];
  const destination =
    explicitDestination ??
    (typeof projectOrDestination === "string"
      ? projectOrDestination
      : project.mapFile);
  try {
    await downloadFile(project.mapDownloadUrl, destination);
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
