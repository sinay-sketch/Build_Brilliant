import { useEffect, useRef, useState } from 'react'
import type { Lesson, Step } from '../types/content'
import { AI_FEATURES } from '../lib/ai/flags'
import { requestHint, requestChatReply } from '../lib/ai/client'
import { buildStepContext, describeAnswer } from '../lib/ai/context'
import type { ChatMessage } from '../lib/ai/types'
import { renderSci } from './Sci'

interface Props {
  lesson: Lesson
  step: Step
  /** How many times the learner has submitted this step. */
  attempts: number
  /** The learner's most recent answer (raw choice id or number), if any. */
  lastAnswer: string | number | null
  /** True once the step is answered correctly. */
  solved: boolean
  masteryScore?: number
}

/** Authored hints to fall back on when AI is off or unreachable. */
function authoredHints(step: Step): string[] {
  if ('hints' in step && Array.isArray(step.hints) && step.hints.length > 0) {
    return step.hints
  }
  return [
    'Re-read the prompt and recall the core idea of this concept.',
    'Try ruling out the options that cannot be right, then reason about the rest.',
  ]
}

export default function AiTutor({ lesson, step, attempts, lastAnswer, solved, masteryScore }: Props) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const authoredIdx = useRef(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  const tutorAI = AI_FEATURES.tutor
  const lastWrong =
    attempts > 0 && !solved && lastAnswer != null ? describeAnswer(step, lastAnswer) : undefined

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  const nextAuthored = () => {
    const hints = authoredHints(step)
    const h = hints[Math.min(authoredIdx.current, hints.length - 1)]
    authoredIdx.current += 1
    return h
  }

  const openTutor = async () => {
    setOpen(true)
    if (messages.length > 0) return
    if (!tutorAI) {
      setMessages([{ role: 'assistant', content: nextAuthored() }])
      return
    }
    setLoading(true)
    const ctx = buildStepContext(lesson, step)
    const hint = await requestHint({
      ...ctx,
      attempts,
      lastWrongAnswer: lastWrong,
      hintLevel: 1,
      masteryScore,
    })
    setMessages([{ role: 'assistant', content: hint ?? nextAuthored() }])
    setLoading(false)
  }

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    const next: ChatMessage[] = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setInput('')

    if (!tutorAI) {
      setMessages([...next, { role: 'assistant', content: nextAuthored() }])
      return
    }
    setLoading(true)
    const ctx = buildStepContext(lesson, step)
    const reply = await requestChatReply({ ...ctx, messages: next, learnerAnswer: lastWrong })
    setMessages([
      ...next,
      {
        role: 'assistant',
        content: reply ?? `I can't reach the tutor right now, but here's a hint: ${nextAuthored()}`,
      },
    ])
    setLoading(false)
  }

  if (solved) return null

  if (!open) {
    return (
      <button
        type="button"
        onClick={openTutor}
        className="inline-flex items-center gap-1.5 rounded-lg border border-brand/30 bg-brand-tint px-3 py-2 text-sm font-semibold text-brand-strong transition hover:bg-brand-soft"
      >
        <span aria-hidden>💡</span> I&apos;m stuck — get a hint
      </button>
    )
  }

  return (
    <div className="animate-pop-in overflow-hidden rounded-xl border border-brand/20 bg-brand-tint/60">
      <div className="flex items-center justify-between border-b border-brand/15 px-3.5 py-2">
        <p className="eyebrow flex items-center gap-1.5 text-brand">
          <span aria-hidden>✦</span> Tutor
          {loading && (
            <span className="ml-1 inline-block h-3 w-3 animate-spin rounded-full border border-brand border-t-transparent" />
          )}
        </p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs font-medium text-ink-mute transition hover:text-ink"
          aria-label="Close tutor"
        >
          Close ✕
        </button>
      </div>

      <div ref={scrollRef} className="max-h-72 space-y-2.5 overflow-y-auto px-3.5 py-3">
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'rounded-br-sm bg-brand text-white'
                  : 'rounded-bl-sm border border-line bg-surface text-ink'
              }`}
            >
              {m.role === 'assistant' ? renderSci(m.content) : m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm border border-line bg-surface px-3 py-2 text-sm text-ink-mute">
              thinking…
            </div>
          </div>
        )}
      </div>

      {tutorAI && (
        <div className="border-t border-brand/15 p-2.5">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void send()
                }
              }}
              rows={1}
              placeholder="Ask a question…"
              className="max-h-24 min-h-[2.5rem] flex-1 resize-none rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none transition focus:border-brand"
            />
            <button
              type="button"
              onClick={send}
              disabled={loading || !input.trim()}
              className="btn-primary shrink-0 px-4 py-2.5 text-sm disabled:opacity-60"
            >
              Send
            </button>
          </div>
          <p className="mt-1.5 px-1 text-[11px] text-ink-mute">
            The tutor helps you reason it out — it won&apos;t give you the final answer.
          </p>
        </div>
      )}
    </div>
  )
}
