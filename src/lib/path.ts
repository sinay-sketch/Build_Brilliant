import type { LessonMeta } from '../types/content'
import type { LessonProgress } from '../types/user'
import { getLesson } from '../content/course'

export type LessonUiStatus = 'completed' | 'in_progress' | 'available' | 'coming_soon' | 'locked'

type ProgressMap = Record<string, LessonProgress>

export function isUnlocked(meta: LessonMeta, progress: ProgressMap): boolean {
  return meta.prerequisites.every((id) => progress[id]?.status === 'completed')
}

export function lessonUiStatus(meta: LessonMeta, progress: ProgressMap): LessonUiStatus {
  const p = progress[meta.id]
  if (p?.status === 'completed') return 'completed'
  // Anything not built yet simply reads as "coming soon" (no separate locked
  // state, which was confusing alongside coming soon).
  if (!meta.playable) return 'coming_soon'
  if (p?.status === 'in_progress') return 'in_progress'
  return 'available'
}

/** The single sensible next step to nudge the learner toward. */
export function recommendNext(metas: LessonMeta[], progress: ProgressMap): LessonMeta | null {
  // Prefer a lesson you can actually start right now.
  const startable = metas.find((m) => {
    const s = lessonUiStatus(m, progress)
    return s === 'available' || s === 'in_progress'
  })
  if (startable) return startable

  // Otherwise point forward: the first not-yet-completed lesson that comes after
  // the furthest lesson you have completed (so finishing 3 recommends 4).
  const lastCompletedOrder = metas.reduce(
    (max, m) => (progress[m.id]?.status === 'completed' ? Math.max(max, m.order) : max),
    0,
  )
  const forward = metas.find(
    (m) => m.order > lastCompletedOrder && progress[m.id]?.status !== 'completed',
  )
  if (forward) return forward

  return metas.find((m) => progress[m.id]?.status !== 'completed') ?? null
}

export function lessonProgressPercent(lessonId: string, progress: ProgressMap): number {
  const lesson = getLesson(lessonId)
  const p = progress[lessonId]
  if (!lesson || !p) return 0
  const total = lesson.steps.length
  const done = Math.min(p.currentStepIndex, total)
  if (p.status === 'completed') return 100
  return Math.round((done / total) * 100)
}
