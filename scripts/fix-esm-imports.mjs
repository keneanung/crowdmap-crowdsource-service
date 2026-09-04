import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const roots = ["src", "test", "generated"];
const extension = /\.(?:[cm]?js|json|node)$/u;

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((entry) => {
        const file = join(directory, entry.name);
        if (entry.isDirectory()) return filesIn(file);
        return entry.name.endsWith(".ts") ? [file] : [];
      }),
    )
  ).flat();
}

for (const root of roots) {
  for (const file of await filesIn(root)) {
    const source = await readFile(file, "utf8");
    const updated = source.replace(
      /(from\s+["'])(\.{1,2}\/[^"']+)(["'])/gu,
      (_match, prefix, specifier, suffix) =>
        prefix + (extension.test(specifier) ? specifier : specifier + ".js") + suffix,
    );
    if (updated !== source) await writeFile(file, updated);
  }
}
