import { expect, test } from "@jest/globals";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  config,
  loadConfig,
  type ServiceConfig,
  validateConfig,
} from "../src/config/values.js";

const validConfig: ServiceConfig = {
  ...config,
  connectionString: "mongodb://mongo:27017",
  dbName: "crowdmap",
  privacyControllerName: "Example controller",
  privacyContactUrl: "https://example.test/privacy",
  privacyLogRetention: "30 days",
  privacyProcessorsAndTransfers:
    "Hosted in the EEA; no transfers outside the EEA.",
};

test("loads nested YAML and normalizes absolute baseline paths", async () => {
  const directory = await mkdtemp(join(tmpdir(), "crowdmap-config-test-"));
  const configFile = join(directory, "service.yaml");
  await writeFile(
    configFile,
    `platform:
  mongo:
    connectionString: mongodb://mongo:27017
    database: crowdmap
  privacy:
    controllerName: Example controller
    contactUrl: https://example.test/privacy
    logRetention: 30 days
    processorsAndTransfers: Test environment
projects:
  resolver: single
  definitions:
    - id: example
      name: Example map
      baseline:
        mapFile: ${directory}/data/../data/map
        versionFile: ${directory}/data/../data/version
      upstream:
        mapUrl: https://example.test/map
        versionUrl: https://example.test/version
`,
  );

  const loaded = loadConfig(configFile);
  expect(loaded.projects[0]).toMatchObject({
    id: "example",
    mapFile: join(directory, "data/map"),
    versionFile: join(directory, "data/version"),
  });
});

test("rejects relative baseline paths", () => {
  expect(() => {
    validateConfig({
      ...validConfig,
      projects: [{ ...validConfig.projects[0], mapFile: "data/map" }],
    });
  }).toThrow("baseline file paths must be absolute");
});

test("requires every project to have a host mapping in host mode", () => {
  const secondProject = {
    ...validConfig.projects[0],
    id: "second",
    mapFile: "/opt/data/second/map",
    versionFile: "/opt/data/second/version",
  };
  expect(() => {
    validateConfig({
      ...validConfig,
      projectResolver: "host",
      platformHost: "maps.example.test",
      projects: [...validConfig.projects, secondProject],
      hostProjectMap: { "first.example.test": validConfig.projects[0].id },
    });
  }).toThrow("Project second has no projects.hosts mapping");
});

test.each([
  ["projects.resolver", "projects:\n  resolver: invalid\n  definitions: []\n"],
  [
    "platform.port",
    "platform:\n  port: three-thousand\nprojects:\n  definitions: []\n",
  ],
  [
    "projects.hosts",
    "projects:\n  resolver: host\n  hosts: invalid\n  definitions: []\n",
  ],
])("rejects an invalid YAML value for %s", async (name, contents) => {
  const directory = await mkdtemp(join(tmpdir(), "crowdmap-config-test-"));
  const configFile = join(directory, "service.yaml");
  await writeFile(configFile, contents);
  expect(() => loadConfig(configFile)).toThrow(name);
});

test("rejects invalid ports and proxy trust values", () => {
  expect(() => {
    validateConfig({ ...validConfig, port: 0 });
  }).toThrow("platform.port");
  expect(() => {
    validateConfig({ ...validConfig, trustProxy: Number.NaN });
  }).toThrow("platform.trustProxy");
});

test("requires MongoDB configuration", () => {
  expect(() => {
    validateConfig({ ...validConfig, connectionString: undefined });
  }).toThrow("platform.mongo.connectionString");
  expect(() => {
    validateConfig({ ...validConfig, dbName: undefined });
  }).toThrow("platform.mongo.database");
});

test.each([
  ["privacyControllerName", undefined],
  ["privacyContactUrl", undefined],
  ["privacyLogRetention", undefined],
  ["privacyProcessorsAndTransfers", undefined],
] as const)("requires %s", (key, value) => {
  expect(() => {
    validateConfig({ ...validConfig, [key]: value });
  }).toThrow("platform.privacy");
});

test.each([
  ["mapUrl", { mapDownloadUrl: "not a URL" }],
  ["versionUrl", { versionDownloadUrl: "not a URL" }],
] as const)("identifies an invalid upstream %s", (name, update) => {
  expect(() => {
    validateConfig({
      ...validConfig,
      projects: [{ ...validConfig.projects[0], ...update }],
    });
  }).toThrow(`upstream.${name} must be a valid URL`);
});

test("rejects non-HTTP download URLs with a targeted error", () => {
  expect(() => {
    validateConfig({
      ...validConfig,
      projects: [
        { ...validConfig.projects[0], mapDownloadUrl: "file:///tmp/map" },
      ],
    });
  }).toThrow("upstream.mapUrl must use HTTP or HTTPS");
});

test.each(["mailto:", "mailto:?subject=privacy"])(
  "rejects an empty mailto privacy contact URL: %s",
  (privacyContactUrl) => {
    expect(() => {
      validateConfig({ ...validConfig, privacyContactUrl });
    }).toThrow("mailto address");
  },
);

test("accepts a complete service configuration", () => {
  expect(() => {
    validateConfig(validConfig);
  }).not.toThrow();
});

test("requires a complete valid Ko-fi configuration when sponsorship is enabled", () => {
  expect(() => {
    validateConfig({
      ...validConfig,
      kofiProfileUrl: "https://ko-fi.com/crowdmap",
    });
  }).toThrow("platform.sponsorship.monthlyGoal");
  expect(() => {
    validateConfig({
      ...validConfig,
      kofiProfileUrl: "https://example.com/crowdmap",
      kofiMonthlyGoal: 20,
      kofiWebhookToken: "secret",
    });
  }).toThrow("platform.sponsorship.profileUrl");
  expect(() => {
    validateConfig({
      ...validConfig,
      kofiProfileUrl: "https://ko-fi.com/crowdmap",
      kofiMonthlyGoal: 20,
      kofiWebhookToken: "secret",
      kofiCurrency: "EUR",
    });
  }).not.toThrow();
});
