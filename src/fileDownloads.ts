import * as fs from "fs";
import { Readable } from "stream";
import { config } from "./config/values";

export const downloadMapVersion = async () => {
  try {
    await downloadFile(config.versionDownloadUrl, config.versionFile);
  } catch (err) {
    throw Error("Failed to download version file", {
      cause: err,
    });
  }
};

export const downloadMapFile = async () => {
  try {
    await downloadFile(config.mapDownloadUrl, config.mapFile);
  } catch (err) {
    throw Error("Failed to download map file", {
      cause: err,
    });
  }
};

const downloadFile = async (source: string, destination: string) => {
  const res = await fetch(source);

  const fileStream = fs.createWriteStream(destination);
  if (res.body === null) {
    throw Error("No body");
  }
  const readable = Readable.fromWeb(res.body);
  readable.on("error", (err) => {
    console.error(err);
    throw Error("Failed to download file", {
      cause: err,
    });
  });
  readable.pipe(fileStream);
};
