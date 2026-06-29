import { Fragment } from 'react'

/**
 * Convert LaTeX-flavoured math (which the AI tutor sometimes emits) into the
 * plain notation this app renders, so "\(2d/g\)" or "\sqrt{2d/g}" never reach
 * the screen as raw markup. Subscripts/superscripts are left as `_`/`^` for
 * renderSci to format. Authored content uses plain notation already, so this is
 * a no-op for it.
 */
export function cleanMath(text: string): string {
  return (
    text
      // inline / display math delimiters
      .replace(/\\[()[\]]/g, '')
      .replace(/\$\$?/g, '')
      // structural commands -> plain equivalents
      .replace(/\\frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, '($1)/($2)')
      .replace(/\\sqrt\s*\{([^{}]*)\}/g, '√($1)')
      .replace(/\\sqrt\s+(\w+)/g, '√$1')
      .replace(/\\text\s*\{([^{}]*)\}/g, '$1')
      .replace(/\\(?:left|right)\b/g, '')
      // operators & symbols
      .replace(/\\cdot/g, '·')
      .replace(/\\times/g, '×')
      .replace(/\\div/g, '÷')
      .replace(/\\pm/g, '±')
      .replace(/\\(?:leq|le)\b/g, '≤')
      .replace(/\\(?:geq|ge)\b/g, '≥')
      .replace(/\\(?:neq|ne)\b/g, '≠')
      .replace(/\\approx/g, '≈')
      .replace(/\\Delta/g, 'Δ')
      .replace(/\\(?:theta)\b/g, 'θ')
      .replace(/\\pi\b/g, 'π')
      .replace(/\^?\\circ|\\degree/g, '°')
      // thin spaces
      .replace(/\\[,;:!]/g, ' ')
      // any remaining \command -> drop the backslash, keep the word
      .replace(/\\([a-zA-Z]+)/g, '$1')
  )
}

/**
 * Renders physics notation with proper subscripts/superscripts.
 *   "v_x"      -> v with a small x lowered to the bottom-right
 *   "v_y"      -> v with a small y lowered to the bottom-right
 *   "v^2"      -> v squared (use either ^2 or the ² character)
 *   "v_{xy}"   -> multi-character subscript via braces
 * LaTeX-flavoured input is normalised first (see cleanMath). Anything else is
 * passed through untouched.
 */
export function renderSci(rawText: string): React.ReactNode {
  const text = cleanMath(rawText)
  const out: React.ReactNode[] = []
  let buf = ''
  let i = 0

  const flush = () => {
    if (buf) {
      out.push(buf)
      buf = ''
    }
  }

  while (i < text.length) {
    const ch = text[i]
    if ((ch === '_' || ch === '^') && i + 1 < text.length) {
      flush()
      let content = ''
      if (text[i + 1] === '{') {
        const end = text.indexOf('}', i + 2)
        if (end !== -1) {
          content = text.slice(i + 2, end)
          i = end + 1
        } else {
          content = text[i + 1]
          i += 2
        }
      } else {
        content = text[i + 1]
        i += 2
      }
      out.push(
        ch === '_' ? (
          <sub className="text-[0.68em]">{content}</sub>
        ) : (
          <sup className="text-[0.68em]">{content}</sup>
        ),
      )
    } else {
      buf += ch
      i++
    }
  }
  flush()

  return out.map((n, idx) => <Fragment key={idx}>{n}</Fragment>)
}

export default function Sci({ children, className }: { children: string; className?: string }) {
  return <span className={className}>{renderSci(children)}</span>
}
