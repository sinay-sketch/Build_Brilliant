import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useUserData } from '../context/UserDataContext'
import { lessonMetas } from '../content/course'
import { recommendNext } from '../lib/path'
import { CONCEPT_META, weakestConcept } from '../lib/mastery'
import { fallbackCoachMessage, getCoachMessage } from '../lib/ai/coach'
import { AI_FEATURES } from '../lib/ai/flags'

/**
 * The adaptive coach blurb on Home. Renders an instant authored message, then
 * upgrades it with an AI-tailored one when available. The recommendation itself
 * (which lesson/concept) is deterministic; AI only personalizes the wording.
 */
export default function CoachCard() {
  const { profile, progress, mastery } = useUserData()
  const firstName = profile?.displayName?.split(' ')[0]

  const lessonsCompleted = useMemo(
    () => lessonMetas.filter((m) => progress[m.id]?.status === 'completed').length,
    [progress],
  )
  const next = useMemo(() => recommendNext(lessonMetas, progress), [progress])
  const weak = useMemo(() => weakestConcept(mastery), [mastery])

  const input = useMemo(
    () => ({ mastery, lessonsCompleted, recommendedNextTitle: next?.title, userName: firstName }),
    [mastery, lessonsCompleted, next, firstName],
  )

  const [message, setMessage] = useState(() => fallbackCoachMessage(input))
  const [loading, setLoading] = useState(AI_FEATURES.coach)

  useEffect(() => {
    let cancelled = false
    setMessage(fallbackCoachMessage(input))
    if (!AI_FEATURES.coach) {
      setLoading(false)
      return
    }
    setLoading(true)
    getCoachMessage(input).then((m) => {
      if (!cancelled) {
        setMessage(m)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
    // Re-run when the underlying signal changes.
  }, [input])

  return (
    <div className="card animate-fade-up p-5" style={{ animationDelay: '60ms' }}>
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-tint text-brand">✦</span>
        <p className="eyebrow text-brand">Your coach</p>
        {loading && (
          <span className="h-3 w-3 animate-spin rounded-full border border-brand border-t-transparent" />
        )}
      </div>
      <p className="mt-2 text-[15px] leading-relaxed text-ink">{message}</p>
      <Link
        to="/practice"
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-strong"
      >
        {weak ? `Practice ${CONCEPT_META[weak].label.toLowerCase()}` : 'Start a practice session'} →
      </Link>
    </div>
  )
}
