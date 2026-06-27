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

export function checkPlotPosition(
  step: Extract<Step, { type: 'plot-position' }>,
  pos: number,
): CheckResult {
  const target = step.velocity * step.time
  const off = pos - target
  const correct = Math.abs(off) <= step.tolerance
  const message = correct
    ? `Spot on — at ${step.velocity} m/s for ${step.time} s, it reaches ${target} m.`
    : off < 0
      ? `Not far enough. ${step.velocity} m/s for ${step.time} s covers more than ${Math.round(pos)} m.`
      : `Too far. ${step.velocity} m/s for ${step.time} s covers less than ${Math.round(pos)} m.`
  return { correct, message }
}

export function checkStopFall(
  step: Extract<Step, { type: 'stop-fall' }>,
  distance: number,
): CheckResult {
  const off = distance - step.targetDistance
  const correct = Math.abs(off) <= step.tolerance
  const message = correct
    ? `Great timing — you stopped it at ${distance.toFixed(1)} m, right at the ${step.targetDistance} m mark.`
    : off < 0
      ? `Stopped early at ${distance.toFixed(1)} m — let it fall a bit longer next time.`
      : `Stopped late at ${distance.toFixed(1)} m — it falls faster the longer it drops, so hit Stop sooner.`
  return { correct, message }
}

export function checkCurveAim(
  step: Extract<Step, { type: 'curve-aim' }>,
  angleDeg: number,
): CheckResult & { range: number } {
  const range = computeKinematics(angleDeg, step.speed, step.gravity ?? 9.8).range
  const off = range - step.targetRange
  const correct = Math.abs(off) <= step.tolerance
  const message = correct
    ? `On target — ${Math.round(angleDeg)}° gives a range of ${range.toFixed(1)} m.`
    : off < 0
      ? `Range is ${range.toFixed(1)} m, short of ${step.targetRange} m. Move the angle toward 45°.`
      : `Range is ${range.toFixed(1)} m, past ${step.targetRange} m. Move the angle away from 45°.`
  return { correct, message, range }
}

export function checkGraphTarget(
  step: Extract<Step, { type: 'graph-target' }>,
  velocity: number,
): CheckResult {
  const target = step.target.x / step.target.t
  const off = velocity - target
  const correct = Math.abs(off) <= step.tolerance
  const message = correct
    ? `The line lands right on (${step.target.t}s, ${step.target.x}m). Slope = ${velocity.toFixed(0)} m/s.`
    : off < 0
      ? `The line falls short of the point — steepen it (raise the velocity above ${velocity.toFixed(0)} m/s).`
      : `The line overshoots the point — ease the velocity below ${velocity.toFixed(0)} m/s.`
  return { correct, message }
}

/** Fall time for a chosen drop height: t = sqrt(2h/g). */
export function dropFallTime(height: number, gravity = 9.8): number {
  return Math.sqrt((2 * Math.max(0, height)) / gravity)
}

export function checkDropTarget(
  step: Extract<Step, { type: 'drop-target' }>,
  height: number,
): CheckResult & { time: number } {
  const g = step.gravity ?? 9.8
  const time = dropFallTime(height, g)
  const off = time - step.targetTime
  const correct = Math.abs(off) <= step.tolerance
  const message = correct
    ? `A ${height.toFixed(0)} m drop falls for ${time.toFixed(2)} s — right on target.`
    : off < 0
      ? `Falls for only ${time.toFixed(2)} s — too quick. Raise the height to lengthen the fall.`
      : `Falls for ${time.toFixed(2)} s — too long. Lower the height to shorten the fall.`
  return { correct, message, time }
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
