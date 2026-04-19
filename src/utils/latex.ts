/**
 * Normalize common non-`$`-delimited LaTeX shapes emitted by LLMs into the
 * `$...$` / `$$...$$` form that remark-math understands. Leaves ordinary
 * prose and genuine code blocks untouched.
 */
export function normalizeLatex(text: string): string {
  let out = text

  // 1. ChatGPT/Claude-style block math delimiters -> $$...$$
  out = out.replace(/\\\[([\s\S]+?)\\\]/g, (_, inner) => `\n$$${inner.trim()}$$\n`)

  // 2. Inline math delimiters -> $...$
  out = out.replace(/\\\(([\s\S]+?)\\\)/g, (_, inner) => `$${inner.trim()}$`)

  // 3. Fenced code blocks whose language tag is explicitly math/latex/tex
  out = out.replace(
    /```(?:latex|tex|math)\s*\n([\s\S]*?)\n```/gi,
    (_, inner) => `\n$$${inner.trim()}$$\n`
  )

  // 4. Bare fenced code blocks whose body is pure LaTeX.
  out = out.replace(/```\s*\n([\s\S]*?)\n```/g, (match, inner) => {
    return looksLikePureLatex(inner) ? `\n$$${inner.trim()}$$\n` : match
  })

  // 5. Indented code blocks (4+ leading spaces) whose body is pure LaTeX.
  //    Match a contiguous run of such lines preceded by a blank line.
  out = out.replace(
    /(^|\n)(\n)((?:    [^\n]*\n?)+)(?=\n|$)/g,
    (whole, pre, blank, block) => {
      const dedented = block.replace(/^ {4}/gm, "").trimEnd()
      if (!looksLikePureLatex(dedented)) return whole
      return `${pre}${blank}$$${dedented}$$\n`
    }
  )

  return out
}

function looksLikePureLatex(body: string): boolean {
  const lines = body.split("\n").filter((l) => l.trim().length > 0)
  if (lines.length === 0) return false
  const allBackslashStart = lines.every((l) => /^\s*\\/.test(l))
  const hasTexCommand =
    /\\(frac|int|sum|prod|partial|sqrt|lim|alpha|beta|gamma|delta|theta|lambda|mu|sigma|omega|phi|psi|pi|cdot|leq|geq|times|pm|infty|mathbb|mathcal|hat|bar|vec|tilde|left|right|operatorname|begin|end)\b/.test(
      body
    )
  return allBackslashStart && hasTexCommand
}
