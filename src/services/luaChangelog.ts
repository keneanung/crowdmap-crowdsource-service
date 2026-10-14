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
  const sentences = Array.from(
    new Intl.Segmenter("en", { granularity: "sentence" }).segment(prose),
    ({ segment }) => segment.trim(),
  ).filter(Boolean);
  const headline = sentences.shift() ?? "";
  const summary = headline.replace(/[\r\n\t]+/g, " ").trim();
  const characters = Array.from(summary);
  const latest =
    characters.length > 600
      ? characters.slice(0, 597).join("") + "..."
      : summary;
  const body = sentences.join("\n");
  const entries = body ? [body] : [];
  // The last item is the mapper's title. Preserve an unusually long title in
  // full as well, since the Latest changes line needs a bounded excerpt.
  if (characters.length > 600) entries.push(headline);
  entries.push(latest);
  return `changelog = {\n${entries.map((entry) => `  ${luaString(entry)},`).join("\n")}\n}\n`;
}
