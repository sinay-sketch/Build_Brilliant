import { describe, it, expect } from 'vitest'
import type { GenQuantity, GeneratedProblemSpec } from '../src/lib/ai/types'
import { buildVerifiedProblem, computeQuantity } from '../src/lib/ai/verify'
import { computeKinematics } from '../src/lib/physics'

const QUANTITIES: GenQuantity[] = ['range', 'maxHeight', 'timeOfFlight', 'vx', 'vy']

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

describe('practice generation invariant', () => {
  it("never trusts the model's number: the built answer is engine-computed and within tolerance", () => {
    let built = 0
    for (let i = 0; i < 2000; i++) {
      const angleDeg = 10 + Math.random() * 70
      const speed = 5 + Math.random() * 40
      const quantity = QUANTITIES[Math.floor(Math.random() * QUANTITIES.length)]
      const result = buildVerifiedProblem(specFor(angleDeg, speed, quantity), 'range-reasoning')
      if (!result) continue
      built++

      const k = computeKinematics(angleDeg, speed, 9.8)
      const truth =
        quantity === 'range' ? k.range
        : quantity === 'maxHeight' ? k.maxHeight
        : quantity === 'timeOfFlight' ? k.timeOfFlight
        : quantity === 'vx' ? k.vx
        : k.vy

      expect(Math.abs(result.step.answer - truth)).toBeLessThanOrEqual(result.step.tolerance)
      expect(result.step.explanation).not.toContain('{answer}')
    }
    expect(built).toBeGreaterThan(1000)
  })

  it('rejects physically nonsensical scenarios', () => {
    expect(buildVerifiedProblem(specFor(0, 20, 'range'), 'range-reasoning')).toBeNull()
    expect(buildVerifiedProblem(specFor(95, 20, 'range'), 'range-reasoning')).toBeNull()
    expect(buildVerifiedProblem(specFor(45, 0, 'range'), 'range-reasoning')).toBeNull()
    expect(buildVerifiedProblem(specFor(45, 1000, 'range'), 'range-reasoning')).toBeNull()
  })

  it('computeQuantity agrees with computeKinematics', () => {
    const k = computeKinematics(40, 22, 9.8)
    expect(computeQuantity('range', 40, 22, 9.8)).toBeCloseTo(k.range, 6)
    expect(computeQuantity('maxHeight', 40, 22, 9.8)).toBeCloseTo(k.maxHeight, 6)
    expect(computeQuantity('vx', 40, 22, 9.8)).toBeCloseTo(k.vx, 6)
  })
})
