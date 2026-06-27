// Deterministic practice problems for the NON-projectile concepts (free fall,
// position & velocity). Every answer is computed from the kinematics formulas
// here, so these are always correct without any model call. Projectile concepts
// are handled by the AI generator + engine verifier in generate.ts.

import type { ConceptId, McqStep, NumericStep, Step } from '../../types/content'
import type { GenDifficulty } from './types'

const G = 9.8

function round1(n: number): number {
  return Math.round(n * 10) / 10
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}
function randInt(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min + 1))
}
function uid(concept: string): string {
  return `gen-${concept}-${Math.random().toString(36).slice(2, 9)}`
}

function numeric(
  concept: ConceptId,
  fields: Omit<NumericStep, 'id' | 'type' | 'concept' | 'phase'>,
): NumericStep {
  return { id: uid(concept), type: 'numeric', concept, phase: 'practice', ...fields }
}

function mcq(concept: ConceptId, prompt: string, options: Array<{ label: string; correct: boolean; feedback: string }>, explanation: string): McqStep {
  const choices = options.map((o, i) => ({ id: `c${i}`, label: o.label }))
  const correct = options.findIndex((o) => o.correct)
  const perChoiceFeedback: Record<string, string> = {}
  options.forEach((o, i) => {
    perChoiceFeedback[`c${i}`] = o.feedback
  })
  return {
    id: uid(concept),
    type: 'mcq',
    concept,
    phase: 'practice',
    prompt,
    choices,
    correctId: `c${Math.max(0, correct)}`,
    perChoiceFeedback,
    explanation,
  }
}

// ---- Free fall -------------------------------------------------------------

function gravityAccel(difficulty: GenDifficulty): NumericStep {
  const t = difficulty === 'easy' ? pick([1, 2, 3]) : round1(randInt(10, 60) / 10)
  // Half the time, invert (find time from speed).
  if (Math.random() < 0.4) {
    const v = round1(G * t)
    return numeric('gravity-accel', {
      prompt: `A dropped object reaches a speed of ${v} m/s. How long has it been falling? (t = v / g, g = 9.8)`,
      answer: round1(v / G),
      unit: 's',
      tolerance: 0.2,
      min: 0,
      max: 20,
      hints: ['Rearrange v = g·t to t = v / g.', `That is ${v} ÷ 9.8.`],
      explanation: `t = v / g = ${v} / 9.8 ≈ ${round1(v / G)} s.`,
    })
  }
  return numeric('gravity-accel', {
    prompt: `An object is dropped from rest. How fast is it falling after ${t} s? (v = g·t, g = 9.8)`,
    answer: round1(G * t),
    unit: 'm/s',
    tolerance: 0.5,
    min: 0,
    max: 200,
    hints: ['Use v = g·t.', `That is 9.8 × ${t}.`],
    explanation: `v = g·t = 9.8 × ${t} = ${round1(G * t)} m/s.`,
  })
}

function fallDistance(difficulty: GenDifficulty): NumericStep {
  const t = difficulty === 'easy' ? pick([1, 2, 3]) : round1(randInt(10, 55) / 10)
  const d = round1(0.5 * G * t * t)
  return numeric('fall-distance', {
    prompt: `An object falls from rest for ${t} s. How far does it drop? (d = ½·g·t², g = 9.8)`,
    answer: d,
    unit: 'm',
    tolerance: Math.max(0.5, round1(d * 0.04)),
    min: 0,
    max: 500,
    hints: ['Use d = ½·g·t².', `That is 0.5 × 9.8 × ${t}².`],
    explanation: `d = ½·g·t² = 0.5 × 9.8 × ${t}² = ${d} m.`,
  })
}

function freeFallRate(): McqStep {
  return pick<McqStep>([
    mcq(
      'free-fall-rate',
      'In a vacuum, a bowling ball and a feather are dropped together. Which lands first?',
      [
        { label: 'The bowling ball', correct: false, feedback: 'Heavier does not mean faster in a vacuum — there is no air to slow the feather.' },
        { label: 'The feather', correct: false, feedback: 'Nothing makes the feather faster; with no air they fall identically.' },
        { label: 'They land together', correct: true, feedback: 'Right — with no air resistance, all masses fall at the same rate.' },
      ],
      'In a vacuum there is no air resistance, so gravity accelerates both objects equally and they land at the same time.',
    ),
    mcq(
      'free-fall-rate',
      'Two balls, 1 kg and 5 kg, are dropped from the same height (ignore air). How do their fall times compare?',
      [
        { label: 'The 5 kg ball lands first', correct: false, feedback: 'Mass does not change the rate of fall when air is ignored.' },
        { label: 'They land at the same time', correct: true, feedback: 'Exactly — fall time is independent of mass.' },
        { label: 'The 1 kg ball lands first', correct: false, feedback: 'Lighter is not faster either; mass cancels out.' },
      ],
      'Without air resistance, every mass accelerates at g and falls in the same time from the same height.',
    ),
  ])
}

