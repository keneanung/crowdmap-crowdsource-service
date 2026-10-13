import { readFile, writeFile } from "node:fs/promises";

// TSOA applies the inferred MapChangelog | Readable union to both media types
// and describes Readable as base64. The wire responses have distinct schemas.
const path = new URL("../generated/swagger.json", import.meta.url);
const spec = JSON.parse(await readFile(path, "utf8"));
const response = spec.paths["/map/changelog"].get.responses["200"];
response.content = {
  "application/json": {
    schema: { $ref: "#/components/schemas/MapChangelog" },
  },
  "text/plain": { schema: { type: "string" } },
};
await writeFile(path, JSON.stringify(spec, null, 2) + "\n");
