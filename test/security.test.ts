import { beforeEach, expect, test } from "@jest/globals";
import request from "supertest";
import { app } from "../src/app";
import { setupUserDbServiceMock } from "./iocSetup";

beforeEach(() => {
  setupUserDbServiceMock();
})

test("Should return a 403 if no api token is provided", async () => {
  await request(app)
    .get("/admin/users")
    .expect(403)
    .expect((res) => {
      expect(res.body).toStrictEqual({
        message: "Invalid Token: Access Denied",
      });
    });
});

test("Should return a 403 if wrong api token is provided", async () => {
  await request(app)
    .get("/admin/users")
    .set("x-api-key", "wrong-token")
    .expect(403)
    .expect((res) => {
      expect(res.body).toStrictEqual({
        message: "Invalid Token: Access Denied",
      });
    });
});

test("Should return a 200 if correct api token is provided", async () => {
  await request(app)
    .get("/admin/users")
    .set("x-api-key", "abc123456")
    .expect(200);
});
