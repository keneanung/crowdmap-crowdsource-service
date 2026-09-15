import { Request, RequestHandler, Response } from "express";
import { randomUUID } from "node:crypto";
import { monitorEventLoopDelay, performance } from "node:perf_hooks";

type LogLevel = "error" | "info" | "warn";
type LogFields = Record<string, unknown>;
type ProjectStatus = "ok" | "unavailable";
type WorkerOperation =
  "binary" | "json" | "reconcile" | "renderer" | "validate";
type MongoConnectionId = number | "<monitor>";

interface RequestMetrics {
  completed: number;
  durationSeconds: number;
}

interface WorkerMetrics {
  completed: number;
  durationSeconds: number;
  failed: number;
  started: number;
}

interface ProjectStatusProvider {
  getProjectStatuses(): Promise<{ status: ProjectStatus }[]>;
}

let activeRequests = 0;
let completedRequests = 0;
let serverErrors = 0;
let requestDurationSeconds = 0;
const requestMetrics = new Map<string, RequestMetrics>();
let activeWorkers = 0;
const workerMetrics = new Map<WorkerOperation, WorkerMetrics>();
let mongoConnections = 0;
const mongoConnectionsCheckedOut = new Set<string>();
let mongoConnectionCheckouts = 0;
let mongoConnectionCheckoutFailures = 0;
let mongoConnectionCheckoutDurationSeconds = 0;
let mongoConnectionCheckoutDurations = 0;
const eventLoopDelay = monitorEventLoopDelay({ resolution: 20 });
eventLoopDelay.enable();

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

const httpMethods = new Set([
  "DELETE",
  "GET",
  "HEAD",
  "OPTIONS",
  "PATCH",
  "POST",
  "PUT",
]);

const requestKey = (method: string, statusCode: number): string =>
  `${httpMethods.has(method.toUpperCase()) ? method.toUpperCase() : "OTHER"}\u0000${statusCode.toString()}`;

const requestLabels = (
  key: string,
): { method: string; status_code: string } => {
  const [method, statusCode] = key.split("\u0000");
  return { method, status_code: statusCode };
};

const renderLabels = (labels: Record<string, string>): string =>
  `{${Object.entries(labels)
    .map(([key, value]) => `${key}="${value}"`)
    .join(",")}}`;

const secondsFromNanoseconds = (nanoseconds: number): number =>
  nanoseconds / 1e9;

const finiteValue = (value: number): number =>
  Number.isFinite(value) ? value : 0;

const workerMetric = (operation: WorkerOperation): WorkerMetrics => {
  let metrics = workerMetrics.get(operation);
  if (!metrics) {
    metrics = { completed: 0, durationSeconds: 0, failed: 0, started: 0 };
    workerMetrics.set(operation, metrics);
  }
  return metrics;
};

export const requestObservability: RequestHandler = (
  request: Request,
  response: Response,
  next,
): void => {
  const requestId = randomUUID();
  const start = process.hrtime.bigint();
  let active = true;
  let finished = false;
  activeRequests += 1;
  response.locals.requestId = requestId;
  response.setHeader("X-Request-ID", requestId);

  const durationSeconds = (): number =>
    Number(process.hrtime.bigint() - start) / 1e9;
  const releaseRequest = (): void => {
    if (!active) {
      return;
    }
    active = false;
    activeRequests -= 1;
  };
  const recordCompletion = (): void => {
    if (finished) return;
    finished = true;
    releaseRequest();
    const duration = durationSeconds();
    completedRequests += 1;
    requestDurationSeconds += duration;
    if (response.statusCode >= 500) serverErrors += 1;
    const key = requestKey(request.method, response.statusCode);
    const metrics = requestMetrics.get(key) ?? {
      completed: 0,
      durationSeconds: 0,
    };
    metrics.completed += 1;
    metrics.durationSeconds += duration;
    requestMetrics.set(key, metrics);
    log("info", "http_request_completed", {
      requestId,
      method: request.method,
      path: requestPath(request),
      statusCode: response.statusCode,
      durationMs: Math.round(duration * 1000),
      remoteAddress: request.ip,
    });
  };

  const recordAborted = (): void => {
    if (finished) return;
    finished = true;
    releaseRequest();
    log("warn", "http_request_aborted", {
      requestId,
      method: request.method,
      path: requestPath(request),
      durationMs: Math.round(durationSeconds() * 1000),
      remoteAddress: request.ip,
    });
  };

  response.once("finish", recordCompletion);
  response.once("close", recordAborted);
  next();
};

