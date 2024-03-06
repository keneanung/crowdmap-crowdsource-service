import { beforeEach, expect, test } from "@jest/globals";
import request from "supertest";
import { app } from "../src/app";
import { setupUserDbServiceMock } from "./setup/iocSetup";

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

test("Should return a 403 if a user with an invalid role tries to access the user list", async () => {
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
    .get("/admin/user")
    .set("x-api-key", apiKey)
    .expect(403)
    .expect((res) => {
      expect(res.body).toStrictEqual({
        message: "Access Denied",
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

test("Should return the users' own info when accessing the me endpoint", async () => {
  await request(app)
    .get("/admin/user/me")
    .set("x-api-key", "abc123456")
    .expect(200)
    .expect((res) => {
      expect(res.body).toStrictEqual({
        name: "admin",
        roles: ["site_admin", "map_admin"],
      });
    });
});

test("Should be able to update the API key of own user", async () => {
  // Arrange: create non-admin user we can change the key for
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

  // Act: update the API key
  let newApiKey = "";
  await request(app)
    .put("/admin/user/me/api-key")
    .set("x-api-key", apiKey)
    .expect(200)
    .then((res) => {
      newApiKey = res.body as string;
    });

  //Assert: check if API keys are different
  expect(newApiKey).not.toEqual(apiKey);
  // Assert: check if we can use the new API key to access the me endpoint
  await request(app)
    .get("/admin/user/me")
    .set("x-api-key", newApiKey)
    .expect(200)
    .expect((res) => {
      expect(res.body).toStrictEqual({
        name: "new_user",
        roles: ["map_admin"],
      });
    });
});

test("Should be able to update the API key of other user as admin", async () => {
  // Arrange: create non-admin user we can change the key for
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

  // Act: update the API key
  let newApiKey = "";
  await request(app)
    .put("/admin/user/new_user/api-key")
    .set("x-api-key", "abc123456")
    .expect(200)
    .then((res) => {
      newApiKey = res.body as string;
    });

  //Assert: check if API keys are different
  expect(newApiKey).not.toEqual(apiKey);
  // Assert: check if we can use the new API key to access the me endpoint
  await request(app)
    .get("/admin/user/me")
    .set("x-api-key", newApiKey)
    .expect(200)
    .expect((res) => {
      expect(res.body).toStrictEqual({
        name: "new_user",
        roles: ["map_admin"],
      });
    });
});

test("Should get a not found when update the API key of non-existing user as admin", async () => {
  await request(app)
    .put("/admin/user/new_user/api-key")
    .set("x-api-key", "abc123456")
    .expect(404);
});

test("Should not be allowed to change api key for other user if not site_admin", async () => {
  // Arrange: create two users
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
    .set("x-api-key", "abc123456")
    .send({
      name: "new_user2",
      roles: ["map_admin"],
    })
    .expect(201);

  // Act: try to update the API key
  await request(app)
    .put("/admin/user/new_user2/api-key")
    .set("x-api-key", apiKey)
    .expect(403)
    .then((res) => {
      expect(res.body).toStrictEqual({
        message: "Access Denied",
      });
    });
});
