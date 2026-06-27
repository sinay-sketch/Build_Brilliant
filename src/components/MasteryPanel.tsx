import { useUserData } from '../context/UserDataContext'
import { summarizeMastery } from '../lib/mastery'

const LEVEL_COLOR: Record<string, string> = {
  new: 'var(--color-line-strong)',
  learning: 'var(--color-brand)',
  mastered: 'var(--color-success)',
}

/** Per-concept mastery bars, so the learner sees exactly where they stand. */
export default function MasteryPanel() {
  const { mastery } = useUserData()
  const concepts = summarizeMastery(mastery)
  const started = concepts.filter((c) => c.record && c.record.attempts > 0)
  const masteredCount = concepts.filter((c) => c.level === 'mastered').length

  return (
    <div className="card animate-fade-up p-5" style={{ animationDelay: '300ms' }}>
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-lg font-semibold text-ink">Concept mastery</h2>
        <span className="text-xs text-ink-mute">
          {masteredCount}/{concepts.length} mastered
        </span>
      </div>

      {started.length === 0 && (
        <p className="mt-1 text-sm text-ink-soft">
          Every concept in the course is listed here. Answer problems to fill these bars.
        </p>
      )}

      {/* The full concept list is always shown, even before any problem is answered. */}
      <ul className="mt-3 space-y-3">
        {concepts.map((c) => {
          const score = c.record?.score ?? 0
          const pct = Math.round(score * 100)
          const attempted = (c.record?.attempts ?? 0) > 0
          return (
            <li key={c.concept}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className={attempted ? 'text-ink' : 'text-ink-mute'}>{c.label}</span>
                <span className="text-xs font-medium text-ink-mute">{attempted ? `${pct}%` : '—'}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-track">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${attempted ? Math.max(pct, 4) : 0}%`, backgroundColor: LEVEL_COLOR[c.level] }}
                />
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