export const getRequestId = (response: Response): string | undefined => {
  const requestId: unknown = response.locals.requestId;
  return typeof requestId === "string" ? requestId : undefined;
};

export const mapWorkerStarted = (operation: WorkerOperation): void => {
  activeWorkers += 1;
  workerMetric(operation).started += 1;
};

export const mapWorkerCompleted = (
  operation: WorkerOperation,
  durationSeconds: number,
): void => {
  activeWorkers = Math.max(0, activeWorkers - 1);
  const metrics = workerMetric(operation);
  metrics.completed += 1;
  metrics.durationSeconds += durationSeconds;
};

export const mapWorkerFailed = (operation: WorkerOperation): void => {
  activeWorkers = Math.max(0, activeWorkers - 1);
  workerMetric(operation).failed += 1;
};

export const mongoConnectionCreated = (): void => {
  mongoConnections += 1;
};

export const mongoConnectionClosed = (
  address: string,
  connectionId: MongoConnectionId,
): void => {
  mongoConnections = Math.max(0, mongoConnections - 1);
  mongoConnectionsCheckedOut.delete(mongoConnectionKey(address, connectionId));
};

export const mongoConnectionCheckedOut = (
  address: string,
  connectionId: MongoConnectionId,
  durationMs: number,
): void => {
  mongoConnectionsCheckedOut.add(mongoConnectionKey(address, connectionId));
  mongoConnectionCheckouts += 1;
  recordMongoConnectionCheckoutDuration(durationMs);
};

export const mongoConnectionCheckedIn = (
  address: string,
  connectionId: MongoConnectionId,
): void => {
  mongoConnectionsCheckedOut.delete(mongoConnectionKey(address, connectionId));
};

export const mongoConnectionCheckoutFailed = (durationMs: number): void => {
  mongoConnectionCheckoutFailures += 1;
  recordMongoConnectionCheckoutDuration(durationMs);
};

const recordMongoConnectionCheckoutDuration = (durationMs: number): void => {
  if (!Number.isFinite(durationMs) || durationMs < 0) return;
  mongoConnectionCheckoutDurationSeconds += durationMs / 1000;
  mongoConnectionCheckoutDurations += 1;
};

const mongoConnectionKey = (
  address: string,
  connectionId: MongoConnectionId,
): string => `${address}\u0000${connectionId.toString()}`;

