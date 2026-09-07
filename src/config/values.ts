import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ quiet: true });

export interface ServiceConfig {
  port: number;
  mapFile: string;
  mapDownloadUrl: string;
  versionFile: string;
  versionDownloadUrl: string;
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
  kofiWebhookToken?: string;
}

export const config: ServiceConfig = {
  port: Number(process.env.PORT ?? 3000),
  mapFile: process.env.MAP_FILE ?? path.join(process.cwd(), "map"),
  mapDownloadUrl:
    process.env.MAP_DOWNLOAD_URL ??
    "https://ire-mudlet-mapping.github.io/AchaeaCrowdmap/Map/map",
  versionFile: process.env.VERSION_FILE ?? path.join(process.cwd(), "version"),
  versionDownloadUrl:
    process.env.VERSION_DOWNLOAD_URL ??
    "https://ire-mudlet-mapping.github.io/AchaeaCrowdmap/Map/version.txt",
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
  kofiWebhookToken: process.env.KO_FI_WEBHOOK_TOKEN,
};

export const validateConfig = (values: ServiceConfig = config): void => {
  if (
    !Number.isInteger(values.port) ||
    values.port < 1 ||
    values.port > 65535
  ) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }
  if (!Number.isInteger(values.trustProxy) || values.trustProxy < 0) {
    throw new Error("TRUST_PROXY must be a non-negative integer");
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
    ) {
      throw new Error("KO_FI_PROFILE_URL must be an HTTPS ko-fi.com URL");
    }
    if (
      values.kofiMonthlyGoal === undefined ||
      !Number.isFinite(values.kofiMonthlyGoal) ||
      values.kofiMonthlyGoal <= 0
    ) {
      throw new Error("KO_FI_MONTHLY_GOAL must be a positive number");
    }
    if (!values.kofiWebhookToken) {
      throw new Error("KO_FI_WEBHOOK_TOKEN is required with KO_FI_PROFILE_URL");
    }
  }
  if (!/^[A-Z]{3}$/.test(values.kofiCurrency)) {
    throw new Error("KO_FI_CURRENCY must be a three-letter uppercase currency code");
  }
  if (!values.connectionString) {
    throw new Error("MONGO_CONNECTION_STRING is required");
  }
  if (!values.dbName) {
    throw new Error("MONGO_DB_NAME is required");
  }
  if (!values.privacyControllerName) {
    throw new Error("PRIVACY_CONTROLLER_NAME is required");
  }
  if (!values.privacyContactUrl) {
    throw new Error("PRIVACY_CONTACT_URL is required");
  }
  let privacyContactUrl: URL;
  try {
    privacyContactUrl = new URL(values.privacyContactUrl);
  } catch {
    throw new Error("PRIVACY_CONTACT_URL must be a valid URL");
  }
  if (
    privacyContactUrl.protocol !== "https:" &&
    privacyContactUrl.protocol !== "mailto:"
  ) {
    throw new Error("PRIVACY_CONTACT_URL must use HTTPS or mailto");
  }
  if (privacyContactUrl.protocol === "mailto:" && !privacyContactUrl.pathname) {
    throw new Error("PRIVACY_CONTACT_URL mailto address is required");
  }
  if (!values.privacyLogRetention) {
    throw new Error("PRIVACY_LOG_RETENTION is required");
  }
  if (!values.privacyProcessorsAndTransfers) {
    throw new Error("PRIVACY_PROCESSORS_AND_TRANSFERS is required");
  }
  for (const [name, value] of [
    ["MAP_DOWNLOAD_URL", values.mapDownloadUrl],
    ["VERSION_DOWNLOAD_URL", values.versionDownloadUrl],
  ]) {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      throw new Error(`${name} must be a valid URL`);
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error(`${name} must use HTTP or HTTPS`);
    }
  }
};
