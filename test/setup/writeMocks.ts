import { jest } from "@jest/globals";
import { WriteMemory } from "../mocks/memoryWritable";

export const writeMocks: Record<string, WriteMemory> = {};
jest.mock("fs", () => {
  const originalModule = jest.requireActual<typeof import("fs")>("fs");
  return {
    ...originalModule,
    promises: {
      ...originalModule.promises,
      mkdir: jest.fn(async () => Promise.resolve()),
      rename: jest.fn(async (source: string, destination: string) => {
        writeMocks[destination] = writeMocks[source];
        Reflect.deleteProperty(writeMocks, source);
        return Promise.resolve();
      }),
      rm: jest.fn(async () => Promise.resolve()),
    },
    createWriteStream: jest.fn((destination: string) => {
      writeMocks[destination] = new WriteMemory();
      return writeMocks[destination];
    }),
  };
});
