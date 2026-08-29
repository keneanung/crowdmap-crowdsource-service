import * as fs from "fs";
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
const checkAdminUser = userService
  .createUserIfMissing("admin", ["site_admin", "map_admin"])
  .then((apiKey) => {
    if (!apiKey) {
      return;
    }
    console.log(`Generated admin API Key: ${apiKey}`);
  });

Promise.all([
  mapDownloadPromise,
  mapVersionDownloadPromise,
  checkAdminUser,
]).then(
  () => {
    app.listen(config.port, () => {
      console.log(
        `Crowdmap service listening at http://localhost:${config.port.toString()}`,
      );
    });
  },
  (err: unknown) => {
    console.error(err);
    process.exit(1);
  },
);
