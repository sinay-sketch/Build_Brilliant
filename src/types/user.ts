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
}

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
export const XP_PER_LEVEL = 200

export function levelForXp(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1
}
