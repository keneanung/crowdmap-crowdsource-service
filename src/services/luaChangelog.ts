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

/** Preserve the mapper's full-notes array and final Latest changes item. */
export function serializeLuaChangelog(notes: ChangelogNotes): string {
  const prose = displayText(notes.text);
  const summary = prose
    .split(/\n\s*\n/u)[0]
    .replace(/[\r\n\t]+/g, " ")
    .trim();
  const characters = Array.from(summary);
  const latest =
    characters.length > 600
      ? characters.slice(0, 597).join("") + "..."
      : summary;
  return `changelog = {\n  ${luaString(prose)},\n  ${luaString(latest)},\n}\n`;
}
