import { expect, test } from "@jest/globals";
import { config, validateConfig } from "../src/config/values";

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

test("accepts a complete service configuration", () => {
  expect(() => {
    validateConfig(validConfig);
  }).not.toThrow();
});
