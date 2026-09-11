import { Server } from "node:http";
import { app } from "./app.js";
import { config } from "./config/values.js";
import { iocContainer } from "./ioc/ioc.js";
import { log } from "./observability.js";
import { ChangeService } from "./services/changeService.js";
import { MapService } from "./services/mapService.js";
import { UserService } from "./services/userService.js";

const userService = iocContainer.get<UserService>(UserService, {
  autobind: true,
});
const changeService = iocContainer.get<ChangeService>(ChangeService);
const mapService = iocContainer.get<MapService>(MapService);

const checkAdminUser = userService.getUser("admin").then(async (adminUser) => {
  if (adminUser) return;
  if (!config.initialAdminApiKey) {
    throw new Error(
      "platform.initialAdminApiKey is required when creating the first admin user",
    );
  }
  const created = await userService.createUserIfMissing(
    "admin",
    ["site_admin", "map_admin"],
    config.initialAdminApiKey,
    config.projects.map(({ id }) => id),
  );
  if (created) log("info", "initial_admin_created");
});

const initializeProjects = async (): Promise<void> => {
  const results = await Promise.allSettled(
    config.projects.map((project) => mapService.initializeProject(project)),
  );
  results.forEach((result, index) => {
    const project = config.projects[index];
    if (result.status === "rejected")
      log("error", "project_initialization_failed", {
        projectId: project.id,
        error: result.reason,
      });
    else log("info", "project_initialized", { projectId: project.id });
  });
};

let server: Server | undefined;
let shuttingDown = false;
const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
  if (shuttingDown) return;
  shuttingDown = true;
  log("info", "shutdown_started", { signal });
  const forcedExit = setTimeout(() => {
    log("error", "graceful_shutdown_timed_out");
    process.exit(1);
  }, 10_000);
  forcedExit.unref();
  try {
    if (server)
      await new Promise<void>((resolve, reject) => {
        server?.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    await iocContainer.unbindAll();
    clearTimeout(forcedExit);
  } catch (error) {
    log("error", "graceful_shutdown_failed", { error });
    process.exitCode = 1;
  }
};

Promise.all([
  changeService.initialize(),
  checkAdminUser,
  initializeProjects(),
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
  (error: unknown) => {
    log("error", "server_startup_failed", { error });
    process.exit(1);
  },
);
