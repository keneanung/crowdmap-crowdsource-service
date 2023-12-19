import { app } from "./app";
import { config } from "./config/values";
import fetch from "node-fetch";
import * as fs from "fs";

if (!fs.existsSync(config.mapFile)) {
  fetch(config.mapDownloadUrl).then((res) => {
    const fileStream = fs.createWriteStream(config.mapFile);
    new Promise((resolve, reject) => {
      res.body?.on("error", reject);
      res.body?.pipe(fileStream);
      fileStream.on("finish", resolve);
    });
  });
}

app.listen(config.port, () =>
  console.log(`Example app listening at http://localhost:${config.port}`)
);