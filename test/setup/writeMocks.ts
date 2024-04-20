import { jest } from "@jest/globals";
import { WriteMemory } from "../mocks/memoryWritable";

export const writeMocks: Record<string, WriteMemory> = {};
jest.mock("fs", () => {
  const originalModule = jest.requireActual("fs");
  if (typeof originalModule !== "object") {
    throw new Error("Original module is not an object");
  }
  return {
    ...originalModule,
    createWriteStream: jest.fn((destination: string) => {
      writeMocks[destination] = new WriteMemory();
      return writeMocks[destination];
    }),
  };
});
