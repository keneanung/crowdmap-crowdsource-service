import { app } from "../../src/app.js";
import { __resetUuidMock } from "../mocks/uuidMock.js";
import { restoreBaselineFiles } from "./configureBaselineFiles.js";
import { setupHealthServiceMock, setupUserDbServiceMock } from "./iocSetup.js";

// Ensure TypeScript knows Jest globals in case ts-jest doesn't auto-inject types
declare const beforeEach: (fn: () => void) => void;

// eslint-disable-next-line @typescript-eslint/no-unused-expressions
app;
setupUserDbServiceMock();
setupHealthServiceMock();

try {
  beforeEach(() => {
    __resetUuidMock();
    restoreBaselineFiles();
  });
} catch {
  // If beforeEach is not defined (unlikely in Jest setupFilesAfterEnv), ignore.
}
