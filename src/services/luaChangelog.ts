import type { ChangelogNotes } from "../models/business/changelog.js";

// The existing mapper uses cecho: neutralize color tags while preserving readable text.
const displayText = (text: string): string =>
  text.replaceAll("<", "‹").replaceAll(">", "›");
const luaString = (text: string): string =>
  '"' +
  Array.from(text, (char) => {
    if (char === "\\") return "\\\\";
    if (char === '"') return '\\"';
    if (char === "\n") return "\\n";
    if (char === "\r") return "\\r";
    if (char === "\t") return "\\t";
    const code = char.charCodeAt(0);
    return code < 32 || code === 127
      ? `\\${code.toString().padStart(3, "0")}`
      : char;
  }).join("") +
  '"';

/** One current-map entry per area; the last item is the mapper's Latest changes summary. */
export function serializeLuaChangelog(notes: ChangelogNotes): string {
  const groups = new Map<string, { heading: string; lines: string[] }>();
  for (const entry of notes.entries) {
    const key = JSON.stringify([entry.areaId, entry.areaName]);
    let group = groups.get(key);
    if (!group) {
      group = { heading: displayText(entry.areaName), lines: [] };
      groups.set(key, group);
    }
    group.lines.push(
      `    • ${displayText(entry.text).replaceAll("\n", "\n      ")}`,
    );
  }
  const entries = [...groups.values()].map(
    (group) => `${group.heading}\n${group.lines.join("\n")}`,
  );
  entries.push(displayText(notes.summary).replace(/[\r\n\t]+/g, " "));
  return `changelog = {\n${entries.map((entry) => `  ${luaString(entry)},`).join("\n")}\n}\n`;
}
