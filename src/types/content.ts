// The structured content model. A lesson is DATA (a sequence of interactive
// steps), never HTML. This is what lets us add lessons fast and, later, lets AI
// generate them (Phase 2). Nothing here calls a model: all feedback is authored.

export type ConceptId =
  | 'gravity-independence'
  | 'components'
  | 'angle-range'
  | 'complementary-angles'
  | 'trajectory-shape'
  | 'range-reasoning'
  // Free Fall & Gravity lesson
  | 'free-fall-rate'
  | 'gravity-accel'
  | 'fall-distance'
  // Position & Velocity lesson
  | 'speed-vs-velocity'
  | 'displacement'
  | 'velocity-graph'
  | 'avg-velocity'

export interface Choice {
  id: string
  label: string
}

/**
 * The pedagogical phase a step belongs to. This makes the teaching method
 * explicit and visible to the learner: every lesson walks Predict -> Explore ->
 * Build the idea -> Practice -> Master.
 */
export type StepPhase = 'predict' | 'explore' | 'build' | 'practice' | 'master'

export const PHASE_META: Record<StepPhase, { label: string; blurb: string }> = {
  predict: { label: 'Predict', blurb: 'Commit to a guess before the answer.' },
  explore: { label: 'Explore', blurb: 'Play with the model and notice patterns.' },
  build: { label: 'Build the idea', blurb: 'Turn what you saw into a principle.' },
  practice: { label: 'Practice', blurb: 'Apply it to a fresh problem.' },
  master: { label: 'Master', blurb: 'Recall it with no help.' },
}

/** A named formula with its symbols explained, rendered as an annotated card. */
export interface Formula {
  /** Human-readable expression, e.g. "R = v² · sin(2θ) / g". */
  expr: string
  terms: Array<{ symbol: string; meaning: string }>
}

/** Config for the interactive projectile simulator embedded in a step. */
export interface SimConfig {
  angleDeg: number
  speed: number
  gravity: number
  /** Which controls the learner may move. */
  editable: Array<'angle' | 'speed'>
  /** Optional target the learner must hit (meters from launch). */
  target?: { distance: number; radius: number }
  /** Optional wall the projectile must clear. */
  wall?: { distance: number; height: number; width: number }
  /** Show a faint reference arc to compare against. */
  ghost?: { angleDeg: number; speed: number }
}

/**
 * The exploratory (ungraded) visualization a question embeds so the learner has
 * a relevant model to think with. Authored per question for maximum relevance.
 * (Projectile cannon visuals can also use the richer `visual?: SimConfig`.)
 */
export type GameKind =
  | 'motion-graph'
  | 'track-trip'
  | 'two-runners'
  | 'round-trip'
  | 'drop-tower'
  | 'drop-race'
  | 'stroboscope'
  | 'feather-hammer'
  | 'vector-components'
  | 'parabola-tracer'
  | 'range-curve'
  | 'complementary-pair'

export interface GameSpec {
  kind: GameKind
  /** Starting values; ideally mirror the numbers in the question prompt. */
  config?: {
    velocity?: number
    v1?: number
    v2?: number
    speed?: number
    height?: number
    angleDeg?: number
  }
}

interface StepBase {
  id: string
  /** Concept this step builds mastery toward (omitted for pure concept cards). */
  concept?: ConceptId
  /** Which part of the teaching arc this step belongs to. */
  phase?: StepPhase
  /** A relevant interactive visualization for this specific question. */
  game?: GameSpec
}

/** A concept/intro card. No teaching of procedure before the learner tries. */
export interface ConceptStep extends StepBase {
  type: 'concept'
  title: string
  body: string
  /** Optional bulleted essence of the idea, shown as a highlighted list. */
  keyPoints?: string[]
  /** Optional annotated formula card. */
  formula?: Formula
  visual?: SimConfig
}

/** Predict-first: ask before revealing, to activate intuition. */
export interface PredictStep extends StepBase {
  type: 'predict'
  prompt: string
  choices: Choice[]
  correctId: string
  perChoiceFeedback: Record<string, string>
  explanation: string
  /** One-line principle to remember, shown as a takeaway after solving. */
  takeaway?: string
  visual?: SimConfig
}

export interface McqStep extends StepBase {
  type: 'mcq'
  prompt: string
  choices: Choice[]
  correctId: string
  perChoiceFeedback: Record<string, string>
  explanation: string
  takeaway?: string
  visual?: SimConfig
}

export interface NumericStep extends StepBase {
  type: 'numeric'
  prompt: string
  answer: number
  unit: string
  tolerance: number
  hints: string[]
  explanation: string
  /** Step-by-step worked solution, revealed after solving. */
  solution?: string[]
  takeaway?: string
  /** Range hints for the input UI. */
  min?: number
  max?: number
  visual?: SimConfig
}

/** The rich, beyond-MCQ problem: manipulate the simulator to meet a goal. */
export interface SimChallengeStep extends StepBase {
  type: 'sim-challenge'
  prompt: string
  sim: SimConfig
  goal: { kind: 'hitTarget' | 'clearWall' }
  hints: string[]
  explanation: string
  takeaway?: string
}

/**
 * Predict-the-landing: the arc is hidden. The learner drags a marker along the
 * ground to where they think the ball will land, then fires to check.
 */
export interface TapLandingStep extends StepBase {
  type: 'tap-landing'
  prompt: string
  sim: SimConfig
  /** How close (in meters) the guess must be to count as correct. */
  tolerance: number
  hints?: string[]
  explanation: string
  takeaway?: string
}

/**
 * Dial-it-in: a live simulator slider the learner drags to a target value,
 * watching the readouts respond, then checks. Distinct from typing a number.
 */
