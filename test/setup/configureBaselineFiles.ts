import { copyFileSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { stringify } from "yaml";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const fixtureMap = path.join(currentDirectory, "baselineFiles", "map");
const fixtureVersion = path.join(currentDirectory, "baselineFiles", "version");
const testDirectory = mkdtempSync(path.join(tmpdir(), "crowdmap-tests-"));
const testMap = path.join(testDirectory, "map");
const testVersion = path.join(testDirectory, "version");

const testConfig = path.join(testDirectory, "config.yaml");
writeFileSync(
  testConfig,
  stringify({
    platform: {
      port: 3000,
      trustProxy: 0,
      mongo: { connectionString: "mongodb://test", database: "crowdmap-test" },
      privacy: {
        controllerName: "Test controller",
        contactUrl: "https://example.test/privacy",
        logRetention: "30 days",
        processorsAndTransfers: "Test environment",
      },
    },
    projects: {
      resolver: "single",
      definitions: [
        {
          id: "default",
          name: "Test map",
          baseline: { mapFile: testMap, versionFile: testVersion },
          upstream: {
            mapUrl: "https://example.test/map",
            versionUrl: "https://example.test/version",
          },
        },
      ],
    },
  }),
);
process.env.CONFIG_FILE = testConfig;

export const restoreBaselineFiles = (): void => {
  copyFileSync(fixtureMap, testMap);
  copyFileSync(fixtureVersion, testVersion);
};

restoreBaselineFiles();
process.on("exit", () => {
  rmSync(testDirectory, { recursive: true, force: true });
});
