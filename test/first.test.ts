import { expect, test } from "@jest/globals";
import request from "supertest";
import { app } from "../src/app";
import { iocContainer } from "../src/ioc/ioc";
import { ChangeService } from "../src/services/changeService";
import { MockChangeService } from "./mockChangeService";

test("getChanges returns empty array when no changes", async () => {
  iocContainer.rebind<ChangeService>(ChangeService).to(MockChangeService);
  await request(app)
    .get("/change")
    .expect(200)
    .expect((res) => {
      expect(res.body).toEqual([]);
    });
});
