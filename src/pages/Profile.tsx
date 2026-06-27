import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useUserData } from '../context/UserDataContext'
import { lessonMetas } from '../content/course'
import { levelProgress } from '../types/user'
import ProgressRing from '../components/ProgressRing'
import FlameIcon from '../components/FlameIcon'
import MasteryPanel from '../components/MasteryPanel'

export default function Profile() {
  const { logout } = useAuth()
  const { profile, progress, ready } = useUserData()
  const navigate = useNavigate()

  if (!ready || !profile) return <div className="h-64" />

  const lp = levelProgress(profile.xp)
  const lessonsCompleted = lessonMetas.filter((m) => progress[m.id]?.status === 'completed').length
  const totalProblems = Object.values(progress).reduce(
    (sum, lp) => sum + Object.values(lp.stepStates ?? {}).filter((s) => s.correct).length,
    0,
  )

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-6">
      <div className="card animate-fade-up flex items-center gap-4 p-5">
        <ProgressRing value={lp.frac} size={72} stroke={7} color="var(--color-gold)">
          <span className="font-display text-xl font-semibold text-ink">
            {profile.displayName.charAt(0).toUpperCase()}
          </span>
        </ProgressRing>
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold text-ink">{profile.displayName}</h1>
          <p className="truncate text-sm text-ink-soft">{profile.email}</p>
          <p className="mt-0.5 text-xs text-ink-mute">
            Level {lp.level} · {lp.into}/{lp.span} XP to next
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat
          label="Current streak"
          value={`${profile.streak.current}`}
          suffix={<FlameIcon className="inline h-5 w-5 align-[-3px] text-streak" />}
          delay={40}
        />
        <Stat label="Longest streak" value={`${profile.streak.longest}`} suffix="days" delay={80} />
        <Stat label="Lessons completed" value={`${lessonsCompleted}`} suffix={`/ ${lessonMetas.length}`} delay={120} />
        <Stat label="Problems solved" value={`${totalProblems}`} suffix="" delay={160} />
        <Stat label="Total XP" value={`${profile.xp}`} suffix="★" delay={200} />
        <Stat label="Level" value={`${lp.level}`} suffix="" delay={240} />
      </div>

      <MasteryPanel />

      <div className="card animate-fade-up p-5" style={{ animationDelay: '340ms' }}>
        <h2 className="font-display text-lg font-semibold text-ink">Daily goal</h2>
        <p className="mt-1 text-sm text-ink-soft">
          You're aiming for <span className="font-semibold text-ink">{profile.dailyGoalProblems} questions a day</span>.
          Meeting it (or finishing a lesson) keeps your streak alive.
        </p>
      </div>

      <button
        type="button"
        onClick={handleLogout}
        className="w-full rounded-xl border border-danger/40 bg-danger-soft py-3 font-semibold text-danger transition hover:bg-danger-soft/70"
      >
        Log out
      </button>
    </div>
  )
}

function Stat({
  label,
  value,
  suffix,
  delay,
}: {
  label: string
  value: string
  suffix: React.ReactNode
  delay: number
}) {
  return (
    <div className="card animate-fade-up p-4" style={{ animationDelay: `${delay}ms` }}>
      <p className="font-display text-2xl font-semibold text-ink">
        {value} {suffix && <span className="text-base font-normal text-ink-mute">{suffix}</span>}
      </p>
      <p className="text-xs text-ink-soft">{label}</p>
    </div>
  )
}
