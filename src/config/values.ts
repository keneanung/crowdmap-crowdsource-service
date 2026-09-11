import * as dotenv from "dotenv";
import * as path from "node:path";

dotenv.config({ quiet: true });

export interface MapProject {
  readonly id: string;
  readonly name: string;
  readonly mapFile: string;
  readonly versionFile: string;
  readonly mapDownloadUrl: string;
  readonly versionDownloadUrl: string;
}

export type ProjectResolverMode = "single" | "host";

export interface ServiceConfig {
  port: number;
  connectionString?: string;
  dbName?: string;
  initialAdminApiKey?: string;
  trustProxy: number;
  privacyControllerName?: string;
  privacyContactUrl?: string;
  privacyLogRetention?: string;
  privacyProcessorsAndTransfers?: string;
  kofiProfileUrl?: string;
  kofiMonthlyGoal?: number;
  kofiCurrency: string;
  kofiCurrencyDecimalPlaces: number;
  kofiWebhookToken?: string;
  projects: readonly MapProject[];
  projectResolver: ProjectResolverMode;
  hostProjectMap: Readonly<Record<string, string>>;
  platformHost?: string;
  /** Legacy aliases for the default project. */
  mapFile: string;
  mapDownloadUrl: string;
  versionFile: string;
  versionDownloadUrl: string;
}

const legacyProject = (): MapProject => ({
  id: process.env.PROJECT_ID ?? "default",
  name: process.env.PROJECT_NAME ?? "Crowdmap",
  mapFile: process.env.MAP_FILE ?? path.join(process.cwd(), "map"),
  mapDownloadUrl:
    process.env.MAP_DOWNLOAD_URL ??
    "https://ire-mudlet-mapping.github.io/AchaeaCrowdmap/Map/map",
  versionFile: process.env.VERSION_FILE ?? path.join(process.cwd(), "version"),
  versionDownloadUrl:
    process.env.VERSION_DOWNLOAD_URL ??
    "https://ire-mudlet-mapping.github.io/AchaeaCrowdmap/Map/version.txt",
});

const parseJson = <T>(name: string, fallback: T): T => {
  const raw = process.env[name];
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    throw new Error(`${name} must contain valid JSON`, { cause: error });
  }
};

const parsedProjects = parseJson<unknown>("MAP_PROJECTS", [legacyProject()]);
if (!Array.isArray(parsedProjects))
  throw new Error("MAP_PROJECTS must be a JSON array");
const projects = Object.freeze(
  parsedProjects.map((project) => {
    if (
      typeof project !== "object" ||
      project === null ||
      Array.isArray(project)
    )
      throw new Error("Every MAP_PROJECTS entry must be an object");
    return Object.freeze({ ...project }) as unknown as MapProject;
  }),
);
const firstProject = projects[0] ?? legacyProject();

export const config: ServiceConfig = {
  port: Number(process.env.PORT ?? 3000),
  connectionString: process.env.MONGO_CONNECTION_STRING,
  dbName: process.env.MONGO_DB_NAME,
  initialAdminApiKey: process.env.INITIAL_ADMIN_API_KEY,
  trustProxy: Number(process.env.TRUST_PROXY ?? 0),
  privacyControllerName: process.env.PRIVACY_CONTROLLER_NAME,
  privacyContactUrl: process.env.PRIVACY_CONTACT_URL,
  privacyLogRetention: process.env.PRIVACY_LOG_RETENTION,
  privacyProcessorsAndTransfers: process.env.PRIVACY_PROCESSORS_AND_TRANSFERS,
  kofiProfileUrl: process.env.KO_FI_PROFILE_URL,
  kofiMonthlyGoal: process.env.KO_FI_MONTHLY_GOAL
    ? Number(process.env.KO_FI_MONTHLY_GOAL)
    : undefined,
  kofiCurrency: process.env.KO_FI_CURRENCY ?? "USD",
  kofiCurrencyDecimalPlaces: Number(
    process.env.KO_FI_CURRENCY_DECIMAL_PLACES ?? 2,
  ),
  kofiWebhookToken: process.env.KO_FI_WEBHOOK_TOKEN,
  projects,
  projectResolver: (process.env.PROJECT_RESOLVER ??
    "single") as ProjectResolverMode,
  hostProjectMap: Object.freeze(
    (() => {
      const mapping = parseJson<unknown>("HOST_PROJECT_MAP", {});
      if (
        typeof mapping !== "object" ||
        mapping === null ||
        Array.isArray(mapping)
      )
        throw new Error("HOST_PROJECT_MAP must be a JSON object");
      return mapping as Record<string, string>;
    })(),
  ),
  platformHost: process.env.PLATFORM_HOST?.toLowerCase(),
  mapFile: firstProject.mapFile,
  mapDownloadUrl: firstProject.mapDownloadUrl,
  versionFile: firstProject.versionFile,
  versionDownloadUrl: firstProject.versionDownloadUrl,
};

