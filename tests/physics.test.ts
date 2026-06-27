import { describe, it, expect } from 'vitest'
import {
  computeKinematics,
  heightAtX,
  trajectoryPoints,
  evaluateHitTarget,
  evaluateClearWall,
} from '../src/lib/physics'

describe('computeKinematics', () => {
  it('splits a 45° launch into equal components', () => {
    const k = computeKinematics(45, 20, 9.8)
    expect(k.vx).toBeCloseTo(14.142, 2)
    expect(k.vy).toBeCloseTo(14.142, 2)
  })

  it('gives maximum range at 45° (R = v²/g)', () => {
    const k = computeKinematics(45, 20, 9.8)
    expect(k.range).toBeCloseTo(40.816, 2)
  })

  it('matches the closed-form peak height and time of flight', () => {
    const k = computeKinematics(30, 20, 9.8)
    // vy = 10, H = vy²/(2g) = 100/19.6, t = 2vy/g = 20/9.8
    expect(k.maxHeight).toBeCloseTo(5.102, 2)
    expect(k.timeOfFlight).toBeCloseTo(2.041, 2)
    // R = v²·sin(2θ)/g = 400·sin60°/9.8
    expect(k.range).toBeCloseTo(35.31, 1)
  })

  it('complementary angles share the same range', () => {
    const a = computeKinematics(30, 22, 9.8).range
    const b = computeKinematics(60, 22, 9.8).range
    expect(a).toBeCloseTo(b, 5)
  })

  it('returns zero flight for a non-positive vertical component', () => {
    const k = computeKinematics(0, 20, 9.8)
    expect(k.timeOfFlight).toBe(0)
    expect(k.range).toBe(0)
  })
})

describe('heightAtX', () => {
  it('peaks at the midpoint of the range for a symmetric arc', () => {
    const { range, maxHeight } = computeKinematics(45, 20, 9.8)
    expect(heightAtX(45, 20, 9.8, range / 2)).toBeCloseTo(maxHeight, 3)
  })
})

describe('trajectoryPoints', () => {
  it('starts at the origin and ends back at the ground', () => {
    const pts = trajectoryPoints(40, 20, 9.8, 50)
    expect(pts[0].x).toBeCloseTo(0, 6)
    expect(pts[0].y).toBeCloseTo(0, 6)
    expect(pts[pts.length - 1].y).toBeCloseTo(0, 6)
  })
})

describe('goal evaluation', () => {
  it('detects a hit within the target radius', () => {
    const r = evaluateHitTarget(45, 20, 9.8, { distance: 40.8, radius: 2.5 })
    expect(r.success).toBe(true)
  })

  it('detects a miss outside the target radius', () => {
    const r = evaluateHitTarget(20, 12, 9.8, { distance: 40, radius: 2 })
    expect(r.success).toBe(false)
  })

  it('clears a wall only when both edges top it and it lands beyond', () => {
    const clears = evaluateClearWall(50, 24, 9.8, { distance: 25, height: 6, width: 2 })
    expect(clears.success).toBe(true)
    const tooFlat = evaluateClearWall(15, 16, 9.8, { distance: 25, height: 6, width: 2 })
    expect(tooFlat.success).toBe(false)
  })
})
