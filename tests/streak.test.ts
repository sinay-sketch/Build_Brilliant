import { describe, it, expect } from 'vitest'
import { advanceStreak, emptyStreak, dayKey } from '../src/lib/streak'

describe('advanceStreak', () => {
  it('starts a streak at 1 and grants a freeze charge', () => {
    const s = advanceStreak(emptyStreak, '2024-01-01')
    expect(s.current).toBe(1)
    expect(s.longest).toBe(1)
    expect(s.lastActiveDate).toBe('2024-01-01')
    expect(s.charges).toBe(1)
  })

  it('extends on a consecutive day', () => {
    let s = advanceStreak(emptyStreak, '2024-01-01')
    s = advanceStreak(s, '2024-01-02')
    expect(s.current).toBe(2)
    expect(s.longest).toBe(2)
  })

  it('is idempotent for the same day', () => {
    const s1 = advanceStreak(emptyStreak, '2024-01-01')
    const s2 = advanceStreak(s1, '2024-01-01')
    expect(s2).toEqual(s1)
  })

  it('forgives a one-day gap by spending a freeze charge', () => {
    let s = advanceStreak(emptyStreak, '2024-01-01') // current 1, charges 1
    // skip 2024-01-02, return on 2024-01-03 (gap of 1 missed day)
    s = advanceStreak(s, '2024-01-03')
    expect(s.current).toBe(2) // streak survived
  })

  it('resets to 1 when a gap exceeds available charges', () => {
    let s = advanceStreak(emptyStreak, '2024-01-01') // charges 1
    s = advanceStreak(s, '2024-01-10') // missed 8 days, only 1 charge
    expect(s.current).toBe(1)
  })
})

describe('dayKey', () => {
  it('formats a date as YYYY-MM-DD', () => {
    expect(dayKey(new Date('2024-03-05T12:00:00'))).toBe('2024-03-05')
  })
})
