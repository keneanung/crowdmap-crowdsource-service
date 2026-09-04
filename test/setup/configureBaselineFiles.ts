import { copyFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const fixtureMap = path.join(currentDirectory, "baselineFiles", "map");
const fixtureVersion = path.join(currentDirectory, "baselineFiles", "version");
const testDirectory = mkdtempSync(path.join(tmpdir(), "crowdmap-tests-"));
const testMap = path.join(testDirectory, "map");
const testVersion = path.join(testDirectory, "version");

process.env.MAP_FILE = testMap;
process.env.VERSION_FILE = testVersion;

export const restoreBaselineFiles = (): void => {
  copyFileSync(fixtureMap, testMap);
  copyFileSync(fixtureVersion, testVersion);
};

restoreBaselineFiles();
process.on("exit", () => {
  rmSync(testDirectory, { recursive: true, force: true });
});
