/**
 * 5-row block font used to render the MAGI-style giant ASCII wordmark for
 * arbitrary agent names inside each shape on the flow canvas.
 *
 * Each glyph is exactly `GLYPH_HEIGHT` rows tall and `GLYPH_WIDTH` cols wide;
 * non-filled cells are regular spaces so adjacent glyphs align in a monospace
 * `<pre>` render. Unknown characters fall back to a blank glyph.
 */

export const GLYPH_HEIGHT = 5
export const GLYPH_WIDTH = 5
export const GLYPH_GAP = 1

const BLANK: string[] = ["     ", "     ", "     ", "     ", "     "]

const GLYPHS: Record<string, string[]> = {
  A: [
    " ███ ",
    "█   █",
    "█████",
    "█   █",
    "█   █",
  ],
  B: [
    "████ ",
    "█   █",
    "████ ",
    "█   █",
    "████ ",
  ],
  C: [
    " ████",
    "█    ",
    "█    ",
    "█    ",
    " ████",
  ],
  D: [
    "████ ",
    "█   █",
    "█   █",
    "█   █",
    "████ ",
  ],
  E: [
    "█████",
    "█    ",
    "████ ",
    "█    ",
    "█████",
  ],
  F: [
    "█████",
    "█    ",
    "████ ",
    "█    ",
    "█    ",
  ],
  G: [
    " ████",
    "█    ",
    "█  ██",
    "█   █",
    " ████",
  ],
  H: [
    "█   █",
    "█   █",
    "█████",
    "█   █",
    "█   █",
  ],
  I: [
    "█████",
    "  █  ",
    "  █  ",
    "  █  ",
    "█████",
  ],
  J: [
    "█████",
    "    █",
    "    █",
    "█   █",
    " ███ ",
  ],
  K: [
    "█   █",
    "█  █ ",
    "███  ",
    "█  █ ",
    "█   █",
  ],
  L: [
    "█    ",
    "█    ",
    "█    ",
    "█    ",
    "█████",
  ],
  M: [
    "█   █",
    "██ ██",
    "█ █ █",
    "█   █",
    "█   █",
  ],
  N: [
    "█   █",
    "██  █",
    "█ █ █",
    "█  ██",
    "█   █",
  ],
  O: [
    " ███ ",
    "█   █",
    "█   █",
    "█   █",
    " ███ ",
  ],
  P: [
    "████ ",
    "█   █",
    "████ ",
    "█    ",
    "█    ",
  ],
  Q: [
    " ███ ",
    "█   █",
    "█ █ █",
    "█  █ ",
    " ██ █",
  ],
  R: [
    "████ ",
    "█   █",
    "████ ",
    "█  █ ",
    "█   █",
  ],
  S: [
    " ████",
    "█    ",
    " ███ ",
    "    █",
    "████ ",
  ],
  T: [
    "█████",
    "  █  ",
    "  █  ",
    "  █  ",
    "  █  ",
  ],
  U: [
    "█   █",
    "█   █",
    "█   █",
    "█   █",
    " ███ ",
  ],
  V: [
    "█   █",
    "█   █",
    "█   █",
    " █ █ ",
    "  █  ",
  ],
  W: [
    "█   █",
    "█   █",
    "█ █ █",
    "██ ██",
    "█   █",
  ],
  X: [
    "█   █",
    " █ █ ",
    "  █  ",
    " █ █ ",
    "█   █",
  ],
  Y: [
    "█   █",
    " █ █ ",
    "  █  ",
    "  █  ",
    "  █  ",
  ],
  Z: [
    "█████",
    "   █ ",
    "  █  ",
    " █   ",
    "█████",
  ],
  "0": [
    " ███ ",
    "█   █",
    "█   █",
    "█   █",
    " ███ ",
  ],
  "1": [
    "  █  ",
    " ██  ",
    "  █  ",
    "  █  ",
    "█████",
  ],
  "2": [
    " ███ ",
    "█   █",
    "   █ ",
    "  █  ",
    "█████",
  ],
  "3": [
    "████ ",
    "    █",
    " ███ ",
    "    █",
    "████ ",
  ],
  "4": [
    "█   █",
    "█   █",
    "█████",
    "    █",
    "    █",
  ],
  "5": [
    "█████",
    "█    ",
    "████ ",
    "    █",
    "████ ",
  ],
  "6": [
    " ████",
    "█    ",
    "████ ",
    "█   █",
    " ███ ",
  ],
  "7": [
    "█████",
    "    █",
    "   █ ",
    "  █  ",
    " █   ",
  ],
  "8": [
    " ███ ",
    "█   █",
    " ███ ",
    "█   █",
    " ███ ",
  ],
  "9": [
    " ███ ",
    "█   █",
    " ████",
    "    █",
    "████ ",
  ],
  "-": [
    "     ",
    "     ",
    "█████",
    "     ",
    "     ",
  ],
  " ": BLANK,
}

/**
 * Convert `text` into a multi-line MAGI-style ASCII block rendering.
 * Unsupported characters render as blank space. The returned string uses
 * newline separators; callers should render inside a `<pre>` / `white-space:
 * pre` element to preserve alignment.
 */
export function toAsciiBlock(text: string): string {
  const chars = text.toUpperCase().split("")
  if (chars.length === 0) return ""

  const rows: string[] = Array.from({ length: GLYPH_HEIGHT }, () => "")
  chars.forEach((ch, index) => {
    const glyph = GLYPHS[ch] ?? BLANK
    for (let r = 0; r < GLYPH_HEIGHT; r++) {
      rows[r] += glyph[r]
      if (index < chars.length - 1) {
        rows[r] += " ".repeat(GLYPH_GAP)
      }
    }
  })
  return rows.join("\n")
}

/** Rendered character-grid width for a given string (glyphs + gaps). */
export function asciiBlockWidth(text: string): number {
  const n = text.length
  if (n <= 0) return 0
  return n * GLYPH_WIDTH + Math.max(0, n - 1) * GLYPH_GAP
}
