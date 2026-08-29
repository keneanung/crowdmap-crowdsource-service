import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({quiet: true});

export interface ServiceConfig {
  port: number;
  mapFile: string;
  mapDownloadUrl: string;
  versionFile: string;
  versionDownloadUrl: string;
  connectionString?: string;
  dbName?: string;
  trustProxy: number;
}

export const config: ServiceConfig = {
  port: Number(process.env.PORT ?? 3000),
  mapFile: process.env.MAP_FILE ?? path.join(process.cwd(), "map"),
  mapDownloadUrl:
    process.env.MAP_DOWNLOAD_URL ??
    "https://ire-mudlet-mapping.github.io/AchaeaCrowdmap/Map/map",
  versionFile: process.env.VERSION_FILE ?? path.join(process.cwd(), "version"),
  versionDownloadUrl:
    process.env.VERSION_DOWNLOAD_URL ??
    "https://ire-mudlet-mapping.github.io/AchaeaCrowdmap/Map/version.txt",
  connectionString: process.env.MONGO_CONNECTION_STRING,
  dbName: process.env.MONGO_DB_NAME,
  trustProxy: Number(process.env.TRUST_PROXY ?? 0),
};

export const validateConfig = (values: ServiceConfig = config): void => {
  if (!Number.isInteger(values.port) || values.port < 1 || values.port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }
  if (!Number.isInteger(values.trustProxy) || values.trustProxy < 0) {
    throw new Error("TRUST_PROXY must be a non-negative integer");
  }
  if (!values.connectionString) {
    throw new Error("MONGO_CONNECTION_STRING is required");
  }
  if (!values.dbName) {
    throw new Error("MONGO_DB_NAME is required");
  }
  for (const [name, value] of [
    ["MAP_DOWNLOAD_URL", values.mapDownloadUrl],
    ["VERSION_DOWNLOAD_URL", values.versionDownloadUrl],
  ]) {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error(`${name} must use HTTP or HTTPS`);
    }
  }
};
