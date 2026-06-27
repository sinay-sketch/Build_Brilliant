import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useUserData } from '../context/UserDataContext'
import type { ConceptId, Lesson, Step } from '../types/content'
import { getLessonMeta } from '../content/course'
import { CONCEPT_META, masteryLevel, weakestConcept } from '../lib/mastery'
import { nextPracticeProblem, PRACTICE_CONCEPTS } from '../lib/ai/generate'
import StepView from '../components/StepView'

// A minimal lesson wrapper so the tutor + step renderer have framing context.
const practiceLesson: Lesson = {
  id: 'practice',
  courseId: 'kinematics',
  order: 0,
  title: 'Practice',
  concept: 'Mixed projectile-motion practice',
  estMinutes: 5,
  prerequisites: [],
  playable: true,
  bigIdea: 'Every projectile is steady sideways motion plus gravity-driven up-and-down.',
  steps: [],
}

/** Concepts the generator can produce verifiable projectile problems for. */
function practiceableConcepts(): ConceptId[] {
  return PRACTICE_CONCEPTS
}

export default function Practice() {
  const { mastery, recordPractice, ready } = useUserData()
  const [concept, setConcept] = useState<ConceptId | null>(null)
  const [problem, setProblem] = useState<Step | null>(null)
  const [loading, setLoading] = useState(false)
  const [source, setSource] = useState<'ai' | 'authored'>('authored')
  const [answered, setAnswered] = useState(0)
  const [correct, setCorrect] = useState(0)
  const avoid = useRef<string[]>([])
  const recorded = useRef(false)

  const concepts = practiceableConcepts()

  const loadNext = async (c: ConceptId) => {
    setLoading(true)
    recorded.current = false
    const res = await nextPracticeProblem(c, mastery[c]?.score, avoid.current)
    avoid.current = [res.signature, ...avoid.current].slice(0, 6)
    setProblem(res.step)
    setSource(res.source)
    setLoading(false)
  }

  // Default the focus to the weakest attempted concept.
  useEffect(() => {
    if (concept || !ready) return
    const weak = weakestConcept(mastery)
    if (weak && concepts.includes(weak)) setConcept(weak)
  }, [ready, mastery, concept, concepts])

  const start = (c: ConceptId) => {
    setConcept(c)
    setAnswered(0)
    setCorrect(0)
    avoid.current = []
    void loadNext(c)
  }

  const handleSolved = (isCorrect: boolean) => {
    if (recorded.current || !concept) return
    recorded.current = true
    setAnswered((n) => n + 1)
    if (isCorrect) setCorrect((n) => n + 1)
    void recordPractice({ concept, correct: isCorrect })
  }

  if (!ready) return <div className="h-64" />

  // ---- Concept picker ----
  if (!concept || !problem) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <p className="eyebrow text-brand">Practice</p>
        <h1 className="mt-0.5 font-display text-3xl font-semibold text-ink">Sharpen a concept</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Pick any concept from any lesson. Projectile problems are AI-generated and verified
          against the physics engine; the rest come straight from the formulas — so every answer is correct.
        </p>

        <div className="mt-5 grid gap-2.5">
          {concepts.map((c) => {
            const level = masteryLevel(mastery[c])
            return (
              <button
                key={c}
                type="button"
                onClick={() => start(c)}
                disabled={loading}
                className="card flex items-center justify-between p-4 text-left transition hover:border-brand/50 disabled:opacity-60"
              >
                <div>
                  <p className="font-display text-lg font-semibold text-ink">{CONCEPT_META[c].label}</p>
                  <p className="text-xs text-ink-mute">{getLessonMeta(CONCEPT_META[c].lessonId)?.title}</p>
                </div>
                <MasteryPill level={level} />
              </button>
            )
          })}
        </div>

        <Link to="/" className="mt-6 inline-block text-sm font-semibold text-brand hover:text-brand-strong">
          ← Back to home
        </Link>
        {loading && <p className="mt-4 text-sm text-ink-mute">Preparing your first problem…</p>}
      </div>
    )
  }

  // ---- Active session ----
  const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0
  return (
    <div className="mx-auto max-w-2xl px-4 py-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="eyebrow text-brand">Practice · {CONCEPT_META[concept].label}</p>
          <p className="text-sm text-ink-soft">
            {answered} solved{answered > 0 ? ` · ${accuracy}% correct` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setConcept(null)
            setProblem(null)
          }}
          className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-medium text-ink-soft transition hover:text-ink"
        >
          End session
        </button>
      </div>

      <div className="card animate-fade-up p-5 sm:p-6" key={problem.id}>
        {loading ? (
          <ProblemSkeleton />
        ) : (
          <>
            <div className="mb-3 flex items-center gap-2">
              <span className="eyebrow text-ink-mute">{source === 'ai' ? 'Generated for you' : 'Practice problem'}</span>
              {source === 'ai' && <span className="text-[10px] text-ink-mute">· answer verified by the engine</span>}
            </div>
            <StepView
              step={problem}
              lesson={practiceLesson}
              masteryScore={mastery[concept]?.score}
              onSolved={(isCorrect) => handleSolved(isCorrect)}
              onContinue={() => loadNext(concept)}
              isLast={false}
            />
          </>
        )}
      </div>
    </div>
  )
}

function MasteryPill({ level }: { level: 'new' | 'learning' | 'mastered' }) {
  const map = {
    new: { label: 'New', cls: 'border-line bg-surface-2 text-ink-mute' },
    learning: { label: 'Learning', cls: 'border-brand/30 bg-brand-tint text-brand-strong' },
    mastered: { label: 'Mastered', cls: 'border-success/40 bg-success-soft text-success-strong' },
  }
  const m = map[level]
  return <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${m.cls}`}>{m.label}</span>
}

function ProblemSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-6 w-3/4 animate-pulse rounded-lg bg-paper-2" />
      <div className="h-12 w-full animate-pulse rounded-xl bg-paper-2" />
      <div className="h-12 w-full animate-pulse rounded-xl bg-paper-2" />
    </div>
  )
}
