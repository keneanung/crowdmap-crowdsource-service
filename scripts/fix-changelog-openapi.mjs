import { readFile, writeFile } from "node:fs/promises";

// TSOA describes Readable as base64; the changelog sends ordinary UTF-8 text.
const path = new URL("../generated/swagger.json", import.meta.url);
const spec = JSON.parse(await readFile(path, "utf8"));
const response = spec.paths["/map/changelog"].get.responses["200"];
response.content = {
  "text/plain": { schema: { type: "string" } },
};
await writeFile(path, JSON.stringify(spec, null, 2) + "\n");
