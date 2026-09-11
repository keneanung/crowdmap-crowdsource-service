import { ValidateError } from "@tsoa/runtime";
import cors from "cors";
import express, {
  Request as ExRequest,
  Response as ExResponse,
  NextFunction,
  json,
  urlencoded,
} from "express";
import rateLimit from "express-rate-limit";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import swaggerUi from "swagger-ui-express";
import { RegisterRoutes } from "../generated/routes.js";
import swaggerJson from "../generated/swagger.json" with { type: "json" };
import { config } from "./config/values.js";
import { iocContainer } from "./ioc/ioc.js";
import {
  AuthorizationError,
  ConflictError,
  NotFoundError,
  ServiceUnavailableError,
} from "./models/api/error.js";
import { getRequestId, log, requestObservability } from "./observability.js";
import {
  ProjectContextResolver,
  type ProjectRequest,
} from "./projects/projectContext.js";

export const app = express();
const currentDirectory = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const mapExplorerDirectory = join(
  dirname(require.resolve("mudlet-map-browser-script/package.json")),
  "dist",
);
const privacyPage = join(currentDirectory, "../website/privacy.html");

const escapeHtml = (value: string): string =>
  value.replace(/[&<>'"]/gu, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };
    return entities[character] ?? character;
  });

const renderPrivacyPage = async (): Promise<string> => {
  const page = await readFile(privacyPage, "utf8");
  const values: Record<string, string> = {
    "{{privacy-controller-name}}": config.privacyControllerName ?? "",
    "{{privacy-contact-url}}": config.privacyContactUrl ?? "",
    "{{privacy-contact-label}}": (config.privacyContactUrl ?? "").replace(
      /^mailto:/iu,
      "",
    ),
    "{{privacy-log-retention}}": config.privacyLogRetention ?? "",
    "{{privacy-processors-and-transfers}}":
      config.privacyProcessorsAndTransfers ?? "",
  };
  const rendered = Object.entries(values).reduce(
    (result, [placeholder, value]) =>
      result.replaceAll(placeholder, () => escapeHtml(value)),
    page,
  );
  return rendered;
};

let renderedPrivacyPage: string | undefined;

const getRenderedPrivacyPage = async (): Promise<string> => {
  return (renderedPrivacyPage ??= await renderPrivacyPage());
};

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
app.use((request: ProjectRequest, _response, next) => {
  try {
    if (request.path.startsWith("/utility/")) {
      request.platformRequest = true;
      next();
      return;
    }
    const resolution = iocContainer
      .get<ProjectContextResolver>(ProjectContextResolver)
      .resolve(request);
    request.projectContext = resolution.context;
    request.platformRequest = resolution.platform;
    next();
  } catch (error) {
    next(error);
  }
});
app.get("/project-context.json", (request: ProjectRequest, response) => {
  response.json({
    project: request.projectContext?.project
      ? {
          id: request.projectContext.project.id,
          name: request.projectContext.project.name,
        }
      : undefined,
    projects: request.platformRequest
      ? config.projects.map(({ id, name }) => ({
          id,
          name,
          host: Object.entries(config.hostProjectMap).find(
            ([, value]) => value === id,
          )?.[0],
        }))
      : undefined,
    sponsorshipEnabled: Boolean(config.kofiProfileUrl),
  });
});
app.get("/", (request: ProjectRequest, response, next) => {
  if (!request.platformRequest) {
    next();
    return;
  }
  const externalPort = new URL(`http://${request.host}`).port;
  const links = config.projects
    .map((project) => {
      const host = Object.entries(config.hostProjectMap).find(
        ([, id]) => id === project.id,
      )?.[0];
      if (!host) return "";
      const authority = externalPort ? `${host}:${externalPort}` : host;
      return `<li><a href="//${escapeHtml(authority)}/">${escapeHtml(project.name)}</a></li>`;
    })
    .join("");
  response
    .type("html")
    .send(
      `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Crowdmap projects</title><link rel="stylesheet" href="/stylesheets/site-navigation.css"></head><body><nav class="site-navigation"><a class="site-navigation__brand" href="/">Crowdmap</a><ul class="site-navigation__links"><li><a href="/privacy.html">Privacy</a></li>${config.kofiProfileUrl ? '<li><a href="/sponsor.html">Sponsor</a></li>' : ""}</ul></nav><main><h1>Map projects</h1><p>Select a map project to open its explorer.</p><ul>${links}</ul></main></body></html>`,
    );
});
app.get("/index.html", (request: ProjectRequest, response, next) => {
  if (!request.platformRequest) {
    next();
    return;
  }
  response.redirect(302, "/");
});
app.get("/review.html", (request: ProjectRequest, response, next) => {
  if (!request.platformRequest) {
    next();
    return;
  }
  response
    .status(404)
    .json({ message: "A project host is required for map review" });
});
app.get("/privacy.html", async (_request, response, next) => {
  try {
    response.type("html").send(await getRenderedPrivacyPage());
  } catch (error) {
    next(error);
  }
});
app.use(
  "/sponsorship",
  (_req: ExRequest, res: ExResponse, next: NextFunction) => {
    if (!config.kofiProfileUrl) {
      res.status(404).json({ message: "Not Found" });
      return;
    }
    next();
  },
);
app.use("/docs", swaggerUi.serve, (_req: ExRequest, res: ExResponse) => {
  return res.send(swaggerUi.generateHTML(swaggerJson));
});

RegisterRoutes(app);

app.use(
  "/javascripts/map-explorer",
  express.static(mapExplorerDirectory, { maxAge: "1h" }),
);
app.get("/sponsor.html", (_req: ExRequest, res: ExResponse) => {
  if (!config.kofiProfileUrl) {
    res.status(404).json({ message: "Not Found" });
    return;
  }
  res.sendFile(join(currentDirectory, "../website/sponsor.html"));
});
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
