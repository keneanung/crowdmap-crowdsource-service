import { app } from "../../src/app";
import { __resetUuidMock } from "../mocks/uuidMock";
import { setupHealthServiceMock, setupUserDbServiceMock } from "./iocSetup";
import { restoreBaselineFiles } from "./configureBaselineFiles";

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