export interface SliderEstimateStep extends StepBase {
  type: 'slider-estimate'
  prompt: string
  sim: SimConfig
  /** Which slider value is being judged. */
  judge: 'angle' | 'speed'
  answer: number
  tolerance: number
  hints?: string[]
  explanation: string
  takeaway?: string
}

/**
 * Graded graph interaction (Position & Velocity): the learner drags a velocity
 * slider until the position-time line passes through a target point. The judged
 * value is the velocity; the correct answer is target.x / target.t.
 */
export interface GraphTargetStep extends StepBase {
  type: 'graph-target'
  prompt: string
  /** The point the line must pass through, on a position-time graph. */
  target: { t: number; x: number }
  /** Tolerance on the velocity (m/s). */
  tolerance: number
  startV?: number
  hints?: string[]
  explanation: string
  takeaway?: string
}

/**
 * Graded drop interaction (Free Fall): the learner sets the drop height so the
 * ball's fall lasts a target number of seconds, watching the live fall-time
 * readout. The judged value is the resulting time t = sqrt(2h/g).
 */
export interface DropTargetStep extends StepBase {
  type: 'drop-target'
  prompt: string
  /** Target fall time the learner must dial in (seconds). */
  targetTime: number
  /** Tolerance on the fall time (s). */
  tolerance: number
  gravity?: number
  hints?: string[]
  explanation: string
  takeaway?: string
}

/**
 * Graded number-line game (Position & Velocity): an object moves at a constant
 * velocity; the learner drags a marker to where it is after `time` seconds.
 * Correct position = velocity · time.
 */
export interface PlotPositionStep extends StepBase {
  type: 'plot-position'
  prompt: string
  velocity: number
  time: number
  /** Tolerance on the placed position (m). */
  tolerance: number
  max?: number
  hints?: string[]
  explanation: string
  takeaway?: string
}

/**
 * Graded reaction game (Free Fall): a ball falls; the learner hits STOP when it
 * has fallen the target distance (no live readout — they judge by eye). The
 * judged value is the distance fallen at the moment of the stop.
 */
export interface StopFallStep extends StepBase {
  type: 'stop-fall'
  prompt: string
  targetDistance: number
  /** Total fall height available (m); must exceed targetDistance. */
  height: number
  /** Tolerance on the stopped distance (m). */
  tolerance: number
  gravity?: number
  hints?: string[]
  explanation: string
  takeaway?: string
}

/**
 * Graded curve game (Range vs. Angle): the learner drags the angle on the
 * range-vs-angle curve until the range hits a target. Judged on the resulting
 * range, so either complementary angle is accepted.
 */
export interface CurveAimStep extends StepBase {
  type: 'curve-aim'
  prompt: string
  targetRange: number
  speed: number
  /** Tolerance on the range (m). */
  tolerance: number
  gravity?: number
  hints?: string[]
  explanation: string
  takeaway?: string
}

/** Retrieval practice: recall from memory, no visual aid. */
export interface RecallStep extends StepBase {
  type: 'recall'
  prompt: string
  choices: Choice[]
  correctId: string
  explanation: string
  takeaway?: string
}

/** Which hands-on widget an interactive step embeds. */
export type InteractiveWidget =
  | 'vector-components'
  | 'drop-race'
  | 'motion-graph'
  | 'drop-tower'
  | 'range-curve'

/**
 * A hands-on exploration screen built around a dedicated interactive widget
 * (beyond the cannon). Not graded — the point is to play and notice.
 */
export interface InteractiveStep extends StepBase {
  type: 'interactive'
  title: string
  body: string
  widget: InteractiveWidget
  /** Optional starting values for the widget. */
  config?: { angleDeg?: number; speed?: number; gravity?: number; velocity?: number; height?: number }
  /** Optional things to look for while exploring. */
  keyPoints?: string[]
}

export type Step =
  | ConceptStep
  | PredictStep
  | McqStep
  | NumericStep
  | SimChallengeStep
  | RecallStep
  | InteractiveStep
  | TapLandingStep
  | SliderEstimateStep
  | GraphTargetStep
  | DropTargetStep
  | PlotPositionStep
  | StopFallStep
  | CurveAimStep

/** The framing screen shown before a lesson's first step. */
export interface LessonIntro {
  /** The hook question that motivates the whole lesson. */
  hook: string
  /** What the learner will be able to do by the end. */
  objectives: string[]
  /** Why this matters / where it shows up in the real world. */
  whyItMatters: string
}

export interface Lesson {
  id: string
  courseId: string
  order: number
  title: string
  /** One-line concept summary. */
  concept: string
  estMinutes: number
  /** Lesson ids that must be completed first. */
  prerequisites: string[]
  /** Whether this lesson is fully built and playable (MVP focuses on one). */
  playable: boolean
  /** Optional framing screen shown before step 1. */
  intro?: LessonIntro
  /** The single sentence the learner should walk away with. */
  bigIdea?: string
  steps: Step[]
}

export interface LessonMeta {
  id: string
  courseId: string
  order: number
  title: string
  concept: string
  estMinutes: number
  prerequisites: string[]
  playable: boolean
}

export interface Course {
  id: string
  subject: 'physics'
  title: string
  description: string
  lessonOrder: string[]
}

/** Steps that count as gradeable "problems" (for streaks / progress). */
export const PROBLEM_STEP_TYPES: ReadonlyArray<Step['type']> = [
  'predict',
  'mcq',
  'numeric',
  'sim-challenge',
  'recall',
  'tap-landing',
  'slider-estimate',
  'graph-target',
  'drop-target',
  'plot-position',
  'stop-fall',
  'curve-aim',
]

export function isProblemStep(step: Step): boolean {
  return PROBLEM_STEP_TYPES.includes(step.type)
}
