import { existsSync, readFileSync } from "node:fs";
import * as path from "node:path";
import { parse } from "yaml";

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
}

interface YamlProject {
  id?: unknown;
  name?: unknown;
  baseline?: {
    mapFile?: unknown;
    versionFile?: unknown;
  };
  upstream?: {
    mapUrl?: unknown;
    versionUrl?: unknown;
  };
}

interface YamlConfig {
  platform?: {
    port?: unknown;
    trustProxy?: unknown;
    mongo?: {
      connectionString?: unknown;
      database?: unknown;
    };
    initialAdminApiKey?: unknown;
    privacy?: {
      controllerName?: unknown;
      contactUrl?: unknown;
      logRetention?: unknown;
      processorsAndTransfers?: unknown;
    };
    sponsorship?: {
      profileUrl?: unknown;
      monthlyGoal?: unknown;
      currency?: unknown;
      currencyDecimalPlaces?: unknown;
      webhookToken?: unknown;
    };
  };
  projects?: {
    resolver?: unknown;
    platformHost?: unknown;
    hosts?: unknown;
    definitions?: unknown;
  };
}

const optionalString = (name: string, value: unknown): string | undefined => {
  if (value === undefined) return undefined;
  if (typeof value !== "string") throw new Error(`${name} must be a string`);
  return value;
};

const numberWithDefault = (
  name: string,
  value: unknown,
  fallback: number,
): number => {
  if (value === undefined) return fallback;
  if (typeof value !== "number") throw new Error(`${name} must be a number`);
  return value;
};

const normalizeDataFile = (value: unknown): string => {
  if (typeof value !== "string") return "";
  return path.normalize(value);
};

const defaultConfigFile = (): string => {
  const composeSecret = "/run/secrets/config.yaml";
  return existsSync(composeSecret)
    ? composeSecret
    : path.join(process.cwd(), "config.yaml");
};

