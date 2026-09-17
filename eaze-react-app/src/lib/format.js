/**
 * Eaze code formatter.
 *
 * Deliberately conservative: it only touches layout (indentation, stray
 * whitespace, blank-line runs) so formatting can never change what a program
 * does. Block structure comes straight from the parser grammar —
 * `if` / `else` / `repeat … times` / `while` / `define` open a block and
 * `end` closes it; `else` closes one level and opens another.
 */

const DEDENT_BEFORE = /^(end|else)\b/;
const INDENT_AFTER = /^(if|else|repeat|while|define)\b/;

export function formatEaze(code, tabSize = 4) {
  const size = Math.max(1, Math.min(8, Number(tabSize) || 4));
  const unit = " ".repeat(size);

  const lines = String(code ?? "")
    .replace(/\r\n?/g, "\n")
    .split("\n");

  const formatted = [];
  let depth = 0;

  for (const raw of lines) {
    const line = raw.trim();

    if (!line) {
      formatted.push("");
      continue;
    }

    if (DEDENT_BEFORE.test(line)) depth = Math.max(0, depth - 1);
    formatted.push(unit.repeat(depth) + line);
    if (INDENT_AFTER.test(line)) depth += 1;
  }

  // Collapse runs of blank lines and drop blank edges.
  const tidy = [];
  for (const line of formatted) {
    if (line === "" && tidy[tidy.length - 1] === "") continue;
    tidy.push(line);
  }
  while (tidy.length && tidy[0] === "") tidy.shift();
  while (tidy.length && tidy[tidy.length - 1] === "") tidy.pop();

  return tidy.join("\n");
}

/** True when formatting would actually change the buffer. */
export function needsFormatting(code, tabSize = 4) {
  return formatEaze(code, tabSize) !== String(code ?? "").replace(/\r\n?/g, "\n");
}