export const renderMetrics = (
  projectStatuses: ProjectStatus[] = [],
): string => {
  const memory = process.memoryUsage();
  const resourceUsage = process.resourceUsage();
  const cpuUsage = process.cpuUsage();
  const eventLoopUtilization = performance.eventLoopUtilization();
  // Node.js reports maxRSS in kibibytes on every supported platform.
  const maxRssBytes = resourceUsage.maxRSS * 1024;
  const requestMetricLines = [...requestMetrics.entries()].flatMap(
    ([key, metrics]) => {
      const labels = renderLabels(requestLabels(key));
      return [
        `crowdmap_http_responses_total${labels} ${metrics.completed.toString()}`,
        `crowdmap_http_response_duration_seconds_sum${labels} ${metrics.durationSeconds.toString()}`,
        `crowdmap_http_response_duration_seconds_count${labels} ${metrics.completed.toString()}`,
      ];
    },
  );
  const workerMetricLines = [...workerMetrics.entries()].flatMap(
    ([operation, metrics]) => {
      const labels = renderLabels({ operation });
      return [
        `crowdmap_map_workers_started_total${labels} ${metrics.started.toString()}`,
        `crowdmap_map_workers_completed_total${labels} ${metrics.completed.toString()}`,
        `crowdmap_map_workers_failed_total${labels} ${metrics.failed.toString()}`,
        `crowdmap_map_worker_duration_seconds_sum${labels} ${metrics.durationSeconds.toString()}`,
        `crowdmap_map_worker_duration_seconds_count${labels} ${metrics.completed.toString()}`,
      ];
    },
  );
  const projectMetricLines = (["ok", "unavailable"] as const).map(
    (status) =>
      `crowdmap_projects${renderLabels({ status })} ${projectStatuses.filter((projectStatus) => projectStatus === status).length.toString()}`,
  );
  const eventLoopDelayCount = eventLoopDelay.count;
  const eventLoopDelayValue = (value: number): number =>
    eventLoopDelayCount === 0 ? 0 : secondsFromNanoseconds(value);

  return [
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
    "# HELP crowdmap_http_responses_total Completed HTTP responses by bounded method and status code.",
    "# TYPE crowdmap_http_responses_total counter",
    "# HELP crowdmap_http_response_duration_seconds HTTP response duration by bounded method and status code.",
    "# TYPE crowdmap_http_response_duration_seconds summary",
    ...requestMetricLines,
    "# HELP crowdmap_process_uptime_seconds Process uptime.",
    "# TYPE crowdmap_process_uptime_seconds gauge",
    `crowdmap_process_uptime_seconds ${process.uptime().toString()}`,
    "# HELP crowdmap_process_resident_memory_bytes Resident memory used by the process.",
    "# TYPE crowdmap_process_resident_memory_bytes gauge",
    `crowdmap_process_resident_memory_bytes ${memory.rss.toString()}`,
    "# HELP crowdmap_process_heap_bytes Node.js V8 heap memory by state.",
    "# TYPE crowdmap_process_heap_bytes gauge",
    `crowdmap_process_heap_bytes${renderLabels({ state: "total" })} ${memory.heapTotal.toString()}`,
    `crowdmap_process_heap_bytes${renderLabels({ state: "used" })} ${memory.heapUsed.toString()}`,
    "# HELP crowdmap_process_external_memory_bytes Memory used by external C++ objects bound to JavaScript objects.",
    "# TYPE crowdmap_process_external_memory_bytes gauge",
    `crowdmap_process_external_memory_bytes ${memory.external.toString()}`,
    "# HELP crowdmap_process_array_buffers_bytes Memory allocated for ArrayBuffers and Buffers.",
    "# TYPE crowdmap_process_array_buffers_bytes gauge",
    `crowdmap_process_array_buffers_bytes ${memory.arrayBuffers.toString()}`,
    "# HELP crowdmap_process_resident_memory_high_water_mark_bytes Maximum resident memory used by the process.",
    "# TYPE crowdmap_process_resident_memory_high_water_mark_bytes gauge",
    `crowdmap_process_resident_memory_high_water_mark_bytes ${maxRssBytes.toString()}`,
    "# HELP crowdmap_process_cpu_seconds_total CPU time consumed by the process by mode.",
    "# TYPE crowdmap_process_cpu_seconds_total counter",
    `crowdmap_process_cpu_seconds_total${renderLabels({ mode: "user" })} ${(cpuUsage.user / 1e6).toString()}`,
    `crowdmap_process_cpu_seconds_total${renderLabels({ mode: "system" })} ${(cpuUsage.system / 1e6).toString()}`,
    "# HELP crowdmap_nodejs_event_loop_utilization Event-loop utilization since process start.",
    "# TYPE crowdmap_nodejs_event_loop_utilization gauge",
    `crowdmap_nodejs_event_loop_utilization ${eventLoopUtilization.utilization.toString()}`,
    "# HELP crowdmap_nodejs_event_loop_delay_seconds Event-loop delay statistics since process start.",
    "# TYPE crowdmap_nodejs_event_loop_delay_seconds gauge",
    `crowdmap_nodejs_event_loop_delay_seconds${renderLabels({ statistic: "min" })} ${eventLoopDelayValue(eventLoopDelay.min).toString()}`,
    `crowdmap_nodejs_event_loop_delay_seconds${renderLabels({ statistic: "max" })} ${eventLoopDelayValue(eventLoopDelay.max).toString()}`,
    `crowdmap_nodejs_event_loop_delay_seconds${renderLabels({ statistic: "mean" })} ${eventLoopDelayValue(finiteValue(eventLoopDelay.mean)).toString()}`,
    `crowdmap_nodejs_event_loop_delay_seconds${renderLabels({ statistic: "p50" })} ${eventLoopDelayValue(eventLoopDelay.percentile(50)).toString()}`,
    `crowdmap_nodejs_event_loop_delay_seconds${renderLabels({ statistic: "p90" })} ${eventLoopDelayValue(eventLoopDelay.percentile(90)).toString()}`,
    `crowdmap_nodejs_event_loop_delay_seconds${renderLabels({ statistic: "p99" })} ${eventLoopDelayValue(eventLoopDelay.percentile(99)).toString()}`,
    "# HELP crowdmap_map_workers_active Active map worker threads.",
    "# TYPE crowdmap_map_workers_active gauge",
    `crowdmap_map_workers_active ${activeWorkers.toString()}`,
    "# HELP crowdmap_map_workers_started_total Map worker threads started by operation.",
    "# TYPE crowdmap_map_workers_started_total counter",
    "# HELP crowdmap_map_workers_completed_total Map worker threads completed by operation.",
    "# TYPE crowdmap_map_workers_completed_total counter",
    "# HELP crowdmap_map_workers_failed_total Map worker threads that failed by operation.",
    "# TYPE crowdmap_map_workers_failed_total counter",
    "# HELP crowdmap_map_worker_duration_seconds Cumulative duration of completed map worker threads by operation.",
    "# TYPE crowdmap_map_worker_duration_seconds summary",
    ...workerMetricLines,
    "# HELP crowdmap_mongo_connections Current MongoDB driver connections.",
    "# TYPE crowdmap_mongo_connections gauge",
    `crowdmap_mongo_connections ${mongoConnections.toString()}`,
    "# HELP crowdmap_mongo_connections_checked_out Current MongoDB connections checked out from the driver pool.",
    "# TYPE crowdmap_mongo_connections_checked_out gauge",
    `crowdmap_mongo_connections_checked_out ${mongoConnectionsCheckedOut.size.toString()}`,
    "# HELP crowdmap_mongo_connection_checkouts_total MongoDB driver connection checkouts.",
    "# TYPE crowdmap_mongo_connection_checkouts_total counter",
    `crowdmap_mongo_connection_checkouts_total ${mongoConnectionCheckouts.toString()}`,
    "# HELP crowdmap_mongo_connection_checkout_failures_total Failed MongoDB driver connection checkouts.",
    "# TYPE crowdmap_mongo_connection_checkout_failures_total counter",
    `crowdmap_mongo_connection_checkout_failures_total ${mongoConnectionCheckoutFailures.toString()}`,
    "# HELP crowdmap_mongo_connection_checkout_duration_seconds Cumulative MongoDB driver connection checkout duration.",
    "# TYPE crowdmap_mongo_connection_checkout_duration_seconds summary",
    `crowdmap_mongo_connection_checkout_duration_seconds_sum ${mongoConnectionCheckoutDurationSeconds.toString()}`,
    `crowdmap_mongo_connection_checkout_duration_seconds_count ${mongoConnectionCheckoutDurations.toString()}`,
    "# HELP crowdmap_projects Configured projects by availability status.",
    "# TYPE crowdmap_projects gauge",
    ...projectMetricLines,
    "",
  ].join("\n");
};

export const renderProjectMetrics = async (
  healthService: ProjectStatusProvider,
): Promise<string> => {
  const projects = await healthService.getProjectStatuses();
  return renderMetrics(projects.map((project) => project.status));
};