export const loadConfig = (
  configFile = process.env.CONFIG_FILE ?? defaultConfigFile(),
): ServiceConfig => {
  let parsed: unknown;
  try {
    parsed = parse(readFileSync(configFile, "utf8"));
  } catch (error) {
    throw new Error(`Unable to load YAML configuration from ${configFile}`, {
      cause: error,
    });
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed))
    throw new Error("The YAML configuration root must be an object");

  const values = parsed as YamlConfig;
  const resolver = values.projects?.resolver;
  if (resolver !== undefined && resolver !== "single" && resolver !== "host")
    throw new Error("projects.resolver must be single or host");
  const definitions = values.projects?.definitions;
  if (!Array.isArray(definitions))
    throw new Error("projects.definitions must be an array");
  const projects = definitions.map((rawProject): MapProject => {
    if (
      typeof rawProject !== "object" ||
      rawProject === null ||
      Array.isArray(rawProject)
    )
      throw new Error("Every projects.definitions entry must be an object");
    const project = rawProject as YamlProject;
    return Object.freeze({
      id: optionalString("projects.definitions[].id", project.id) ?? "",
      name: optionalString("projects.definitions[].name", project.name) ?? "",
      mapFile: normalizeDataFile(project.baseline?.mapFile),
      versionFile: normalizeDataFile(project.baseline?.versionFile),
      mapDownloadUrl:
        optionalString(
          "projects.definitions[].upstream.mapUrl",
          project.upstream?.mapUrl,
        ) ?? "",
      versionDownloadUrl:
        optionalString(
          "projects.definitions[].upstream.versionUrl",
          project.upstream?.versionUrl,
        ) ?? "",
    });
  });
  const hostMapping = values.projects?.hosts;
  if (
    hostMapping !== undefined &&
    (typeof hostMapping !== "object" ||
      hostMapping === null ||
      Array.isArray(hostMapping))
  )
    throw new Error("projects.hosts must be a hostname-to-project object");
  const hostProjectMap: Record<string, string> = {};
  if (hostMapping !== undefined) {
    for (const [host, projectId] of Object.entries(hostMapping)) {
      if (typeof projectId !== "string")
        throw new Error(`Project mapping for ${host} must be a project ID`);
      hostProjectMap[host] = projectId;
    }
  }
  const sponsorship = values.platform?.sponsorship;
  const config: ServiceConfig = {
    port: numberWithDefault("platform.port", values.platform?.port, 3000),
    trustProxy: numberWithDefault(
      "platform.trustProxy",
      values.platform?.trustProxy,
      0,
    ),
    connectionString: optionalString(
      "platform.mongo.connectionString",
      values.platform?.mongo?.connectionString,
    ),
    dbName: optionalString(
      "platform.mongo.database",
      values.platform?.mongo?.database,
    ),
    initialAdminApiKey: optionalString(
      "platform.initialAdminApiKey",
      values.platform?.initialAdminApiKey,
    ),
    privacyControllerName: optionalString(
      "platform.privacy.controllerName",
      values.platform?.privacy?.controllerName,
    ),
    privacyContactUrl: optionalString(
      "platform.privacy.contactUrl",
      values.platform?.privacy?.contactUrl,
    ),
    privacyLogRetention: optionalString(
      "platform.privacy.logRetention",
      values.platform?.privacy?.logRetention,
    ),
    privacyProcessorsAndTransfers: optionalString(
      "platform.privacy.processorsAndTransfers",
      values.platform?.privacy?.processorsAndTransfers,
    ),
    kofiProfileUrl: optionalString(
      "platform.sponsorship.profileUrl",
      sponsorship?.profileUrl,
    ),
    kofiMonthlyGoal:
      sponsorship?.monthlyGoal === undefined
        ? undefined
        : numberWithDefault(
            "platform.sponsorship.monthlyGoal",
            sponsorship.monthlyGoal,
            0,
          ),
    kofiCurrency:
      optionalString("platform.sponsorship.currency", sponsorship?.currency) ??
      "USD",
    kofiCurrencyDecimalPlaces: numberWithDefault(
      "platform.sponsorship.currencyDecimalPlaces",
      sponsorship?.currencyDecimalPlaces,
      2,
    ),
    kofiWebhookToken: optionalString(
      "platform.sponsorship.webhookToken",
      sponsorship?.webhookToken,
    ),
    projects: Object.freeze(projects),
    projectResolver: resolver ?? "single",
    hostProjectMap: Object.freeze({ ...hostProjectMap }),
    platformHost: optionalString(
      "projects.platformHost",
      values.projects?.platformHost,
    ),
  };
  validateConfig(config);
  return config;
};

