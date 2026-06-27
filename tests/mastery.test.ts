import { describe, it, expect } from 'vitest'
import type { ConceptId } from '../src/types/content'
import type { MasteryRecord } from '../src/types/user'
import {
  updateMastery,
  masteryLevel,
  weakestConcept,
  difficultyForScore,
} from '../src/lib/mastery'

describe('updateMastery', () => {
  it('does not jump to mastery on a single correct answer', () => {
    const m = updateMastery(undefined, true)
    expect(m.score).toBeCloseTo(0.34, 2)
    expect(m.attempts).toBe(1)
    expect(m.correct).toBe(1)
    expect(masteryLevel(m)).toBe('learning')
  })

  it('reaches mastery after several correct answers in a row', () => {
    let m: MasteryRecord | undefined
    for (let i = 0; i < 4; i++) m = updateMastery(m, true)
    expect(m!.score).toBeGreaterThanOrEqual(0.8)
    expect(masteryLevel(m)).toBe('mastered')
  })

  it('roughly halves the score on a wrong answer', () => {
    let m = updateMastery(undefined, true)
    for (let i = 0; i < 3; i++) m = updateMastery(m, true)
    const before = m.score
    m = updateMastery(m, false)
    expect(m.score).toBeCloseTo(before * 0.5, 5)
  })

  it('treats an unattempted concept as new', () => {
    expect(masteryLevel(undefined)).toBe('new')
  })
})

describe('weakestConcept', () => {
  it('returns the lowest-scoring attempted, not-yet-mastered concept', () => {
    const mastery: Partial<Record<ConceptId, MasteryRecord>> = {
      components: { score: 0.9, attempts: 6, correct: 6, lastReviewed: 1 },
      'range-reasoning': { score: 0.3, attempts: 2, correct: 1, lastReviewed: 1 },
      'angle-range': { score: 0.6, attempts: 3, correct: 2, lastReviewed: 1 },
    }
    expect(weakestConcept(mastery)).toBe('range-reasoning')
  })

  it('returns null when nothing has been attempted', () => {
    expect(weakestConcept({})).toBeNull()
  })
})

describe('difficultyForScore', () => {
  it('scales difficulty with mastery', () => {
    expect(difficultyForScore(undefined)).toBe('easy')
    expect(difficultyForScore(0.2)).toBe('easy')
    expect(difficultyForScore(0.5)).toBe('medium')
    expect(difficultyForScore(0.9)).toBe('hard')
  })
})
