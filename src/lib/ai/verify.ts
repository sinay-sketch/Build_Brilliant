// The ground-truth guard. The model proposes a SCENARIO (launch params + which
// quantity to ask about); this module computes the real answer with the same
// deterministic engine that draws the canvas and checks Phase 1 problems. If a
// generated spec is physically nonsensical, it is rejected so it never reaches
// the learner. The AI thus never states a number -- the engine always does.

import type { NumericStep, ConceptId } from '../../types/content'
import { computeKinematics } from '../physics'
import type { GenQuantity, GeneratedProblemSpec } from './types'

const QUANTITY_LABEL: Record<GenQuantity, string> = {
  range: 'horizontal range',
  maxHeight: 'peak height',
  timeOfFlight: 'total time in the air',
  vx: 'sideways speed v_x',
  vy: 'starting upward speed v_y',
}

const QUANTITY_UNIT: Record<GenQuantity, string> = {
  range: 'm',
  maxHeight: 'm',
  timeOfFlight: 's',
  vx: 'm/s',
  vy: 'm/s',
}

/** Compute the true value of a quantity from launch params. */
export function computeQuantity(
  quantity: GenQuantity,
  angleDeg: number,
  speed: number,
  gravity: number,
): number {
  const k = computeKinematics(angleDeg, speed, gravity)
  switch (quantity) {
    case 'range':
      return k.range
    case 'maxHeight':
      return k.maxHeight
    case 'timeOfFlight':
      return k.timeOfFlight
    case 'vx':
      return k.vx
    case 'vy':
      return k.vy
  }
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

/** A tolerance that scales with the value, so big and small answers are fair. */
function toleranceFor(quantity: GenQuantity, value: number): number {
  const rel = value * 0.04
  const floor = quantity === 'timeOfFlight' ? 0.15 : 0.5
  return Math.max(floor, round1(rel))
}

export interface VerifiedProblem {
  step: NumericStep
  /** The launch params, recorded so the session can avoid repeats. */
  signature: string
}

/**
 * Validate a model-proposed spec and, if sane, build a fully-formed NumericStep
 * whose `answer` is computed (never trusted from the model). Returns null when
 * the scenario is out of range or the math degenerates, so the caller can
 * regenerate or fall back to authored content.
 */
export function buildVerifiedProblem(
  spec: GeneratedProblemSpec,
  concept: ConceptId,
): VerifiedProblem | null {
  const { angleDeg, speed, gravity, quantity } = spec

  // Physically sensible launch envelope.
  if (!Number.isFinite(angleDeg) || angleDeg < 10 || angleDeg > 80) return null
  if (!Number.isFinite(speed) || speed < 5 || speed > 45) return null
  if (!Number.isFinite(gravity) || gravity < 1 || gravity > 25) return null

  const value = computeQuantity(quantity, angleDeg, speed, gravity)
  if (!Number.isFinite(value) || value <= 0) return null

  const answer = round1(value)
  const unit = QUANTITY_UNIT[quantity]
  const tolerance = toleranceFor(quantity, value)

  const prompt =
    spec.prompt && spec.prompt.trim().length > 0
      ? spec.prompt.trim()
      : `A projectile launches at ${Math.round(angleDeg)}° and ${Math.round(speed)} m/s (g = ${gravity}). What is the ${QUANTITY_LABEL[quantity]}?`

  const explanation = (spec.explanationTemplate ?? '')
    .replace(/\{answer\}/g, `${answer} ${unit}`)
    .trim()

  const step: NumericStep = {
    id: `gen-${concept}-${Math.random().toString(36).slice(2, 9)}`,
    type: 'numeric',
    concept,
    phase: 'practice',
    prompt,
    answer,
    unit,
    tolerance,
    hints:
      spec.hints && spec.hints.length > 0
        ? spec.hints
        : ['Split the launch into sideways and upward parts, then apply the right formula.'],
    explanation:
      explanation.length > 0
        ? explanation
        : `The ${QUANTITY_LABEL[quantity]} works out to ${answer} ${unit}.`,
    min: 0,
    max: quantity === 'timeOfFlight' ? 20 : quantity === 'range' ? 250 : 60,
  }

  return { step, signature: `${Math.round(angleDeg)}/${Math.round(speed)}/${quantity}` }
}
