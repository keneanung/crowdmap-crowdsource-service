import { expect, test } from "@jest/globals";
import request from "supertest";
import { app } from "../src/app.js";

test("responses include a generated correlation ID", async () => {
  const response = await request(app)
    .get("/utility/ip")
    .set("X-Request-ID", "untrusted-caller-value")
    .expect(200);

  expect(response.headers["x-request-id"]).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u,
  );
  expect(response.headers["x-request-id"]).not.toBe("untrusted-caller-value");
});

test("metrics expose request counters without per-path labels", async () => {
  const response = await request(app).get("/utility/metrics").expect(200);

  expect(response.headers["content-type"]).toContain("text/plain");
  expect(response.text).toContain("crowdmap_http_requests_total");
  expect(response.text).toContain("crowdmap_http_server_errors_total");
  expect(response.text).not.toContain("path=");
});
