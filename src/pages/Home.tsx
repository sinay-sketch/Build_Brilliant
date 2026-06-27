import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useUserData } from '../context/UserDataContext'
import { kinematicsCourse, lessonMetas } from '../content/course'
import { lessonProgressPercent, lessonUiStatus, recommendNext } from '../lib/path'
import { levelProgress } from '../types/user'
import ProgressRing from '../components/ProgressRing'
import FlameIcon from '../components/FlameIcon'
import CoachCard from '../components/CoachCard'

export default function Home() {
  const { profile, progress, todayActivity, ready, error } = useUserData()

  if (!ready) return <CenterSpinner />
  if (error || !profile) return <DataError message={error ?? 'Could not load your data.'} />

  const goal = profile.dailyGoalProblems
  const goalMet = todayActivity.problemsSolved >= goal || todayActivity.lessonsCompleted >= 1
  const done = goalMet ? goal : Math.min(todayActivity.problemsSolved, goal)
  const goalFrac = goalMet ? 1 : done / goal
  const next = recommendNext(lessonMetas, progress)
  const firstName = profile.displayName.split(' ')[0]

  const lp = levelProgress(profile.xp)
  const levelFrac = lp.frac

  const lessonsCompleted = lessonMetas.filter((m) => progress[m.id]?.status === 'completed').length
  const totalProblems = Object.values(progress).reduce(
    (sum, lp) => sum + Object.values(lp.stepStates ?? {}).filter((s) => s.correct).length,
    0,
  )
  const courseFrac = lessonsCompleted / lessonMetas.length

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-6">
      <div className="animate-fade-up">
        <p className="eyebrow text-brand">{greeting}</p>
        <h1 className="mt-0.5 font-display text-3xl font-semibold text-ink">{firstName}</h1>
        <p className="mt-1 text-sm text-ink-soft">{kinematicsCourse.title} · Physics · Learn by doing</p>
      </div>

      {/* Stat rings (tap or hover for what each means) */}
      <div className="card animate-fade-up grid grid-cols-3 divide-x divide-line p-4" style={{ animationDelay: '40ms' }}>
        <RingStat
          color="var(--color-streak)"
          value={Math.min(profile.streak.current / 7, 1)}
          centerTop={`${profile.streak.current}`}
          centerSub={<FlameIcon className="h-3 w-3 text-streak" />}
          label="Day streak"
          hint={
            profile.streak.current > 0
              ? `${profile.streak.current}-day streak — days in a row you hit your goal. Don't break it!`
              : 'Meet your daily goal to start a streak.'
          }
        />
        <RingStat
          color="var(--color-success)"
          value={goalFrac}
          centerTop={`${done}/${goal}`}
          centerSub="today"
          label={goalMet ? 'Goal met' : 'Daily goal'}
          hint={
            goalMet
              ? `Daily goal met — you've done your ${goal} questions today. Streak safe!`
              : `Solve ${goal} questions today (or finish a lesson) to meet your goal. ${todayActivity.problemsSolved} done so far.`
          }
        />
        <RingStat
          color="var(--color-gold)"
          value={levelFrac}
          centerTop={`${lp.level}`}
          centerSub="lvl"
          label={`${lp.into}/${lp.span} XP`}
          hint={`Level ${lp.level}. Earn XP by solving problems — ${lp.toNext} XP to level ${lp.level + 1}.`}
        />
      </div>

      <CoachCard />

      {/* Recommended next — hero */}
      {next && (
        <div className="card animate-fade-up overflow-hidden p-0" style={{ animationDelay: '80ms' }}>
          <div className="bg-ink px-5 py-4">
            <p className="eyebrow text-brand-soft">
              {progress[next.id]?.status === 'in_progress' ? 'Continue where you left off' : 'Recommended next'}
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-[#f4efe4]">{next.title}</h2>
            <p className="mt-1 text-sm text-[#cfc6b4]">{next.concept}</p>
          </div>
          <div className="p-5">
            {next.playable && progress[next.id]?.status === 'in_progress' && (
              <div className="mb-3">
                <div className="mb-1 flex justify-between text-xs text-ink-soft">
                  <span>Progress</span>
                  <span>{lessonProgressPercent(next.id, progress)}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-track">
                  <div
                    className="h-full rounded-full bg-brand transition-all"
                    style={{ width: `${lessonProgressPercent(next.id, progress)}%` }}
                  />
                </div>
              </div>
            )}
            <NextCta
              metaId={next.id}
              status={lessonUiStatus(next, progress)}
              inProgress={progress[next.id]?.status === 'in_progress'}
            />
          </div>
        </div>
      )}

      {/* Your journey */}
      <div className="card animate-fade-up flex items-center gap-4 p-5" style={{ animationDelay: '120ms' }}>
        <ProgressRing value={courseFrac} size={64} stroke={7} color="var(--color-brand)">
          <span className="font-display text-lg font-semibold text-ink">{lessonsCompleted}</span>
          <span className="text-[10px] text-ink-mute">of {lessonMetas.length}</span>
        </ProgressRing>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg font-semibold text-ink">Your journey</h3>
          <p className="text-sm text-ink-soft">
            {lessonsCompleted === 0
              ? 'No lessons finished yet — your first one is waiting.'
              : `${lessonsCompleted} ${lessonsCompleted === 1 ? 'lesson' : 'lessons'} complete · ${totalProblems} problems solved.`}
          </p>
          <Link to="/course" className="mt-1 inline-block text-sm font-semibold text-brand hover:text-brand-strong">
            View the full course path →
          </Link>
        </div>
      </div>
    </div>
  )
}

function RingStat({
  color,
  value,
  centerTop,
  centerSub,
  label,
  hint,
}: {
  color: string
  value: number
  centerTop: string
  centerSub: React.ReactNode
  label: string
  hint: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="group relative flex flex-col items-center gap-1.5 px-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setOpen(false)}
        className="flex flex-col items-center gap-1.5"
        aria-label={hint}
      >
        <ProgressRing value={value} size={60} stroke={6} color={color}>
          <span className="font-display text-base font-semibold leading-none text-ink">{centerTop}</span>
          <span className="text-[9px] leading-tight text-ink-mute">{centerSub}</span>
        </ProgressRing>
        <span className="text-center text-[11px] font-medium text-ink-soft">{label}</span>
      </button>

      {/* Tooltip: shows on hover (desktop) or tap (mobile) */}
      <div
        className={`pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-44 -translate-x-1/2 rounded-xl border border-line bg-ink px-3 py-2 text-center text-xs leading-snug text-[#f4efe4] shadow-lg transition-opacity duration-150 group-hover:opacity-100 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {hint}
        <span className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1 rotate-45 border-b border-r border-line bg-ink" />
      </div>
    </div>
  )
}

function NextCta({ metaId, status, inProgress }: { metaId: string; status: string; inProgress: boolean }) {
  if (status === 'available' || status === 'in_progress') {
    return (
      <Link to={`/lesson/${metaId}`} className="btn-primary block w-full py-3 text-center">
        {inProgress ? 'Continue lesson' : 'Start lesson'}
      </Link>
    )
  }
  return <p className="rounded-xl bg-paper-2 py-3 text-center text-sm text-ink-mute">Coming soon</p>
}

function CenterSpinner() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
    </div>
  )
}

function DataError({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-md px-4 py-12 text-center">
      <div className="text-4xl">⚠️</div>
      <h2 className="mt-3 font-display text-xl font-semibold text-ink">We couldn't load your data</h2>
      <p className="mt-2 text-sm text-ink-soft">{message}</p>
    </div>
  )
}
