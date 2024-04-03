import { beforeEach, expect, test } from "@jest/globals";
import request from "supertest";
import { app } from "../src/app";
import { setupChangeServiceMock } from "./setup/iocSetup";

beforeEach(() => {
  setupChangeServiceMock();
});

test("applyChange returns a conflict error, when the version does not match the current server map version", async () => {
  await request(app)
    .post("/change/apply")
    .set("x-api-key", "abc123456")
    .send({
      version: "255"
    })
    .expect(409)
    .expect((res) => {
      expect(res.body).toEqual({
        message: "The map version provided does not match the current map version",
      });
    });
});

test("applyChange return an unauthorized error when no api token is provided", async () => {
  await request(app)
    .post("/change/apply")
    .send({
      version: "466"
    })
    .expect(403)
    .expect((res) => {
      expect(res.body).toEqual({
        message: "Invalid Token: Access Denied",
      });
    });
});

test("applyChange returns an unauthorized error when an invalid api token is provided", async () => {
  await request(app)
    .post("/change/apply")
    .set("x-api-key", "wrong-token")
    .send({
      version: "466"
    })
    .expect(403)
    .expect((res) => {
      expect(res.body).toEqual({
        message: "Invalid Token: Access Denied",
      });
    });
});

test("applyChange returns an unauthorized error when a user with an invalid role tries to apply a change", async () => {
  let apiKey = "";
  await request(app)
    .post("/admin/user")
    .set("x-api-key", "abc123456")
    .send({
      name: "new_user",
      roles: [],
    })
    .expect(201)
    .then((res) => {
      apiKey = res.body as string;
    });

  await request(app)
    .post("/change/apply")
    .set("x-api-key", apiKey)
    .send({
      version: "466"
    })
    .expect(403)
    .expect((res) => {
      expect(res.body).toEqual({
        message: "Access Denied",
      });
    });
});