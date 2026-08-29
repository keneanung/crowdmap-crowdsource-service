import * as fs from "fs";
import { Server } from "node:http";
import { app } from "./app";
import { config, validateConfig } from "./config/values";
import { downloadMapFile, downloadMapVersion } from "./fileDownloads";
import { iocContainer } from "./ioc/ioc";
import { log } from "./observability";
import { UserService } from "./services/userService";

validateConfig();

let mapDownloadPromise;
if (!fs.existsSync(config.mapFile)) {
  mapDownloadPromise = downloadMapFile().catch((err: unknown) => {
    log("error", "map_download_failed", { error: err });
    process.exit(1);
  });
} else {
  mapDownloadPromise = Promise.resolve();
}

let mapVersionDownloadPromise;
if (!fs.existsSync(config.versionFile)) {
  mapVersionDownloadPromise = downloadMapVersion().catch((err: unknown) => {
    log("error", "map_version_download_failed", { error: err });
    process.exit(1);
  });
} else {
  mapVersionDownloadPromise = Promise.resolve();
}

const userService = iocContainer.get<UserService>(UserService, {autobind: true});
const checkAdminUser = userService.getUser("admin").then(async (adminUser) => {
  if (adminUser) {
    return;
  }
  if (!config.initialAdminApiKey) {
    throw new Error(
      "INITIAL_ADMIN_API_KEY is required when creating the first admin user",
    );
  }
  const created = await userService.createUserIfMissing(
    "admin",
    ["site_admin", "map_admin"],
    config.initialAdminApiKey,
  );
  if (created) {
    log("info", "initial_admin_created");
  }
});

let server: Server | undefined;
let shuttingDown = false;

const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  log("info", "shutdown_started", { signal });
  const forcedExit = setTimeout(() => {
    log("error", "graceful_shutdown_timed_out");
    process.exit(1);
  }, 10_000);
  forcedExit.unref();

  try {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server?.close((error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
    }
    await iocContainer.unbindAll();
    clearTimeout(forcedExit);
  } catch (error) {
    log("error", "graceful_shutdown_failed", { error });
    process.exitCode = 1;
  }
};

Promise.all([
  mapDownloadPromise,
  mapVersionDownloadPromise,
  checkAdminUser,
]).then(
  () => {
    server = app.listen(config.port, () => {
      log("info", "server_listening", { port: config.port });
    });
    process.once("SIGTERM", () => {
      void shutdown("SIGTERM");
    });
    process.once("SIGINT", () => {
      void shutdown("SIGINT");
    });
  },
  (err: unknown) => {
    log("error", "server_startup_failed", { error: err });
    process.exit(1);
  },
);
