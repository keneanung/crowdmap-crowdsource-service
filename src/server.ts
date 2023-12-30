import * as fs from "fs";
import { Readable } from "stream";
import { app } from "./app";
import { config } from "./config/values";

if (!fs.existsSync(config.mapFile)) {
  fetch(config.mapDownloadUrl)
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
}

if (!fs.existsSync(config.versionFile)) {
  fetch(config.versionDownloadUrl)
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
}

app.listen(config.port, () => {
  console.log(`Example app listening at http://localhost:${config.port}`);
});
