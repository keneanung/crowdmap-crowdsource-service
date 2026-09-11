import { afterEach, expect, jest, test } from "@jest/globals";
import request from "supertest";
import { app } from "../src/app.js";
import { iocContainer } from "../src/ioc/ioc.js";
import { HealthService } from "../src/services/healthService.js";
import { setupHealthServiceMock } from "./setup/iocSetup.js";

afterEach(() => {
  setupHealthServiceMock();
});

test("readiness endpoint reports success", async () => {
  await request(app)
    .get("/utility/healthcheck")
    .expect(200)
    .expect((response) => {
      expect(response.body).toEqual({ status: "ok" });
    });
});

test("status reports readiness failures as unavailable", async () => {
  iocContainer.rebindSync<HealthService>(HealthService).toConstantValue({
    checkReadiness: jest.fn(() =>
      Promise.reject(new Error("Mongo unavailable")),
    ),
    getProjectStatuses: jest.fn(() => Promise.resolve([])),
  });

  await request(app)
    .get("/utility/status")
    .expect(503)
    .expect({ message: "Service is not ready" });
});
