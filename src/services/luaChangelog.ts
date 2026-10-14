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

/** The mapper displays every item and uses the final one as Latest changes. */
export function serializeLuaChangelog(notes: ChangelogNotes): string {
  const prose = displayText(notes.text);
  const opening = new Intl.Segmenter("en", { granularity: "sentence" })
    .segment(prose)
    [Symbol.iterator]()
    .next().value;
  const headline = opening?.segment.trim() ?? "";
  const body = prose.slice(opening?.segment.length ?? 0);
  const summary = headline.replace(/[\r\n\t]+/g, " ").trim();
  const characters = Array.from(summary);
  const latest =
    characters.length > 600
      ? characters.slice(0, 597).join("") + "..."
      : summary;
  const entries = body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  // The last item is the mapper's title. Preserve an unusually long title in
  // full as well, since the Latest changes line needs a bounded excerpt.
  if (characters.length > 600) entries.push(headline);
  entries.push(latest);
  return `changelog = {\n${entries.map((entry) => `  ${luaString(entry)},`).join("\n")}\n}\n`;
}
