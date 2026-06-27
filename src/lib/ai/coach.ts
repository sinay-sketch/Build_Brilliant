// The adaptive coach blurb. Gating/unlock stays deterministic (path.ts); this
// only produces the natural-language "why" shown on Home. Falls back to an
// authored message when AI is off or unavailable.

import type { ConceptId } from '../../types/content'
import type { MasteryRecord } from '../../types/user'
import { CONCEPT_META, masteryLevel, summarizeMastery, weakestConcept } from '../mastery'
import { requestCoachMessage } from './client'

export interface CoachInput {
  mastery: Partial<Record<ConceptId, MasteryRecord>>
  lessonsCompleted: number
  recommendedNextTitle?: string
  /** The learner's first name, so the coach never guesses it. */
  userName?: string
}

/** Deterministic fallback so Home always has a sensible focus message. */
export function fallbackCoachMessage(input: CoachInput): string {
  const weak = weakestConcept(input.mastery)
  if (weak) {
    const label = CONCEPT_META[weak].label.toLowerCase()
    return `You're closest to mastering everything except ${label}. A few targeted practice problems there will lock it in.`
  }
  if (input.lessonsCompleted === 0) {
    return 'Start with Projectile Motion. Predict first, play with the cannon, and let the math fall out of what you see.'
  }
  if (input.recommendedNextTitle) {
    return `Nice momentum. ${input.recommendedNextTitle} builds directly on what you just learned -- keep the chain going.`
  }
  return 'You are on a roll. Keep practicing to push every concept to mastery.'
}

export async function getCoachMessage(input: CoachInput): Promise<string> {
  const weak = weakestConcept(input.mastery)
  const summary = summarizeMastery(input.mastery)
    .filter((c) => c.record && c.record.attempts > 0)
    .map((c) => ({ concept: c.concept, score: Math.round((c.record?.score ?? 0) * 100) / 100, label: masteryLevel(c.record) }))

  const ai = await requestCoachMessage({
    mastery: summary,
    lessonsCompleted: input.lessonsCompleted,
    recommendedNextTitle: input.recommendedNextTitle,
    weakestConcept: weak ? CONCEPT_META[weak].label : undefined,
    userName: input.userName,
  })

  return ai ?? fallbackCoachMessage(input)
}
