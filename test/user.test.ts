import { beforeEach, expect, test } from "@jest/globals";
import request from "supertest";
import { app } from "../src/app";
import { setupUserDbServiceMock } from "./iocSetup";

beforeEach(() => {
  setupUserDbServiceMock();
});

test("Should return a 403 if no api token is provided", async () => {
  await request(app)
    .get("/admin/user")
    .expect(403)
    .expect((res) => {
      expect(res.body).toStrictEqual({
        message: "Invalid Token: Access Denied",
      });
    });
});

test("Should return a 403 if wrong api token is provided", async () => {
  await request(app)
    .get("/admin/user")
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
    .get("/admin/user")
    .set("x-api-key", "abc123456")
    .expect(200);
});

test("Should be able to create a new user", async () => {
  await request(app)
    .post("/admin/user")
    .set("x-api-key", "abc123456")
    .send({
      name: "new_user",
      roles: ["map_admin"],
    })
    .expect(201);

  await request(app)
    .get("/admin/user")
    .set("x-api-key", "abc123456")
    .expect(200)
    .expect((res) => {
      expect(res.body).toStrictEqual([
        {
          name: "admin",
          roles: ["site_admin", "map_admin"],
        },
        {
          name: "new_user",
          roles: ["map_admin"],
        },
      ]);
    });
});

test("Should return conflict if trying to create a user that already exists", async () => {
  await request(app)
    .post("/admin/user")
    .set("x-api-key", "abc123456")
    .send({
      name: "admin",
      roles: ["map_admin"],
    })
    .expect(409)
    .expect((res) => {
      expect(res.body).toStrictEqual({
        message: "User already exists",
      });
    });
});

test("Should return authorization error if trying to create a user using an invalid role", async () => {
  let apiKey = "";
  await request(app)
    .post("/admin/user")
    .set("x-api-key", "abc123456")
    .send({
      name: "new_user",
      roles: ["map_admin"],
    })
    .expect(201)
    .then((res) => {
      apiKey = res.body as string;
    });

  await request(app)
    .post("/admin/user")
    .set("x-api-key", apiKey)
    .send({
      name: "another_user",
      roles: ["map_admin"],
    })
    .expect(403)
    .expect((res) => {
      expect(res.body).toStrictEqual({
        message: "Access Denied",
      });
    });
});
