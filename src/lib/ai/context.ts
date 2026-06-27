// Builds the small, structured payloads the AI proxy receives. The rule: send
// lesson STATE (typed fields), never rendered HTML or free-form blobs. This is
// what keeps every AI feature grounded in the real problem the learner is on.

import type { Lesson, Step } from '../../types/content'
import type { StepContext } from './types'

/** Extract the authored correct answer from a step, as a string for grounding. */
function correctAnswerOf(step: Step): string | undefined {
  switch (step.type) {
    case 'predict':
    case 'mcq':
    case 'recall': {
      const choice = step.choices.find((c) => c.id === step.correctId)
      return choice ? choice.label : step.correctId
    }
    case 'numeric':
      return `${step.answer} ${step.unit}`
    case 'slider-estimate':
      return `${step.answer}${step.judge === 'angle' ? '°' : ' m/s'}`
    case 'sim-challenge':
      return step.goal.kind === 'hitTarget'
        ? `land on the target at ${step.sim.target?.distance ?? '?'} m`
        : `clear the ${step.sim.wall?.height ?? '?'} m wall and land beyond it`
    case 'tap-landing':
      return 'the true landing distance of the shot'
    case 'graph-target':
      return `a velocity (slope) of ${(step.target.x / step.target.t).toFixed(1)} m/s`
    case 'drop-target':
      return `a drop height that makes the fall last ${step.targetTime} s`
    case 'plot-position':
      return `${step.velocity * step.time} m from the start`
    case 'stop-fall':
      return `stopping the ball at ${step.targetDistance} m fallen`
    case 'curve-aim':
      return `an angle whose range is ${step.targetRange} m`
    default:
      return undefined
  }
}

/** Serialize the current step (+ lesson framing) into a hint/explain context. */
export function buildStepContext(lesson: Lesson, step: Step): StepContext {
  const base: StepContext = {
    lessonTitle: lesson.title,
    bigIdea: lesson.bigIdea,
    concept: step.concept,
    phase: step.phase,
    stepType: step.type,
    prompt: 'prompt' in step ? step.prompt : 'title' in step ? step.title : '',
    correctAnswer: correctAnswerOf(step),
  }
  if ('choices' in step && step.choices) {
    base.choices = step.choices.map((c) => ({ id: c.id, label: c.label }))
  }
  return base
}

/** Convert a stored answer (choice id or number) into a human-readable string. */
export function describeAnswer(step: Step, answer: string | number | null): string {
  if (answer == null) return 'no answer'
  if (typeof answer === 'number') return `${answer}`
  if ('choices' in step && step.choices) {
    const choice = step.choices.find((c) => c.id === answer)
    if (choice) return choice.label
  }
  return `${answer}`
}