const validateDownloadUrl = (name: string, value: string): void => {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid URL`);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`${name} must use HTTP or HTTPS`);
  }
};

export const validateConfig = (values: ServiceConfig = config): void => {
  if (!Number.isInteger(values.port) || values.port < 1 || values.port > 65535)
    throw new Error("PORT must be an integer between 1 and 65535");
  if (!Number.isInteger(values.trustProxy) || values.trustProxy < 0)
    throw new Error("TRUST_PROXY must be a non-negative integer");
  if (!values.connectionString)
    throw new Error("MONGO_CONNECTION_STRING is required");
  if (!values.dbName) throw new Error("MONGO_DB_NAME is required");
  if (!values.privacyControllerName)
    throw new Error("PRIVACY_CONTROLLER_NAME is required");
  if (!values.privacyContactUrl)
    throw new Error("PRIVACY_CONTACT_URL is required");
  let privacyContactUrl: URL;
  try {
    privacyContactUrl = new URL(values.privacyContactUrl);
  } catch {
    throw new Error("PRIVACY_CONTACT_URL must be a valid URL");
  }
  if (!["https:", "mailto:"].includes(privacyContactUrl.protocol))
    throw new Error("PRIVACY_CONTACT_URL must use HTTPS or mailto");
  if (privacyContactUrl.protocol === "mailto:" && !privacyContactUrl.pathname)
    throw new Error("PRIVACY_CONTACT_URL mailto address is required");
  if (!values.privacyLogRetention)
    throw new Error("PRIVACY_LOG_RETENTION is required");
  if (!values.privacyProcessorsAndTransfers)
    throw new Error("PRIVACY_PROCESSORS_AND_TRANSFERS is required");

  // Keep validating the legacy shorthand fields for callers constructing the
  // backwards-compatible single-project ServiceConfig shape.
  validateDownloadUrl("MAP_DOWNLOAD_URL", values.mapDownloadUrl);
  validateDownloadUrl("VERSION_DOWNLOAD_URL", values.versionDownloadUrl);

  if (values.projects.length === 0)
    throw new Error("At least one MAP_PROJECTS entry is required");
  const ids = new Set<string>();
  const files = new Set<string>();
  for (const project of values.projects) {
    if (
      typeof project.id !== "string" ||
      typeof project.name !== "string" ||
      typeof project.mapFile !== "string" ||
      typeof project.versionFile !== "string" ||
      typeof project.mapDownloadUrl !== "string" ||
      typeof project.versionDownloadUrl !== "string"
    )
      throw new Error(
        "Every MAP_PROJECTS entry requires string id, name, mapFile, versionFile, mapDownloadUrl, and versionDownloadUrl fields",
      );
    if (!/^[a-z0-9][a-z0-9_-]{0,63}$/u.test(project.id))
      throw new Error(`Invalid project ID: ${project.id}`);
    if (ids.has(project.id))
      throw new Error(`Duplicate project ID: ${project.id}`);
    ids.add(project.id);
    if (!project.name.trim())
      throw new Error(`Project ${project.id} must have a name`);
    for (const file of [project.mapFile, project.versionFile]) {
      const resolved = path.resolve(file);
      if (files.has(resolved))
        throw new Error(`Project baseline paths must be distinct: ${resolved}`);
      files.add(resolved);
    }
    validateDownloadUrl(
      `Project ${project.id} mapDownloadUrl`,
      project.mapDownloadUrl,
    );
    validateDownloadUrl(
      `Project ${project.id} versionDownloadUrl`,
      project.versionDownloadUrl,
    );
  }
  if (!(["single", "host"] as const).includes(values.projectResolver))
    throw new Error("PROJECT_RESOLVER must be single or host");
  if (values.projectResolver === "single" && values.projects.length !== 1)
    throw new Error("The single project resolver requires exactly one project");
  if (values.projectResolver === "host") {
    if (!values.platformHost)
      throw new Error("PLATFORM_HOST is required for the host resolver");
    if (
      values.platformHost !== values.platformHost.toLowerCase() ||
      values.platformHost.includes(":")
    )
      throw new Error(
        "PLATFORM_HOST must be a lowercase hostname without a port",
      );
    if (Object.keys(values.hostProjectMap).length === 0)
      throw new Error("HOST_PROJECT_MAP is required for the host resolver");
    for (const [host, projectId] of Object.entries(values.hostProjectMap)) {
      if (host !== host.toLowerCase() || host.includes(":"))
        throw new Error(
          `HOST_PROJECT_MAP keys must be lowercase hostnames: ${host}`,
        );
      if (!ids.has(projectId))
        throw new Error(`Host ${host} references unknown project ${projectId}`);
    }
    if (values.platformHost && values.hostProjectMap[values.platformHost])
      throw new Error("PLATFORM_HOST cannot also identify a project");
  }

  if (values.kofiProfileUrl) {
    let profileUrl: URL;
    try {
      profileUrl = new URL(values.kofiProfileUrl);
    } catch {
      throw new Error("KO_FI_PROFILE_URL must be a valid URL");
    }
    if (
      profileUrl.protocol !== "https:" ||
      !["ko-fi.com", "www.ko-fi.com"].includes(profileUrl.hostname)
    )
      throw new Error("KO_FI_PROFILE_URL must be an HTTPS ko-fi.com URL");
    if (
      values.kofiMonthlyGoal === undefined ||
      !Number.isFinite(values.kofiMonthlyGoal) ||
      values.kofiMonthlyGoal <= 0
    )
      throw new Error("KO_FI_MONTHLY_GOAL must be a positive number");
    if (!values.kofiWebhookToken)
      throw new Error("KO_FI_WEBHOOK_TOKEN is required with KO_FI_PROFILE_URL");
  }
  if (!/^[A-Z]{3}$/.test(values.kofiCurrency))
    throw new Error(
      "KO_FI_CURRENCY must be a three-letter uppercase currency code",
    );
  if (
    !Number.isInteger(values.kofiCurrencyDecimalPlaces) ||
    values.kofiCurrencyDecimalPlaces < 0 ||
    values.kofiCurrencyDecimalPlaces > 6
  )
    throw new Error(
      "KO_FI_CURRENCY_DECIMAL_PLACES must be an integer between 0 and 6",
    );
  if (values.kofiMonthlyGoal !== undefined) {
    const minorUnits = Math.round(
      values.kofiMonthlyGoal * 10 ** values.kofiCurrencyDecimalPlaces,
    );
    if (
      !Number.isSafeInteger(minorUnits) ||
      minorUnits <= 0 ||
      minorUnits / 10 ** values.kofiCurrencyDecimalPlaces !==
        values.kofiMonthlyGoal
    )
      throw new Error(
        "KO_FI_MONTHLY_GOAL must be a positive safe minor-unit amount",
      );
  }
};
