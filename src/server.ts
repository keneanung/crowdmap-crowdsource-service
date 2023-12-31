import * as fs from "fs";
import { Readable } from "stream";
import { app } from "./app";
import { config } from "./config/values";

let mapDownloadPromise;
if (!fs.existsSync(config.mapFile)) {
  mapDownloadPromise = fetch(config.mapDownloadUrl)
    .then((res) => {
      const fileStream = fs.createWriteStream(config.mapFile);
      new Promise((resolve, reject) => {
        if (res.body === null) {
          throw Error("No body");
        }
        const readable = Readable.fromWeb(res.body);
        readable.on("error", reject);
        readable.pipe(fileStream);
        fileStream.on("finish", resolve);
      }).catch((err) => {
        console.error(err);
        throw Error("Failed to download map file", {
          cause: err,
        });
      });
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
} else {
  mapDownloadPromise = Promise.resolve();
}

let mapVersionDownloadPromise;
if (!fs.existsSync(config.versionFile)) {
  mapVersionDownloadPromise = fetch(config.versionDownloadUrl)
    .then((res) => {
      const fileStream = fs.createWriteStream(config.versionFile);
      new Promise((resolve, reject) => {
        if (res.body === null) {
          throw Error("No body");
        }
        const readable = Readable.fromWeb(res.body);
        readable.on("error", reject);
        readable.pipe(fileStream);
        fileStream.on("finish", resolve);
      }).catch((err) => {
        console.error(err);
        throw Error("Failed to download version file", {
          cause: err,
        });
      });
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
} else {
  mapVersionDownloadPromise = Promise.resolve();
}

Promise.all([mapDownloadPromise, mapVersionDownloadPromise]).then(
  () => {
    app.listen(config.port, () => {
      console.log(`Example app listening at http://localhost:${config.port}`);
    });
  },
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
