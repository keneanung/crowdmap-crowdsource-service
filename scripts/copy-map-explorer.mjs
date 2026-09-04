import { copyFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(root, "node_modules/mudlet-map-browser-script/dist");
const target = resolve(root, "website/javascripts");

await mkdir(target, { recursive: true });
await Promise.all([
  copyFile(resolve(source, "index.min.js"), resolve(target, "map-explorer.js")),
  copyFile(resolve(source, "index.min.css"), resolve(target, "map-explorer.css")),
]);
