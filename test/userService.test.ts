import { expect, jest, test } from "@jest/globals";
import { config } from "../src/config/values.js";
import { UserService } from "../src/services/userService.js";
import { MockUserDbService } from "./mocks/mockUserDbService.js";

test("generated API keys use a public ID for indexed lookup", async () => {
  const userDbService = new MockUserDbService();
  const lookup = jest.spyOn(userDbService, "getUserByApiKeyId");
  const userService = new UserService(userDbService);

  const apiKey = await userService.createUser("indexed-user", ["map_admin"]);
  const separator = apiKey.indexOf(".");
  const apiKeyId = apiKey.slice(0, separator);
  const secret = apiKey.slice(separator + 1);

  expect(apiKeyId).toMatch(
    /^cm1_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  );
  expect(secret).toMatch(/^[A-Za-z0-9_-]{43}$/);
  await expect(userService.getUserByApiKey(apiKey)).resolves.toMatchObject({
    name: "indexed-user",
  });
  expect(lookup).toHaveBeenCalledWith(apiKeyId);
});

test("an indexed API key rejects the wrong secret", async () => {
  const userService = new UserService(new MockUserDbService());
  const apiKey = await userService.createUser("indexed-user", ["map_admin"]);
  const separator = apiKey.indexOf(".");
  const apiKeyId = apiKey.slice(0, separator);

  await expect(
    userService.getUserByApiKey(`${apiKeyId}.wrong-secret`),
  ).resolves.toBeUndefined();
});

test("new users require a compound API key", async () => {
  const userService = new UserService(new MockUserDbService());

  await expect(
    userService.addUser("invalid-key-user", "user-chosen-password", []),
  ).rejects.toThrow("API key must use the cm1_<key-id>.<secret> format");
});

test("multi-project map administrators require an explicit assignment", async () => {
  const originalProjects = config.projects;
  config.projects = [
    originalProjects[0],
    { ...originalProjects[0], id: "second" },
  ];
  try {
    const userService = new UserService(new MockUserDbService());
    await expect(
      userService.createUser("unassigned-admin", ["map_admin"]),
    ).rejects.toThrow("mapAdminProjects is required");
    expect(() =>
      userService.updateRoles("unassigned-admin", ["map_admin"]),
    ).toThrow("mapAdminProjects is required");
    await expect(
      userService.createUser("revoked-admin", ["map_admin"], []),
    ).resolves.toMatch(/^cm1_/u);
  } finally {
    config.projects = originalProjects;
  }
});
