import { expect, test } from "@jest/globals";
import type { Request, Response } from "express";
import { EventEmitter } from "node:events";
import request from "supertest";
import { app } from "../src/app.js";
import {
  mapWorkerCompleted,
  mapWorkerStarted,
  mongoConnectionCheckedIn,
  mongoConnectionCheckedOut,
  mongoConnectionClosed,
  mongoConnectionCreated,
  renderMetrics,
  requestObservability,
} from "../src/observability.js";

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

test("metrics expose bounded request labels and process internals", async () => {
  await request(app).get("/utility/ip").expect(200);
  const response = await request(app).get("/utility/metrics").expect(200);

  expect(response.headers["content-type"]).toContain("text/plain");
  expect(response.text).toContain(
    'crowdmap_http_responses_total{method="GET",status_code="200"}',
  );
  expect(response.text).toContain(
    "crowdmap_http_response_duration_seconds_count",
  );
  expect(response.text).toContain("crowdmap_process_resident_memory_bytes");
  expect(response.text).toContain("crowdmap_process_cpu_seconds_total");
  expect(response.text).toContain("crowdmap_nodejs_event_loop_delay_seconds");
  expect(response.text).toContain('crowdmap_projects{status="ok"}');
  expect(response.text).not.toContain("path=");
});

test("metrics expose map worker and MongoDB driver pool measurements", () => {
  mapWorkerStarted("validate");
  mapWorkerCompleted("validate", 0.25);
  mongoConnectionCreated();
  mongoConnectionCheckedOut(10);
  mongoConnectionCheckedIn();
  mongoConnectionClosed();

  const metrics = renderMetrics();
  expect(metrics).toContain("crowdmap_map_workers_active 0");
  expect(metrics).toContain(
    'crowdmap_map_workers_completed_total{operation="validate"} 1',
  );
  expect(metrics).toContain(
    'crowdmap_map_worker_duration_seconds_sum{operation="validate"} 0.25',
  );
  expect(metrics).toContain("crowdmap_mongo_connections 0");
  expect(metrics).toContain("crowdmap_mongo_connection_checkouts_total 1");
});

test("invalid MongoDB checkout durations are omitted from the summary", () => {
  mongoConnectionCheckedOut(Number.NaN);
  mongoConnectionCheckedIn();

  const metrics = renderMetrics();
  expect(metrics).not.toContain("NaN");
  expect(metrics).not.toContain("Infinity");
});

test("aborted requests do not create a response metric", () => {
  const response = Object.assign(new EventEmitter(), {
    locals: {},
    setHeader: (): void => undefined,
    statusCode: 200,
  }) as unknown as Response;
  const abortedRequest = {
    ip: "127.0.0.1",
    method: "GET",
    originalUrl: "/aborted",
  } as Request;
  const responseCount = (metrics: string): number =>
    Number(
      /crowdmap_http_responses_total\{method="GET",status_code="200"\} (\d+)/u.exec(
        metrics,
      )?.[1] ?? "0",
    );
  const before = responseCount(renderMetrics());

  requestObservability(abortedRequest, response, () => undefined);
  expect(renderMetrics()).toContain("crowdmap_http_requests_active 1");
  response.emit("close");
  response.emit("finish");

  const after = renderMetrics();
  expect(after).toContain("crowdmap_http_requests_active 0");
  expect(responseCount(after)).toBe(before);
});
