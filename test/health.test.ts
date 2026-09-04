import { expect, test } from "@jest/globals";
import request from "supertest";
import { app } from "../src/app";

test("readiness endpoint reports success", async () => {
  await request(app)
    .get("/utility/healthcheck")
    .expect(200)
    .expect((response) => {
      expect(response.body).toEqual({ status: "ok" });
    });
});
