import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useUserData } from '../context/UserDataContext'
import { getLesson, lessonMetas } from '../content/course'
import { isProblemStep, PHASE_META } from '../types/content'
import type { Lesson as LessonType, StepPhase } from '../types/content'
import StepView from '../components/StepView'

export default function Lesson() {
  const { lessonId = '' } = useParams()
  const navigate = useNavigate()
  const { progress, mastery, startLesson, setCurrentStep, submitProblem, completeLesson, ready } = useUserData()
  const lesson = getLesson(lessonId)

  const [index, setIndex] = useState(0)
  const [finished, setFinished] = useState(false)
  const [showIntro, setShowIntro] = useState(false)
  const initialized = useRef(false)
  const started = useRef(false)

  // Begin / resume the lesson once data is ready.
  useEffect(() => {
    if (!ready || !lesson || initialized.current) return
    initialized.current = true
    const existing = progress[lesson.id]
    const resumingMidway = existing && existing.status !== 'completed' && existing.currentStepIndex > 0
    if (!existing) {
      if (!started.current) {
        started.current = true
        void startLesson(lesson.id)
      }
      setIndex(0)
    } else if (existing.status === 'completed') {
      setIndex(0)
    } else {
      setIndex(Math.min(existing.currentStepIndex, lesson.steps.length - 1))
    }
    // Show the framing screen unless the learner is picking up mid-lesson.
    setShowIntro(Boolean(lesson.intro) && !resumingMidway)
  }, [ready, lesson, progress, startLesson])

  if (!ready) return <div className="h-64" />

  if (!lesson) {
    const meta = lessonMetas.find((m) => m.id === lessonId)
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 text-center">
        <h1 className="font-display text-2xl font-semibold text-ink">{meta?.title ?? 'Lesson'}</h1>
        <p className="mt-2 text-ink-soft">
          This lesson is part of the path but is not built yet. The MVP goes deep on Projectile Motion.
        </p>
        <Link to="/course" className="btn-primary mt-6 inline-block px-5 py-3">
          Back to course
        </Link>
      </div>
    )
  }

  if (showIntro && lesson.intro) {
    return <LessonIntro lesson={lesson} onBegin={() => setShowIntro(false)} onBack={() => navigate('/course')} />
  }

  if (finished) return <Completion lesson={lesson} />

  const step = lesson.steps[index]
  const total = lesson.steps.length
  const progressPct = Math.round((index / total) * 100)
  const phase = step.phase

  const handleSolved = (correct: boolean, answer: string | number | null, concept?: typeof step.concept) => {
    if (!isProblemStep(step)) return
    void submitProblem({ lessonId: lesson.id, stepId: step.id, concept, correct, answer })
  }

  const handleContinue = () => {
    const nextIndex = index + 1
    if (nextIndex >= total) {
      void completeLesson(lesson.id)
      setFinished(true)
      return
    }
    setIndex(nextIndex)
    void setCurrentStep(lesson.id, nextIndex)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-5">
      {/* Progress header */}
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/course')}
          className="flex h-8 w-8 items-center justify-center rounded-full text-ink-mute transition hover:bg-paper-2 hover:text-ink"
          aria-label="Back to course"
        >
          ✕
        </button>
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-track">
          <div
            className="h-full rounded-full bg-brand transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <span className="w-12 text-right text-xs font-medium text-ink-mute">
          {index + 1}/{total}
        </span>
      </div>

      {phase && <PhaseBar phase={phase} />}

      <div className="card animate-fade-up p-5 sm:p-6" key={step.id}>
        <StepView
          step={step}
          lesson={lesson}
          masteryScore={step.concept ? mastery[step.concept]?.score : undefined}
          onSolved={handleSolved}
          onContinue={handleContinue}
          isLast={index === total - 1}
        />
      </div>
    </div>
  )
}

const PHASE_ORDER: StepPhase[] = ['predict', 'explore', 'build', 'practice', 'master']

