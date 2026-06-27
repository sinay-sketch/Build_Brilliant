import { describe, it, expect } from 'vitest'
import { xpToReachLevel, xpForNextLevel, levelForXp, levelProgress } from '../src/types/user'

describe('progressive XP curve', () => {
  it('costs 100 to reach L2, then +50 each level', () => {
    expect(xpToReachLevel(1)).toBe(0)
    expect(xpToReachLevel(2)).toBe(100)
    expect(xpToReachLevel(3)).toBe(250)
    expect(xpToReachLevel(4)).toBe(450)
  })

  it('reports the per-level span (50·(n+1))', () => {
    expect(xpForNextLevel(1)).toBe(100)
    expect(xpForNextLevel(2)).toBe(150)
    expect(xpForNextLevel(3)).toBe(200)
  })

  it('maps total XP to the right level', () => {
    expect(levelForXp(0)).toBe(1)
    expect(levelForXp(99)).toBe(1)
    expect(levelForXp(100)).toBe(2)
    expect(levelForXp(249)).toBe(2)
    expect(levelForXp(250)).toBe(3)
    expect(levelForXp(449)).toBe(3)
    expect(levelForXp(450)).toBe(4)
  })

  it('computes progress within the current level', () => {
    const p = levelProgress(120)
    expect(p.level).toBe(2)
    expect(p.into).toBe(20)
    expect(p.span).toBe(150)
    expect(p.toNext).toBe(130)
    expect(p.frac).toBeCloseTo(20 / 150, 5)
  })
})
