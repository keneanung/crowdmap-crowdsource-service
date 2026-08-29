import * as fs from "fs";
import { Server } from "node:http";
import { app } from "./app";
import { config, validateConfig } from "./config/values";
import { downloadMapFile, downloadMapVersion } from "./fileDownloads";
import { iocContainer } from "./ioc/ioc";
import { UserService } from "./services/userService";

validateConfig();

let mapDownloadPromise;
if (!fs.existsSync(config.mapFile)) {
  mapDownloadPromise = downloadMapFile().catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  });
} else {
  mapDownloadPromise = Promise.resolve();
}

let mapVersionDownloadPromise;
if (!fs.existsSync(config.versionFile)) {
  mapVersionDownloadPromise = downloadMapVersion().catch((err: unknown) => {
    console.error(err);
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
    console.log("Created initial admin user from configured credentials");
  }
});

let server: Server | undefined;
let shuttingDown = false;

const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  console.log(`Received ${signal}; shutting down`);
  const forcedExit = setTimeout(() => {
    console.error("Graceful shutdown timed out");
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
    console.error("Graceful shutdown failed", error);
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
      console.log(
        `Crowdmap service listening at http://localhost:${config.port.toString()}`,
      );
    });
    process.once("SIGTERM", () => {
      void shutdown("SIGTERM");
    });
    process.once("SIGINT", () => {
      void shutdown("SIGINT");
    });
  },
  (err: unknown) => {
    console.error(err);
    process.exit(1);
  },
);