// ---- Position & velocity ---------------------------------------------------

function avgVelocity(): NumericStep {
  const dt = randInt(4, 60)
  const v = pick([4, 5, 6, 8, 10, 12, 15, 20, 25])
  const dx = v * dt
  return numeric('avg-velocity', {
    prompt: `An object has a displacement of ${dx} m over ${dt} s. What is its average velocity? (v = Δx / Δt)`,
    answer: round1(v),
    unit: 'm/s',
    tolerance: 0.3,
    min: 0,
    max: 100,
    hints: ['Use v = Δx / Δt.', `That is ${dx} ÷ ${dt}.`],
    explanation: `v = Δx / Δt = ${dx} / ${dt} = ${round1(v)} m/s.`,
  })
}

function velocityGraph(): NumericStep {
  const dt = randInt(2, 8)
  const v = pick([3, 5, 6, 8, 10, 12, 15])
  const x1 = randInt(0, 5) * 10
  const x2 = x1 + v * dt
  return numeric('velocity-graph', {
    prompt: `On a position-time graph, position goes from ${x1} m to ${x2} m over ${dt} s in a straight line. What is the velocity (the slope)?`,
    answer: round1(v),
    unit: 'm/s',
    tolerance: 0.3,
    min: 0,
    max: 100,
    hints: ['Velocity is the slope: rise ÷ run.', `Rise = ${x2} − ${x1} = ${x2 - x1}, run = ${dt}.`],
    explanation: `v = (${x2} − ${x1}) / ${dt} = ${x2 - x1} / ${dt} = ${round1(v)} m/s.`,
  })
}

function displacement(): NumericStep {
  const a = randInt(4, 9)
  const b = randInt(1, a - 1)
  return numeric('displacement', {
    prompt: `You walk ${a} m east, then ${b} m west. What is your net displacement? (east is positive)`,
    answer: a - b,
    unit: 'm',
    tolerance: 0.1,
    min: 0,
    max: 20,
    hints: ['Displacement is final position minus start, with direction.', `That is ${a} − ${b}.`],
    explanation: `Net displacement = ${a} m east − ${b} m west = ${a - b} m east. (Distance walked was ${a + b} m.)`,
  })
}

function speedVsVelocity(): McqStep {
  return pick<McqStep>([
    mcq(
      'speed-vs-velocity',
      'Which statement describes a velocity (not just a speed)?',
      [
        { label: '"A car moving at 25 m/s."', correct: false, feedback: 'That is a speed — no direction.' },
        { label: '"A car moving at 25 m/s, due north."', correct: true, feedback: 'Yes — it has a size and a direction.' },
        { label: '"A car that travelled 25 meters."', correct: false, feedback: 'That is a distance, not a rate.' },
      ],
      'Velocity needs a direction. "25 m/s north" is a velocity; "25 m/s" alone is only speed.',
    ),
    mcq(
      'speed-vs-velocity',
      'Two runners go 6 m/s — one north, one south. Compare their speeds and velocities.',
      [
        { label: 'Same speed, same velocity', correct: false, feedback: 'Speeds match, but opposite directions mean different velocities.' },
        { label: 'Same speed, different velocities', correct: true, feedback: 'Right — equal speeds, opposite directions, so different velocities.' },
        { label: 'Different speeds, same velocity', correct: false, feedback: 'Their speeds are equal (both 6 m/s); the directions differ.' },
      ],
      'Speed ignores direction (both 6 m/s); velocity includes it, and opposite directions make the velocities different.',
    ),
  ])
}

function gravityIndependence(): McqStep {
  return pick<McqStep>([
    mcq(
      'gravity-independence',
      'One ball is dropped and another is thrown horizontally from the same height at the same instant. Which lands first?',
      [
        { label: 'The dropped ball', correct: false, feedback: 'Sideways motion does not change the fall time.' },
        { label: 'The thrown ball', correct: false, feedback: 'Moving sideways does not make it land sooner or later.' },
        { label: 'They land at the same time', correct: true, feedback: 'Right — vertical and horizontal motion are independent.' },
      ],
      'Horizontal motion does not affect vertical fall, so both reach the ground at the same instant.',
    ),
  ])
}

const GENERATORS: Partial<Record<ConceptId, (d: GenDifficulty) => Step>> = {
  'gravity-accel': gravityAccel,
  'fall-distance': fallDistance,
  'free-fall-rate': () => freeFallRate(),
  'avg-velocity': () => avgVelocity(),
  'velocity-graph': () => velocityGraph(),
  displacement: () => displacement(),
  'speed-vs-velocity': () => speedVsVelocity(),
  'gravity-independence': () => gravityIndependence(),
}

export function hasConceptGenerator(concept: ConceptId): boolean {
  return concept in GENERATORS
}

/** Build a deterministic, correct practice problem for a non-projectile concept. */
export function conceptProblem(concept: ConceptId, difficulty: GenDifficulty): Step | null {
  const gen = GENERATORS[concept]
  return gen ? gen(difficulty) : null
}
