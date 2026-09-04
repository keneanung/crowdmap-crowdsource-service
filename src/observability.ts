import { Request, RequestHandler, Response } from "express";
import { randomUUID } from "node:crypto";

type LogLevel = "error" | "info" | "warn";
type LogFields = Record<string, unknown>;

let activeRequests = 0;
let completedRequests = 0;
let serverErrors = 0;
let requestDurationSeconds = 0;

const serializeError = (error: Error): LogFields => ({
  errorName: error.name,
  errorMessage: error.message,
  errorStack: error.stack,
});

export const log = (
  level: LogLevel,
  message: string,
  fields: LogFields = {},
): void => {
  const serializedFields = Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [
      key,
      value instanceof Error ? serializeError(value) : value,
    ]),
  );
  const line = `${JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...serializedFields,
  })}\n`;
  (level === "error" ? process.stderr : process.stdout).write(line);
};

const requestPath = (request: Request): string =>
  request.originalUrl.split("?", 1)[0] ?? request.path;

export const requestObservability: RequestHandler = (
  request: Request,
  response: Response,
  next,
): void => {
  const requestId = randomUUID();
  const start = process.hrtime.bigint();
  let recorded = false;
  activeRequests += 1;
  response.locals.requestId = requestId;
  response.setHeader("X-Request-ID", requestId);

  const recordCompletion = (): void => {
    if (recorded) {
      return;
    }
    recorded = true;
    activeRequests -= 1;
    completedRequests += 1;
    if (response.statusCode >= 500) {
      serverErrors += 1;
    }
    const durationSeconds = Number(process.hrtime.bigint() - start) / 1e9;
    requestDurationSeconds += durationSeconds;
    log("info", "http_request_completed", {
      requestId,
      method: request.method,
      path: requestPath(request),
      statusCode: response.statusCode,
      durationMs: Math.round(durationSeconds * 1000),
      remoteAddress: request.ip,
    });
  };

  response.once("finish", recordCompletion);
  response.once("close", recordCompletion);
  next();
};

export const getRequestId = (response: Response): string | undefined => {
  const requestId: unknown = response.locals.requestId;
  return typeof requestId === "string" ? requestId : undefined;
};

export const renderMetrics = (): string =>
  [
    "# HELP crowdmap_http_requests_active Current HTTP requests.",
    "# TYPE crowdmap_http_requests_active gauge",
    `crowdmap_http_requests_active ${activeRequests.toString()}`,
    "# HELP crowdmap_http_requests_total Completed HTTP requests.",
    "# TYPE crowdmap_http_requests_total counter",
    `crowdmap_http_requests_total ${completedRequests.toString()}`,
    "# HELP crowdmap_http_server_errors_total Completed HTTP requests with a 5xx response.",
    "# TYPE crowdmap_http_server_errors_total counter",
    `crowdmap_http_server_errors_total ${serverErrors.toString()}`,
    "# HELP crowdmap_http_request_duration_seconds_sum Cumulative HTTP request duration.",
    "# TYPE crowdmap_http_request_duration_seconds_sum counter",
    `crowdmap_http_request_duration_seconds_sum ${requestDurationSeconds.toString()}`,
    "# HELP crowdmap_process_uptime_seconds Process uptime.",
    "# TYPE crowdmap_process_uptime_seconds gauge",
    `crowdmap_process_uptime_seconds ${process.uptime().toString()}`,
    "",
  ].join("\n");
