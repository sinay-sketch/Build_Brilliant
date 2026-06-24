import { Link } from 'react-router-dom'
import { useUserData } from '../context/UserDataContext'
import { kinematicsCourse, lessonMetas } from '../content/course'
import type { LessonMeta } from '../types/content'
import { lessonUiStatus, recommendNext } from '../lib/path'
import type { LessonUiStatus } from '../lib/path'

export default function Course() {
  const { progress, ready } = useUserData()
  if (!ready) return <div className="h-64" />

  const next = recommendNext(lessonMetas, progress)
  const completed = lessonMetas.filter((m) => progress[m.id]?.status === 'completed').length

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="animate-fade-up">
        <p className="eyebrow text-brand">Physics · Course</p>
        <h1 className="mt-0.5 font-display text-3xl font-semibold text-ink">{kinematicsCourse.title}</h1>
        <p className="mt-2 leading-relaxed text-ink-soft">{kinematicsCourse.description}</p>
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs font-medium text-ink-soft">
            <span>{completed} of {lessonMetas.length} lessons complete</span>
            <span>{Math.round((completed / lessonMetas.length) * 100)}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-track">
            <div
              className="h-full rounded-full bg-brand transition-all"
              style={{ width: `${(completed / lessonMetas.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-7">
        {lessonMetas.map((meta, i) => (
          <PathNode
            key={meta.id}
            meta={meta}
            status={lessonUiStatus(meta, progress)}
            recommended={next?.id === meta.id}
            isLast={i === lessonMetas.length - 1}
            delay={i * 50}
          />
        ))}
      </div>
    </div>
  )
}

const STATUS_META: Record<
  LessonUiStatus,
  { label: string; node: string; nodeClass: string; lineDone: boolean }
> = {
  completed: { label: 'Completed', node: '✓', nodeClass: 'bg-success text-white border-success', lineDone: true },
  in_progress: { label: 'In progress', node: '▶', nodeClass: 'bg-brand text-white border-brand', lineDone: false },
  available: { label: 'Ready to start', node: '▶', nodeClass: 'bg-surface text-brand border-brand', lineDone: false },
  coming_soon: { label: 'Coming soon', node: '○', nodeClass: 'bg-surface text-ink-mute border-line-strong', lineDone: false },
  locked: { label: 'Locked', node: '🔒', nodeClass: 'bg-surface text-ink-mute border-line-strong', lineDone: false },
}

function PathNode({
  meta,
  status,
  recommended,
  isLast,
  delay,
}: {
  meta: LessonMeta
  status: LessonUiStatus
  recommended: boolean
  isLast: boolean
  delay: number
}) {
  const s = STATUS_META[status]
  const clickable = status === 'available' || status === 'in_progress' || status === 'completed'

  const card = (
    <div
      className={`flex-1 rounded-2xl border p-4 transition ${
        recommended ? 'border-brand bg-brand-tint shadow-[0_10px_30px_-18px_rgba(217,96,12,0.6)]' : 'border-line bg-surface'
      } ${clickable ? 'hover:border-brand/50' : 'opacity-80'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="eyebrow text-ink-mute">Lesson {meta.order}</span>
            {recommended && (
              <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                Next
              </span>
            )}
          </div>
          <h3 className="mt-0.5 font-display text-lg font-semibold text-ink">{meta.title}</h3>
          <p className="text-sm text-ink-soft">{meta.concept}</p>
        </div>
        <span className="shrink-0 text-xs font-medium text-ink-mute">~{meta.estMinutes}m</span>
      </div>

      <div className="mt-2 flex items-center gap-2 text-xs font-medium text-ink-soft">
        <span>{s.label}</span>
      </div>
    </div>
  )

  return (
    <div className="animate-fade-up flex gap-4" style={{ animationDelay: `${delay}ms` }}>
      {/* Node + connector */}
      <div className="flex flex-col items-center">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold ${s.nodeClass}`}
        >
          {s.node}
        </div>
        {!isLast && <div className={`w-0.5 flex-1 ${s.lineDone ? 'bg-success/50' : 'bg-line'}`} />}
      </div>

      <div className={`flex-1 ${isLast ? '' : 'pb-4'}`}>
        {clickable ? <Link to={`/lesson/${meta.id}`}>{card}</Link> : card}
      </div>
    </div>
  )
}
