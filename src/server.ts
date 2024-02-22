import * as fs from "fs";
import { app } from "./app";
import { config } from "./config/values";
import { downloadMapFile, downloadMapVersion } from "./fileDownloads";
import { iocContainer } from "./ioc/ioc";
import { UserService } from "./services/userService";

let mapDownloadPromise;
if (!fs.existsSync(config.mapFile)) {
  mapDownloadPromise = downloadMapFile().catch((err) => {
    console.error(err);
    process.exit(1);
  });
} else {
  mapDownloadPromise = Promise.resolve();
}

let mapVersionDownloadPromise;
if (!fs.existsSync(config.versionFile)) {
  mapVersionDownloadPromise = downloadMapVersion().catch((err) => {
    console.error(err);
    process.exit(1);
  });
} else {
  mapVersionDownloadPromise = Promise.resolve();
}

const userService = iocContainer.resolve<UserService>(UserService);
const checkAdminUser = userService.getUsers().then((users) => {
  const adminUser = users.find((user) => user.name === "admin");
  if (!adminUser) {
    const apiKey = userService.generateApiKey();
    console.log(`Generated admin API Key: ${apiKey}`);
    return userService.addUser("admin", apiKey, ["site_admin", "map_admin"]);
  }
  return Promise.resolve();
});

Promise.all([
  mapDownloadPromise,
  mapVersionDownloadPromise,
  checkAdminUser,
]).then(
  () => {
    app.listen(config.port, () => {
      console.log(
        `Crowdmap service listening at http://localhost:${config.port}`,
      );
    });
  },
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