const validateDownloadUrl = (name: string, value: string): void => {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid URL`);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:")
    throw new Error(`${name} must use HTTP or HTTPS`);
};

export const validateConfig = (values: ServiceConfig): void => {
  if (!Number.isInteger(values.port) || values.port < 1 || values.port > 65535)
    throw new Error("platform.port must be an integer between 1 and 65535");
  if (!Number.isInteger(values.trustProxy) || values.trustProxy < 0)
    throw new Error("platform.trustProxy must be a non-negative integer");
  if (!values.connectionString)
    throw new Error("platform.mongo.connectionString is required");
  if (!values.dbName) throw new Error("platform.mongo.database is required");
  if (!values.privacyControllerName)
    throw new Error("platform.privacy.controllerName is required");
  if (!values.privacyContactUrl)
    throw new Error("platform.privacy.contactUrl is required");
  let privacyContactUrl: URL;
  try {
    privacyContactUrl = new URL(values.privacyContactUrl);
  } catch {
    throw new Error("platform.privacy.contactUrl must be a valid URL");
  }
  if (!["https:", "mailto:"].includes(privacyContactUrl.protocol))
    throw new Error("platform.privacy.contactUrl must use HTTPS or mailto");
  if (privacyContactUrl.protocol === "mailto:" && !privacyContactUrl.pathname)
    throw new Error("platform.privacy.contactUrl mailto address is required");
  if (!values.privacyLogRetention)
    throw new Error("platform.privacy.logRetention is required");
  if (!values.privacyProcessorsAndTransfers)
    throw new Error("platform.privacy.processorsAndTransfers is required");

  if (values.projects.length === 0)
    throw new Error("At least one projects.definitions entry is required");
  const ids = new Set<string>();
  const files = new Set<string>();
  for (const project of values.projects) {
    if (!/^[a-z0-9][a-z0-9_-]{0,63}$/u.test(project.id))
      throw new Error(`Invalid project ID: ${project.id}`);
    if (ids.has(project.id))
      throw new Error(`Duplicate project ID: ${project.id}`);
    ids.add(project.id);
    if (!project.name.trim())
      throw new Error(`Project ${project.id} must have a name`);
    for (const file of [project.mapFile, project.versionFile]) {
      if (!file)
        throw new Error(
          `Project ${project.id} baseline file paths are required`,
        );
      if (!path.isAbsolute(file))
        throw new Error(
          `Project ${project.id} baseline file paths must be absolute: ${file}`,
        );
      if (files.has(file))
        throw new Error(`Project baseline paths must be distinct: ${file}`);
      files.add(file);
    }
    validateDownloadUrl(
      `Project ${project.id} upstream.mapUrl`,
      project.mapDownloadUrl,
    );
    validateDownloadUrl(
      `Project ${project.id} upstream.versionUrl`,
      project.versionDownloadUrl,
    );
  }
  if (values.projectResolver === "single" && values.projects.length !== 1)
    throw new Error("The single project resolver requires exactly one project");
  if (values.projectResolver === "host") {
    if (!values.platformHost)
      throw new Error(
        "projects.platformHost is required for the host resolver",
      );
    if (
      values.platformHost !== values.platformHost.toLowerCase() ||
      values.platformHost.includes(":")
    )
      throw new Error(
        "projects.platformHost must be a lowercase hostname without a port",
      );
    if (Object.keys(values.hostProjectMap).length === 0)
      throw new Error("projects.hosts is required for the host resolver");
    for (const [host, projectId] of Object.entries(values.hostProjectMap)) {
      if (host !== host.toLowerCase() || host.includes(":"))
        throw new Error(
          `projects.hosts keys must be lowercase hostnames: ${host}`,
        );
      if (!ids.has(projectId))
        throw new Error(`Host ${host} references unknown project ${projectId}`);
    }
    const hostedProjectIds = new Set(Object.values(values.hostProjectMap));
    for (const projectId of ids) {
      if (!hostedProjectIds.has(projectId))
        throw new Error(`Project ${projectId} has no projects.hosts mapping`);
    }
    if (values.hostProjectMap[values.platformHost])
      throw new Error("projects.platformHost cannot also identify a project");
  }

  if (values.kofiProfileUrl) {
    let profileUrl: URL;
    try {
      profileUrl = new URL(values.kofiProfileUrl);
    } catch {
      throw new Error("platform.sponsorship.profileUrl must be a valid URL");
    }
    if (
      profileUrl.protocol !== "https:" ||
      !["ko-fi.com", "www.ko-fi.com"].includes(profileUrl.hostname)
    )
      throw new Error(
        "platform.sponsorship.profileUrl must be an HTTPS ko-fi.com URL",
      );
    if (
      values.kofiMonthlyGoal === undefined ||
      !Number.isFinite(values.kofiMonthlyGoal) ||
      values.kofiMonthlyGoal <= 0
    )
      throw new Error("platform.sponsorship.monthlyGoal must be positive");
    if (!values.kofiWebhookToken)
      throw new Error(
        "platform.sponsorship.webhookToken is required when sponsorship is enabled",
      );
  }
  if (!/^[A-Z]{3}$/.test(values.kofiCurrency))
    throw new Error(
      "platform.sponsorship.currency must be a three-letter uppercase code",
    );
  if (
    !Number.isInteger(values.kofiCurrencyDecimalPlaces) ||
    values.kofiCurrencyDecimalPlaces < 0 ||
    values.kofiCurrencyDecimalPlaces > 6
  )
    throw new Error(
      "platform.sponsorship.currencyDecimalPlaces must be an integer between 0 and 6",
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
        "platform.sponsorship.monthlyGoal must be a positive safe minor-unit amount",
      );
  }
};

export const config = loadConfig();
