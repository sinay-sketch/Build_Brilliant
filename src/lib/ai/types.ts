// Shared contracts between the client AI layer and the server proxy
// (functions/). These are intentionally small, structured payloads: the client
// sends lesson STATE, never raw HTML, and the model never originates a physics
// fact -- numbers are computed by the deterministic engine (see verify.ts).

import type { ConceptId } from '../../types/content'

/** Quantities the practice generator can ask about, all engine-computable. */
export type GenQuantity = 'range' | 'maxHeight' | 'timeOfFlight' | 'vx' | 'vy'

export type GenDifficulty = 'easy' | 'medium' | 'hard'

/** A serialized snapshot of the learner's current problem, for hint/explain. */
export interface StepContext {
  lessonTitle: string
  bigIdea?: string
  concept?: ConceptId
  phase?: string
  stepType: string
  prompt: string
  choices?: Array<{ id: string; label: string }>
  /**
   * The correct answer, passed to the trusted server purely for grounding so
   * hints stay accurate. The content is already public in the client bundle, so
   * this is not a secret; the system prompt forbids revealing it in a hint.
   */
  correctAnswer?: string
}

export interface HintRequest extends StepContext {
  attempts: number
  lastWrongAnswer?: string
  /** Escalation level: higher means the learner has asked again. */
  hintLevel: number
  masteryScore?: number
}

export interface HintResponse {
  hint: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatRequest extends StepContext {
  messages: ChatMessage[]
  /** The learner's most recent answer, so the tutor can discuss mistakes. */
  learnerAnswer?: string
}

export interface ChatResponse {
  reply: string
}

/** Request a fresh, engine-verifiable practice problem for one concept. */
export interface GenerateRequest {
  concept: ConceptId
  difficulty: GenDifficulty
  allowedQuantities: GenQuantity[]
  /** Recent param sets to avoid repeating, as "angle/speed" strings. */
  avoid?: string[]
}

/**
 * The model returns only the SCENARIO and wording. The numeric answer is NEVER
 * trusted from the model -- the client computes it from these params with the
 * physics engine (verify.ts), so the AI can never state a wrong number.
 */
export interface GeneratedProblemSpec {
  kind: 'numeric'
  quantity: GenQuantity
  angleDeg: number
  speed: number
  gravity: number
  unit: string
  prompt: string
  hints: string[]
  /** May contain the token {answer}; the client substitutes the true value. */
  explanationTemplate: string
}

export interface CoachRequest {
  mastery: Array<{ concept: ConceptId; score: number; label: string }>
  lessonsCompleted: number
  recommendedNextTitle?: string
  weakestConcept?: string
  /** The learner's first name, so the coach addresses them correctly. */
  userName?: string
}

export interface CoachResponse {
  message: string
}
