import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config();

export const config = {
  port: process.env.PORT ?? 3000,
  mapFile: process.env.MAP_FILE ?? path.join(process.cwd(), "map"),
  mapDownloadUrl:
    process.env.MAP_DOWNLOAD_URL ??
    "https://ire-mudlet-mapping.github.io/AchaeaCrowdmap/Map/map",
  connectionString: process.env.MONGO_CONNECTION_STRING,
  dbName: process.env.MONGO_DB_NAME,
};