function PhaseBar({ phase }: { phase: StepPhase }) {
  const activeIdx = PHASE_ORDER.indexOf(phase)
  return (
    <div className="mb-3">
      <div className="flex items-center gap-1.5">
        {PHASE_ORDER.map((p, i) => (
          <div
            key={p}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= activeIdx ? 'bg-brand' : 'bg-line'
            }`}
          />
        ))}
      </div>
      <p className="mt-1.5 text-xs text-ink-soft">
        <span className="eyebrow text-brand">{PHASE_META[phase].label}</span>
        <span className="mx-1.5 text-ink-mute">·</span>
        {PHASE_META[phase].blurb}
      </p>
    </div>
  )
}

function LessonIntro({
  lesson,
  onBegin,
  onBack,
}: {
  lesson: LessonType
  onBegin: () => void
  onBack: () => void
}) {
  const intro = lesson.intro!
  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <button
        type="button"
        onClick={onBack}
        className="mb-5 text-sm font-medium text-ink-soft transition hover:text-ink"
      >
        ← Back to course
      </button>

      <p className="eyebrow text-brand">Lesson {lesson.order} · Physics</p>
      <h1 className="mt-1 font-display text-3xl font-semibold leading-tight text-ink">{lesson.title}</h1>

      <div className="card mt-5 p-5">
        <p className="eyebrow text-ink-mute">By the end, you&apos;ll be able to answer</p>
        <p className="mt-2 font-display text-lg leading-relaxed text-ink">{intro.hook}</p>
      </div>

      <div className="mt-4">
        <p className="eyebrow mb-2 text-ink-mute">By the end you can</p>
        <ul className="space-y-2">
          {intro.objectives.map((o) => (
            <li key={o} className="flex items-start gap-3 rounded-xl border border-line bg-surface px-4 py-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs text-brand">
                ✓
              </span>
              <span className="text-sm leading-relaxed text-ink">{o}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 rounded-xl border border-line bg-surface-2 p-4">
        <p className="eyebrow mb-1.5 text-ink-mute">Why it matters</p>
        <p className="text-sm leading-relaxed text-ink-soft">{intro.whyItMatters}</p>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-ink-mute">
        <span>~{lesson.estMinutes} min</span>
        <span>·</span>
        <span>{lesson.steps.length} steps</span>
        <span>·</span>
        <span>Predict → Explore → Build → Practice → Master</span>
      </div>

      <button type="button" onClick={onBegin} className="btn-primary mt-5 w-full py-3.5">
        Begin lesson
      </button>
    </div>
  )
}

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 1.6 + Math.random() * 1.2,
        color: ['#d9600c', '#1f8a4c', '#b07d18', '#b94a08', '#e2570c'][i % 5],
        size: 6 + Math.random() * 6,
      })),
    [],
  )
  return (
    <div className="pointer-events-none fixed inset-0 z-20 overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.left}%`,
            top: '-5vh',
            width: p.size,
            height: p.size * 1.4,
            backgroundColor: p.color,
            borderRadius: 2,
            animation: `confetti-fall ${p.duration}s ${p.delay}s ease-in forwards`,
          }}
        />
      ))}
    </div>
  )
}

function Completion({ lesson }: { lesson: LessonType }) {
  const order = lessonMetas.findIndex((m) => m.id === lesson.id)
  const next = order >= 0 ? lessonMetas[order + 1] : undefined

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-12 text-center">
      <Confetti />
      <div className="animate-celebrate text-6xl">🎉</div>
      <h1 className="mt-4 font-display text-3xl font-semibold text-ink">Lesson complete</h1>
      <p className="mt-2 text-ink-soft">You earned XP and kept your streak alive. You taught yourself by doing.</p>

      {lesson.bigIdea && (
        <div className="mt-6 w-full rounded-2xl border border-brand/30 bg-brand-tint p-5 text-left">
          <p className="eyebrow text-brand">The big idea</p>
          <p className="mt-2 font-display text-lg leading-relaxed text-ink">{lesson.bigIdea}</p>
        </div>
      )}

      {next && (
        <div className="card mt-4 w-full p-5 text-left">
          <p className="eyebrow text-ink-mute">Up next</p>
          <h2 className="mt-1 font-display text-lg font-semibold text-ink">{next.title}</h2>
          <p className="text-sm text-ink-soft">{next.concept}</p>
          {next.playable ? (
            <Link to={`/lesson/${next.id}`} className="btn-primary mt-3 block py-3 text-center">
              Start next lesson
            </Link>
          ) : (
            <p className="mt-3 rounded-xl bg-paper-2 py-3 text-center text-sm text-ink-mute">Coming soon</p>
          )}
        </div>
      )}

      <Link
        to="/practice"
        className="mt-4 block w-full rounded-xl border border-brand/40 bg-brand-tint py-3 text-center font-semibold text-brand-strong transition hover:bg-brand-soft"
      >
        Keep practicing your weak spots
      </Link>

      <Link
        to="/"
        className="mt-3 w-full rounded-xl border border-line bg-surface py-3 font-semibold text-ink transition hover:border-brand/50"
      >
        Back to home
      </Link>
    </div>
  )
}
