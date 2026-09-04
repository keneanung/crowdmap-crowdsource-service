import { expect, test } from "@jest/globals";
import { config, validateConfig } from "../src/config/values.js";

const validConfig = {
  ...config,
  connectionString: "mongodb://mongo:27017",
  dbName: "crowdmap",
};

test("rejects invalid ports and proxy trust values", () => {
  expect(() => {
    validateConfig({ ...validConfig, port: 0 });
  }).toThrow("PORT");
  expect(() => {
    validateConfig({ ...validConfig, trustProxy: Number.NaN });
  }).toThrow("TRUST_PROXY");
});

test("requires MongoDB configuration", () => {
  expect(() => {
    validateConfig({ ...validConfig, connectionString: undefined });
  }).toThrow("MONGO_CONNECTION_STRING");
  expect(() => {
    validateConfig({ ...validConfig, dbName: undefined });
  }).toThrow("MONGO_DB_NAME");
});

test.each([
  ["MAP_DOWNLOAD_URL", { mapDownloadUrl: "not a URL" }],
  ["VERSION_DOWNLOAD_URL", { versionDownloadUrl: "not a URL" }],
])("identifies an invalid %s", (name, update) => {
  expect(() => {
    validateConfig({ ...validConfig, ...update });
  }).toThrow(`${name} must be a valid URL`);
});

test("rejects non-HTTP download URLs with a targeted error", () => {
  expect(() => {
    validateConfig({ ...validConfig, mapDownloadUrl: "file:///tmp/map" });
  }).toThrow("MAP_DOWNLOAD_URL must use HTTP or HTTPS");
});

test("accepts a complete service configuration", () => {
  expect(() => {
    validateConfig(validConfig);
  }).not.toThrow();
});
