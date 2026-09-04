import cors from "cors";
import express, {
  Request as ExRequest,
  Response as ExResponse,
  NextFunction,
  json,
  urlencoded,
} from "express";
import rateLimit from "express-rate-limit";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import swaggerUi from "swagger-ui-express";
import { ValidateError } from "tsoa";
import { RegisterRoutes } from "../generated/routes.js";
import swaggerJson from "../generated/swagger.json" with { type: "json" };
import { config } from "./config/values.js";
import {
  AuthorizationError,
  ConflictError,
  NotFoundError,
  ServiceUnavailableError,
} from "./models/api/error.js";
import { getRequestId, log, requestObservability } from "./observability.js";

export const app = express();
const currentDirectory = dirname(fileURLToPath(import.meta.url));

app.set("trust proxy", config.trustProxy);

app.use(requestObservability);
app.use(cors());

app.use(
  urlencoded({
    extended: true,
  }),
);
app.use(json());
app.use(
  rateLimit({
    // use a 15 minute window
    windowMs: 15 * 60 * 1000,
    // allow ten requests per second
    max: 15 * 60 * 10,
    standardHeaders: true,
  }),
);
app.use("/docs", swaggerUi.serve, (_req: ExRequest, res: ExResponse) => {
  return res.send(swaggerUi.generateHTML(swaggerJson));
});

RegisterRoutes(app);

app.use(express.static(join(currentDirectory, "../website")));

app.use(function notFoundHandler(_req, res: ExResponse) {
  res.status(404).send({
    message: "Not Found",
  });
});

app.use(function errorHandler(
  err: unknown,
  req: ExRequest,
  res: ExResponse,
  next: NextFunction,
): ExResponse | undefined {
  const logFields = {
    requestId: getRequestId(res),
    method: req.method,
    path: req.path,
  };
  if (err instanceof ValidateError) {
    log("warn", "request_validation_failed", {
      ...logFields,
      validationFields: err.fields,
    });
    return res.status(422).json({
      message: "Validation Failed",
      details: err.fields,
    });
  }
  if (err instanceof AuthorizationError) {
    log("warn", "request_authorization_failed", {
      ...logFields,
      error: err,
    });
    return res.status(403).json({
      message: err.message,
    });
  }
  if (err instanceof ConflictError) {
    log("warn", "request_conflict", { ...logFields, error: err });
    return res.status(409).json({
      message: err.message,
    });
  }
  if (err instanceof NotFoundError) {
    log("warn", "resource_not_found", { ...logFields, error: err });
    return res.status(404).json({
      message: err.message,
    });
  }
  if (err instanceof ServiceUnavailableError) {
    log("error", "service_unavailable", { ...logFields, error: err });
    return res.status(503).json({
      message: err.message,
    });
  }
  if (err instanceof Error) {
    log("error", "unhandled_request_error", { ...logFields, error: err });
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }

  next();
  return;
});
