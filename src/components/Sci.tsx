import { Fragment } from 'react'

/**
 * Renders physics notation with proper subscripts/superscripts.
 *   "v_x"      -> v with a small x lowered to the bottom-right
 *   "v_y"      -> v with a small y lowered to the bottom-right
 *   "v^2"      -> v squared (use either ^2 or the ² character)
 *   "v_{xy}"   -> multi-character subscript via braces
 * Anything else is passed through untouched.
 */
export function renderSci(text: string): React.ReactNode {
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
