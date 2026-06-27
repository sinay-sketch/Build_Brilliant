// Per-concept mastery: a deterministic, client-side signal that drives the
// adaptive coach, the mastery visualization, and practice difficulty. It is an
// exponential moving average of first-attempt correctness so it rewards genuine
// recall over grinding the same step.

import type { ConceptId } from '../types/content'
import type { MasteryRecord } from '../types/user'
import { MASTERED_THRESHOLD } from '../types/user'

/** Human-readable names + the lesson each concept belongs to, for the UI. */
export const CONCEPT_META: Record<ConceptId, { label: string; lessonId: string }> = {
  'gravity-independence': { label: 'Independence of motion', lessonId: 'projectile-motion' },
  components: { label: 'Velocity components', lessonId: 'projectile-motion' },
  'trajectory-shape': { label: 'Time & peak height', lessonId: 'projectile-motion' },
  'angle-range': { label: 'Angle vs. range', lessonId: 'range-vs-angle' },
  'complementary-angles': { label: 'Complementary angles', lessonId: 'range-vs-angle' },
  'range-reasoning': { label: 'Range reasoning', lessonId: 'range-vs-angle' },
  'free-fall-rate': { label: 'Equal-rate falling', lessonId: 'free-fall' },
  'gravity-accel': { label: 'Acceleration of gravity', lessonId: 'free-fall' },
  'fall-distance': { label: 'Fall distance', lessonId: 'free-fall' },
  'speed-vs-velocity': { label: 'Speed vs. velocity', lessonId: 'position-velocity' },
  displacement: { label: 'Displacement', lessonId: 'position-velocity' },
  'velocity-graph': { label: 'Velocity as slope', lessonId: 'position-velocity' },
  'avg-velocity': { label: 'Average velocity', lessonId: 'position-velocity' },
}

// Mastery grows like a learning curve, not a single coin flip. Each correct
// answer closes a fraction of the remaining gap to 1, so it takes several
// correct answers (with no misses) to be "mastered"; a miss knocks the score
// well back. This mirrors how Brilliant-style mastery accumulates evidence over
// many problems rather than declaring mastery after one.
//
//   correct answers in a row → 0.34, 0.56, 0.71, 0.81 (mastered), 0.88, ...
//   a wrong answer → score is roughly halved.
const GAIN = 0.34
const MISS_FACTOR = 0.5

export const emptyMastery: MasteryRecord = {
  score: 0,
  attempts: 0,
  correct: 0,
  lastReviewed: 0,
}

/** Fold a fresh result into a concept's mastery record. */
export function updateMastery(
  prev: MasteryRecord | undefined,
  correct: boolean,
  now = Date.now(),
): MasteryRecord {
  const base = prev ?? emptyMastery
  const score = correct ? base.score + (1 - base.score) * GAIN : base.score * MISS_FACTOR
  return {
    score: Math.max(0, Math.min(1, score)),
    attempts: base.attempts + 1,
    correct: base.correct + (correct ? 1 : 0),
    lastReviewed: now,
  }
}

export type MasteryLevel = 'new' | 'learning' | 'mastered'

export function masteryLevel(record: MasteryRecord | undefined): MasteryLevel {
  if (!record || record.attempts === 0) return 'new'
  return record.score >= MASTERED_THRESHOLD ? 'mastered' : 'learning'
}

export interface ConceptMastery {
  concept: ConceptId
  label: string
  lessonId: string
  record: MasteryRecord | undefined
  level: MasteryLevel
}

/** A stable, ordered summary of every concept for the profile + coach. */
export function summarizeMastery(
  mastery: Partial<Record<ConceptId, MasteryRecord>>,
): ConceptMastery[] {
  return (Object.keys(CONCEPT_META) as ConceptId[]).map((concept) => {
    const record = mastery[concept]
    return {
      concept,
      label: CONCEPT_META[concept].label,
      lessonId: CONCEPT_META[concept].lessonId,
      record,
      level: masteryLevel(record),
    }
  })
}

/**
 * The concept most worth practicing: among concepts the learner has attempted,
 * the lowest-scoring not-yet-mastered one. Returns null if nothing is started.
 */
export function weakestConcept(
  mastery: Partial<Record<ConceptId, MasteryRecord>>,
): ConceptId | null {
  const attempted = summarizeMastery(mastery).filter((c) => c.record && c.record.attempts > 0)
  const notMastered = attempted.filter((c) => c.level !== 'mastered')
  const pool = notMastered.length > 0 ? notMastered : attempted
  if (pool.length === 0) return null
  pool.sort((a, b) => (a.record!.score - b.record!.score))
  return pool[0].concept
}

export function difficultyForScore(score: number | undefined): 'easy' | 'medium' | 'hard' {
  if (score == null) return 'easy'
  if (score < 0.4) return 'easy'
  if (score < 0.75) return 'medium'
  return 'hard'
}
