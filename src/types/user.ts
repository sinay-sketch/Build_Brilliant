export interface StreakState {
  current: number
  longest: number
  /** 'YYYY-MM-DD' of the last day the learner met the daily goal. */
  lastActiveDate: string | null
  /** "Freeze" charges that protect a streak from a missed day (max 2). */
  charges: number
}

export interface UserProfile {
  displayName: string
  email: string
  createdAt: number
  xp: number
  level: number
  streak: StreakState
  dailyGoalProblems: number
}

export interface StepState {
  attempts: number
  correct: boolean
  /** Last submitted answer (choice id or number), for resume + review. */
  lastAnswer: string | number | null
  /** How many AI hints the learner pulled on this step (analytics). */
  hintsUsed?: number
  /** Whether the learner asked AI to explain a mistake here (analytics). */
  aiExplainUsed?: boolean
}

/**
 * Per-concept mastery, stored at users/{uid}/mastery/{conceptId}. `score` is an
 * exponential moving average of first-attempt correctness in [0,1]; a concept
 * is considered mastered at >= 0.8.
 */
export interface MasteryRecord {
  score: number
  attempts: number
  correct: number
  lastReviewed: number
}

export const MASTERED_THRESHOLD = 0.8

export type LessonStatus = 'not_started' | 'in_progress' | 'completed'

export interface LessonProgress {
  status: LessonStatus
  currentStepIndex: number
  stepStates: Record<string, StepState>
  startedAt: number | null
  completedAt: number | null
  updatedAt: number
}

export interface DailyActivity {
  problemsSolved: number
  lessonsCompleted: number
  xpEarned: number
}

export const DEFAULT_DAILY_GOAL = 10
export const XP_PER_PROBLEM = 10
export const XP_PER_LESSON = 50

// Progressive leveling: the cost to go from level n to n+1 is 50·(n+1) XP, so
// L1→2 = 100, L2→3 = 150, L3→4 = 200, … (each level costs 50 more than the last).

/** Total XP required to *be* at a given level (level 1 starts at 0). */
export function xpToReachLevel(level: number): number {
  if (level <= 1) return 0
  return 50 * ((level * (level + 1)) / 2 - 1)
}

/** XP span of the current level: the cost to go from `level` to `level + 1`. */
export function xpForNextLevel(level: number): number {
  return 50 * (level + 1)
}

export function levelForXp(xp: number): number {
  let level = 1
  while (xp >= xpToReachLevel(level + 1)) level++
  return level
}

export interface LevelProgress {
  level: number
  /** XP earned within the current level. */
  into: number
  /** XP needed to complete the current level. */
  span: number
  /** XP remaining to reach the next level. */
  toNext: number
  /** Fraction of the current level completed, in [0, 1]. */
  frac: number
}

export function levelProgress(xp: number): LevelProgress {
  const level = levelForXp(xp)
  const into = xp - xpToReachLevel(level)
  const span = xpForNextLevel(level)
  return { level, into, span, toNext: Math.max(0, span - into), frac: Math.min(1, into / span) }
}
