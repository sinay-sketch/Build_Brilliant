// Property check for the generation invariant (Phase 2 plan):
// every problem the generator BUILDS must have an engine-correct answer, and
// physically nonsensical scenarios must be rejected. Run with:  npx tsx scripts/verify-generation.ts
//
// This imports the real verify.ts + physics.ts (no Firebase, no env), so it
// exercises the exact code path that ships.

import { buildVerifiedProblem, computeQuantity } from '../src/lib/ai/verify'
import { computeKinematics } from '../src/lib/physics'
import type { GenQuantity, GeneratedProblemSpec } from '../src/lib/ai/types'
import type { ConceptId } from '../src/types/content'

const QUANTITIES: GenQuantity[] = ['range', 'maxHeight', 'timeOfFlight', 'vx', 'vy']
const CONCEPT: ConceptId = 'range-reasoning'

function specFor(angleDeg: number, speed: number, quantity: GenQuantity): GeneratedProblemSpec {
  return {
    kind: 'numeric',
    quantity,
    angleDeg,
    speed,
    gravity: 9.8,
    unit: quantity === 'timeOfFlight' ? 's' : quantity.startsWith('v') ? 'm/s' : 'm',
    prompt: 'test',
    hints: ['a', 'b'],
    explanationTemplate: 'answer is {answer}',
  }
}

let built = 0
let failures = 0

// 1) Every valid spec builds a problem whose answer matches an INDEPENDENT
//    recomputation from the physics engine.
for (let i = 0; i < 4000; i++) {
  const angleDeg = 10 + Math.random() * 70
  const speed = 5 + Math.random() * 40
  const quantity = QUANTITIES[Math.floor(Math.random() * QUANTITIES.length)]
  const result = buildVerifiedProblem(specFor(angleDeg, speed, quantity), CONCEPT)
  if (!result) continue
  built++

  const truth = computeQuantity(quantity, angleDeg, speed, 9.8)
  const k = computeKinematics(angleDeg, speed, 9.8)
  const independent =
    quantity === 'range' ? k.range
    : quantity === 'maxHeight' ? k.maxHeight
    : quantity === 'timeOfFlight' ? k.timeOfFlight
    : quantity === 'vx' ? k.vx
    : k.vy

  // The built answer is the engine value rounded to 0.1, and it must be inside
  // the tolerance the learner is graded against.
  if (Math.abs(result.step.answer - truth) > result.step.tolerance) {
    failures++
    console.error(`Answer outside tolerance: ${quantity} a=${angleDeg} v=${speed} ans=${result.step.answer} truth=${truth}`)
  }
  if (Math.abs(truth - independent) > 1e-9) {
    failures++
    console.error(`Engine disagreement for ${quantity}`)
  }
  if (result.step.explanation.includes('{answer}')) {
    failures++
    console.error('Explanation still contains the {answer} token')
  }
}

// 2) Out-of-range / degenerate scenarios must be rejected (null).
const rejects: Array<[number, number]> = [
  [0, 20], // angle too low -> no positive arc range, also below envelope
  [95, 20], // angle too high
  [45, 0], // no speed
  [45, 1000], // speed out of envelope
]
for (const [angleDeg, speed] of rejects) {
  const r = buildVerifiedProblem(specFor(angleDeg, speed, 'range'), CONCEPT)
  if (r !== null) {
    failures++
    console.error(`Expected rejection for angle=${angleDeg} speed=${speed}, but built a problem`)
  }
}

console.log(`Built ${built} problems from valid specs.`)
if (failures === 0) {
  console.log('PASS: every generated problem is engine-correct, and bad specs were rejected.')
  process.exit(0)
} else {
  console.error(`FAIL: ${failures} invariant violation(s).`)
  process.exit(1)
}
