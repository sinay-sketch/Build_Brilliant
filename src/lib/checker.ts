import type { Step } from '../types/content'
import {
  computeKinematics,
  evaluateClearWall,
  evaluateHitTarget,
} from './physics'

export interface CheckResult {
  correct: boolean
  /** Hand-written, answer-specific feedback to show immediately. */
  message: string
}

// Deterministic, client-side checking only. Runs in well under 100ms and never
// calls a model. Feedback strings come straight from the authored content.
export function checkChoiceAnswer(step: Step, answerId: string): CheckResult {
  switch (step.type) {
    case 'predict':
    case 'mcq': {
      const correct = answerId === step.correctId
      const message =
        step.perChoiceFeedback[answerId] ?? (correct ? 'Correct.' : 'Not quite.')
      return { correct, message }
    }
    case 'recall': {
      const correct = answerId === step.correctId
      return {
        correct,
        message: correct ? 'Correct, straight from memory.' : 'Not quite, think it through again.',
      }
    }
    default:
      return { correct: false, message: '' }
  }
}

export function checkNumericAnswer(answer: number, target: number, tolerance: number): boolean {
  return Math.abs(answer - target) <= tolerance
}

export interface SimCheckResult extends CheckResult {
  landingDistance: number
}

export function checkSimChallenge(
  step: Extract<Step, { type: 'sim-challenge' }>,
  angleDeg: number,
  speed: number,
): SimCheckResult {
  const g = step.sim.gravity
  if (step.goal.kind === 'hitTarget' && step.sim.target) {
    const r = evaluateHitTarget(angleDeg, speed, g, step.sim.target)
    const diff = r.landingDistance - step.sim.target.distance
    const message = r.success
      ? `Direct hit! It landed at ${r.landingDistance.toFixed(1)} m.`
      : diff < 0
        ? `Landed short at ${r.landingDistance.toFixed(1)} m. Add a little speed or angle.`
        : `Overshot to ${r.landingDistance.toFixed(1)} m. Ease off the speed a touch.`
    return { correct: r.success, landingDistance: r.landingDistance, message }
  }
  if (step.goal.kind === 'clearWall' && step.sim.wall) {
    const r = evaluateClearWall(angleDeg, speed, g, step.sim.wall)
    const message = r.success
      ? `Cleared it and landed at ${r.landingDistance.toFixed(1)} m. Nice.`
      : `Not over the wall yet. You need more height to top ${step.sim.wall.height} m and enough speed to land past ${step.sim.wall.distance + step.sim.wall.width} m.`
    return { correct: r.success, landingDistance: r.landingDistance, message }
  }
  return { correct: false, message: '', landingDistance: 0 }
}

/** The true landing distance of a tap-landing shot (so the UI can reveal it). */
export function tapLandingRange(step: Extract<Step, { type: 'tap-landing' }>): number {
  return computeKinematics(step.sim.angleDeg, step.sim.speed, step.sim.gravity).range
}

export function checkTapLanding(
  step: Extract<Step, { type: 'tap-landing' }>,
  guess: number,
): CheckResult & { actual: number } {
  const actual = tapLandingRange(step)
  const off = guess - actual
  const correct = Math.abs(off) <= step.tolerance
  const message = correct
    ? `Nice prediction! It landed at ${actual.toFixed(1)} m — you were within ${Math.abs(off).toFixed(1)} m.`
    : off < 0
      ? `It actually flew farther, to ${actual.toFixed(1)} m. Your marker was ${Math.abs(off).toFixed(1)} m short.`
      : `It landed shorter, at ${actual.toFixed(1)} m. Your marker was ${Math.abs(off).toFixed(1)} m too far.`
  return { correct, message, actual }
}

export function checkSliderEstimate(
  step: Extract<Step, { type: 'slider-estimate' }>,
  value: number,
): CheckResult {
  const off = value - step.answer
  const correct = Math.abs(off) <= step.tolerance
  const unit = step.judge === 'angle' ? '°' : ' m/s'
  const message = correct
    ? `That's it — ${Math.round(value)}${unit} is right in the sweet spot.`
    : off < 0
      ? `Close. Try nudging it higher than ${Math.round(value)}${unit}.`
      : `Close. Try easing it lower than ${Math.round(value)}${unit}.`
  return { correct, message }
}
