import { expect, test } from "@jest/globals";
import { ChangeRoomName } from "../src/models/business/change.js";
import {
  changeBusinessToWorker,
  changeWorkerToBusiness,
} from "../src/models/business/mapWorker.js";

test("worker changes survive structured cloning without using DB models", () => {
  const businessChange = new ChangeRoomName(42, ["reporter"], "A renamed room");

  const transferredChange = structuredClone(
    changeBusinessToWorker(businessChange),
  );
  expect(transferredChange).not.toHaveProperty("apply");

  const restoredChange = changeWorkerToBusiness(transferredChange);
  expect(restoredChange).toBeInstanceOf(ChangeRoomName);
  expect(typeof restoredChange.apply).toBe("function");
  expect(Array.from(restoredChange.reporters)).toEqual(["reporter"]);
});
