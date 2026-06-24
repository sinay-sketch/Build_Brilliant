import type { StreakState } from '../types/user'

export const MAX_CHARGES = 2

/** Local-time 'YYYY-MM-DD' key for "today" (or a given date). */
export function dayKey(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function daysBetween(fromKey: string, toKey: string): number {
  const from = new Date(`${fromKey}T00:00:00`)
  const to = new Date(`${toKey}T00:00:00`)
  return Math.round((to.getTime() - from.getTime()) / 86_400_000)
}

/**
 * Advance the streak because the learner met today's goal. Idempotent for the
 * same day. A gap is forgiven if enough freeze charges are available, otherwise
 * the streak resets to 1.
 */
export function advanceStreak(streak: StreakState, today = dayKey()): StreakState {
  if (streak.lastActiveDate === today) return streak

  let current: number
  let charges = streak.charges

  if (!streak.lastActiveDate) {
    current = 1
  } else {
    const gap = daysBetween(streak.lastActiveDate, today)
    if (gap === 1) {
      current = streak.current + 1
    } else {
      const missed = gap - 1
      if (charges >= missed) {
        charges -= missed
        current = streak.current + 1
      } else {
        current = 1
      }
    }
  }

  // Earn a freeze charge for showing up (capped).
  charges = Math.min(MAX_CHARGES, charges + 1)

  return {
    current,
    longest: Math.max(streak.longest, current),
    lastActiveDate: today,
    charges,
  }
}

export const emptyStreak: StreakState = {
  current: 0,
  longest: 0,
  lastActiveDate: null,
  charges: 0,
}
