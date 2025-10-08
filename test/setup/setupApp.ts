import { app } from "../../src/app";
import { __resetUuidMock } from "../mocks/uuidMock";
import { setupUserDbServiceMock } from "./iocSetup";

// Ensure TypeScript knows Jest globals in case ts-jest doesn't auto-inject types
declare const beforeEach: (fn: () => void) => void;

app;
setupUserDbServiceMock();

try {
  beforeEach(() => {
    __resetUuidMock();
  });
} catch {
  // If beforeEach is not defined (unlikely in Jest setupFilesAfterEnv), ignore.
}
