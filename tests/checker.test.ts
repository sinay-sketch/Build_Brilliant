import { describe, it, expect } from 'vitest'
import type { Step } from '../src/types/content'
import {
  checkChoiceAnswer,
  checkNumericAnswer,
  checkGraphTarget,
  checkDropTarget,
  checkCurveAim,
  checkPlotPosition,
  checkStopFall,
  dropFallTime,
} from '../src/lib/checker'

describe('checkNumericAnswer', () => {
  it('accepts within tolerance and rejects outside it', () => {
    expect(checkNumericAnswer(5, 5, 0.2)).toBe(true)
    expect(checkNumericAnswer(5.15, 5, 0.2)).toBe(true)
    expect(checkNumericAnswer(5.5, 5, 0.2)).toBe(false)
  })
})

describe('checkChoiceAnswer', () => {
  const step = {
    id: 'q',
    type: 'mcq',
    prompt: '?',
    choices: [
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B' },
    ],
    correctId: 'b',
    perChoiceFeedback: { a: 'nope', b: 'yes' },
    explanation: '',
  } as Extract<Step, { type: 'mcq' }>

  it('marks the correct choice correct', () => {
    expect(checkChoiceAnswer(step, 'b').correct).toBe(true)
    expect(checkChoiceAnswer(step, 'a').correct).toBe(false)
  })
})

describe('checkGraphTarget', () => {
  const step = {
    id: 'g',
    type: 'graph-target',
    prompt: '?',
    target: { t: 4, x: 24 },
    tolerance: 0.6,
    explanation: '',
  } as Extract<Step, { type: 'graph-target' }>

  it('is correct only at the required slope (x/t = 6)', () => {
    expect(checkGraphTarget(step, 6).correct).toBe(true)
    expect(checkGraphTarget(step, 8).correct).toBe(false)
    expect(checkGraphTarget(step, 4).correct).toBe(false)
  })
})

describe('checkDropTarget', () => {
  const step = {
    id: 'd',
    type: 'drop-target',
    prompt: '?',
    targetTime: 2,
    tolerance: 0.15,
    gravity: 9.8,
    explanation: '',
  } as Extract<Step, { type: 'drop-target' }>

  it('uses t = sqrt(2h/g) and judges against the target time', () => {
    expect(dropFallTime(20, 9.8)).toBeCloseTo(2.02, 2)
    expect(checkDropTarget(step, 20).correct).toBe(true)
    expect(checkDropTarget(step, 5).correct).toBe(false)
  })
})

describe('checkCurveAim', () => {
  const step = {
    id: 'c',
    type: 'curve-aim',
    prompt: '?',
    targetRange: 40,
    speed: 24,
    tolerance: 3,
    gravity: 9.8,
    explanation: '',
  } as Extract<Step, { type: 'curve-aim' }>

  it('accepts either complementary angle that hits the target range', () => {
    expect(checkCurveAim(step, 21).correct).toBe(true)
    expect(checkCurveAim(step, 69).correct).toBe(true) // complement
    expect(checkCurveAim(step, 45).correct).toBe(false) // max range, overshoots
  })
})

describe('checkPlotPosition', () => {
  const step = {
    id: 'p',
    type: 'plot-position',
    prompt: '?',
    velocity: 7,
    time: 5,
    tolerance: 2,
    explanation: '',
  } as Extract<Step, { type: 'plot-position' }>

  it('is correct near v·t = 35', () => {
    expect(checkPlotPosition(step, 35).correct).toBe(true)
    expect(checkPlotPosition(step, 20).correct).toBe(false)
  })
})

describe('checkStopFall', () => {
  const step = {
    id: 's',
    type: 'stop-fall',
    prompt: '?',
    targetDistance: 20,
    height: 45,
    tolerance: 4,
    explanation: '',
  } as Extract<Step, { type: 'stop-fall' }>

  it('is correct when stopped near the target distance', () => {
    expect(checkStopFall(step, 20).correct).toBe(true)
    expect(checkStopFall(step, 5).correct).toBe(false)
  })
})
