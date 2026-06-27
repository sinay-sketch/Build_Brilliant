import { createContext, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from './AuthContext'
import type { ConceptId } from '../types/content'
import type { DailyActivity, LessonProgress, MasteryRecord, UserProfile } from '../types/user'
import {
  DEFAULT_DAILY_GOAL,
  XP_PER_LESSON,
  XP_PER_PROBLEM,
  levelForXp,
} from '../types/user'
import { advanceStreak, dayKey, emptyStreak } from '../lib/streak'
import { updateMastery } from '../lib/mastery'

interface SubmitArgs {
  lessonId: string
  stepId: string
  concept?: ConceptId
  correct: boolean
  answer: string | number | null
  /** Whether this submission was the learner's first attempt at the step. */
  firstAttempt?: boolean
}

interface PracticeArgs {
  concept: ConceptId
  correct: boolean
}

interface UserDataValue {
  ready: boolean
  error: string | null
  profile: UserProfile | null
  progress: Record<string, LessonProgress>
  mastery: Partial<Record<ConceptId, MasteryRecord>>
  todayActivity: DailyActivity
  startLesson: (lessonId: string) => Promise<void>
  setCurrentStep: (lessonId: string, index: number) => Promise<void>
  submitProblem: (args: SubmitArgs) => Promise<void>
  recordPractice: (args: PracticeArgs) => Promise<void>
  completeLesson: (lessonId: string) => Promise<void>
}

const UserDataContext = createContext<UserDataValue | null>(null)

const emptyActivity: DailyActivity = { problemsSolved: 0, lessonsCompleted: 0, xpEarned: 0 }

function friendlyFirestoreError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? ''
  if (code === 'permission-denied') {
    return 'Cannot read your data. Firestore security rules need to be deployed (firebase deploy --only firestore:rules).'
  }
  if (code === 'unavailable' || code === 'failed-precondition') {
    return 'Cannot reach Firestore. Make sure a Firestore database has been created for this project.'
  }
  return 'Could not load your data. Check that Firestore is enabled and rules are deployed.'
}

export function UserDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [progress, setProgress] = useState<Record<string, LessonProgress>>({})
  const [mastery, setMastery] = useState<Partial<Record<ConceptId, MasteryRecord>>>({})
  const [todayActivity, setTodayActivity] = useState<DailyActivity>(emptyActivity)
  // The app is only "ready" once BOTH the profile and the lesson progress have
  // loaded. Gating on the profile alone caused a race where a lesson could be
  // re-initialized (wiping progress) before its saved state arrived.
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [progressLoaded, setProgressLoaded] = useState(false)
  const ready = profileLoaded && progressLoaded
  const [error, setError] = useState<string | null>(null)
  const today = useRef(dayKey()).current
  // One-shot guards so the self-healing profile writes below can never turn
  // into a write -> snapshot -> write loop (which caused a periodic re-render).
  const didSyncName = useRef(false)
  const didMigrateGoal = useRef(false)

  useEffect(() => {
    if (!user) {
      setProfile(null)
      setProgress({})
      setMastery({})
      setTodayActivity(emptyActivity)
      setProfileLoaded(false)
      setProgressLoaded(false)
      setError(null)
      return
    }
    setError(null)
    const uid = user.uid
    const profileRef = doc(db, 'users', uid)
    let cancelled = false
    didSyncName.current = false
    didMigrateGoal.current = false

    // Ensure the profile document exists before subscribing.
    const ensure = async () => {
      const snap = await getDoc(profileRef)
      if (!snap.exists() && !cancelled) {
        const fresh: UserProfile = {
          displayName: user.displayName ?? 'Learner',
          email: user.email ?? '',
          createdAt: Date.now(),
          xp: 0,
          level: 1,
          streak: emptyStreak,
          dailyGoalProblems: DEFAULT_DAILY_GOAL,
        }
        await setDoc(profileRef, fresh)
      }
    }

    const unsubs: Array<() => void> = []
    ensure().then(() => {
      if (cancelled) return
      unsubs.push(
        onSnapshot(
          profileRef,
          (snap) => {
            const data = (snap.data() as UserProfile) ?? null
            // Keep the stored name in sync with the auth profile. This also fixes
            // the sign-up race where the doc is created before updateProfile lands.
            // Guarded so it runs at most once and can't loop on its own echo.
            if (!didSyncName.current && data && user.displayName && data.displayName !== user.displayName) {
              didSyncName.current = true
              void setDoc(profileRef, { displayName: user.displayName }, { merge: true })
            }
            // The daily goal is a fixed app setting (no per-user UI), so keep
            // existing accounts aligned with the current default — once.
            if (!didMigrateGoal.current && data && data.dailyGoalProblems !== DEFAULT_DAILY_GOAL) {
              didMigrateGoal.current = true
              void setDoc(profileRef, { dailyGoalProblems: DEFAULT_DAILY_GOAL }, { merge: true })
            }
            setProfile(data)
            setProfileLoaded(true)
          },
          (err) => {
            setError(friendlyFirestoreError(err))
            setProfileLoaded(true)
            setProgressLoaded(true)
          },
        ),
      )
      unsubs.push(
        onSnapshot(
          collection(db, 'users', uid, 'progress'),
          (snap) => {
            const next: Record<string, LessonProgress> = {}
            snap.forEach((d) => {
              next[d.id] = d.data() as LessonProgress
            })
            setProgress(next)
            setProgressLoaded(true)
          },
          (err) => {
            setError(friendlyFirestoreError(err))
            setProgressLoaded(true)
          },
        ),
      )
      unsubs.push(
        onSnapshot(doc(db, 'users', uid, 'activity', today), (snap) => {
          setTodayActivity((snap.data() as DailyActivity) ?? emptyActivity)
        }),
      )
      unsubs.push(
        onSnapshot(collection(db, 'users', uid, 'mastery'), (snap) => {
          const next: Partial<Record<ConceptId, MasteryRecord>> = {}
          snap.forEach((d) => {
            next[d.id as ConceptId] = d.data() as MasteryRecord
          })
          setMastery(next)
        }),
      )
    }).catch((err) => {
      if (cancelled) return
      setError(friendlyFirestoreError(err))
      setProfileLoaded(true)
      setProgressLoaded(true)
    })

    return () => {
      cancelled = true
      unsubs.forEach((u) => u())
    }
  }, [user, today])

  const refs = (uid: string) => ({
    profileRef: doc(db, 'users', uid),
    progressRef: (lessonId: string) => doc(db, 'users', uid, 'progress', lessonId),
    activityRef: doc(db, 'users', uid, 'activity', today),
    masteryRef: (conceptId: string) => doc(db, 'users', uid, 'mastery', conceptId),
  })

  const value: UserDataValue = {
    ready,
    error,
    profile,
    progress,
    mastery,
    todayActivity,

    async startLesson(lessonId) {
      if (!user) return
      if (progress[lessonId]) return
      const { progressRef } = refs(user.uid)
      const ref = progressRef(lessonId)
      // Authoritative check against the database so we can never overwrite
      // existing progress (e.g. if local state is briefly stale).
      const snap = await getDoc(ref)
      if (snap.exists()) return
      const fresh: LessonProgress = {
        status: 'in_progress',
        currentStepIndex: 0,
        stepStates: {},
        startedAt: Date.now(),
        completedAt: null,
        updatedAt: Date.now(),
      }
      await setDoc(ref, fresh)
    },

    async setCurrentStep(lessonId, index) {
      if (!user) return
      const { progressRef } = refs(user.uid)
      await setDoc(
        progressRef(lessonId),
        { currentStepIndex: index, updatedAt: Date.now() },
        { merge: true },
      )
    },

    async submitProblem({ lessonId, stepId, concept, correct, answer }) {
      if (!user || !profile) return
      const r = refs(user.uid)
      const lp = progress[lessonId]
      // Hard invariant: a finished lesson is review-only. It can never award XP
      // again, no matter how many times it is replayed.
      const lessonCompleted = lp?.status === 'completed'
      const prevStep = lp?.stepStates[stepId] ?? { attempts: 0, correct: false, lastAnswer: null }
      const newlyCorrect = !lessonCompleted && correct && !prevStep.correct
      // Mastery reflects genuine recall, so only the FIRST attempt at a step
      // counts (and never on a replayed, already-completed lesson).
      const recordsMastery = !lessonCompleted && concept != null && prevStep.attempts === 0

      const batch = writeBatch(db)

      if (recordsMastery) {
        batch.set(r.masteryRef(concept), updateMastery(mastery[concept], correct), { merge: true })
      }

      const nextStepStates = {
        ...(lp?.stepStates ?? {}),
        [stepId]: {
          attempts: prevStep.attempts + 1,
          correct: correct || prevStep.correct,
          lastAnswer: answer,
        },
      }
      // Replaying a completed lesson must not reopen it (that would let the
      // completion bonus fire again). Keep a completed lesson completed.
      const status = lp?.status === 'completed' ? 'completed' : 'in_progress'
      batch.set(
        r.progressRef(lessonId),
        { status, stepStates: nextStepStates, updatedAt: Date.now() },
        { merge: true },
      )

      if (newlyCorrect) {
        const activity: DailyActivity = {
          problemsSolved: todayActivity.problemsSolved + 1,
          lessonsCompleted: todayActivity.lessonsCompleted,
          xpEarned: todayActivity.xpEarned + XP_PER_PROBLEM,
        }
        batch.set(r.activityRef, activity, { merge: true })

        const newXp = profile.xp + XP_PER_PROBLEM
        const profileUpdate: Partial<UserProfile> = {
          xp: newXp,
          level: levelForXp(newXp),
        }
        const goalMet =
          activity.problemsSolved >= profile.dailyGoalProblems || activity.lessonsCompleted >= 1
        if (goalMet) profileUpdate.streak = advanceStreak(profile.streak, today)
        batch.set(r.profileRef, profileUpdate, { merge: true })
      }

      await batch.commit()
    },

    // Practice-mode problems are generated and ephemeral (no lesson progress
    // doc), but they still build mastery and feed the habit loop. Every answer
    // updates mastery; a correct one awards XP and counts toward the daily goal.
    async recordPractice({ concept, correct }) {
      if (!user || !profile) return
      const r = refs(user.uid)
      const batch = writeBatch(db)

      batch.set(r.masteryRef(concept), updateMastery(mastery[concept], correct), { merge: true })

      if (correct) {
        const activity: DailyActivity = {
          problemsSolved: todayActivity.problemsSolved + 1,
          lessonsCompleted: todayActivity.lessonsCompleted,
          xpEarned: todayActivity.xpEarned + XP_PER_PROBLEM,
        }
        batch.set(r.activityRef, activity, { merge: true })

        const newXp = profile.xp + XP_PER_PROBLEM
        const profileUpdate: Partial<UserProfile> = {
          xp: newXp,
          level: levelForXp(newXp),
        }
        const goalMet =
          activity.problemsSolved >= profile.dailyGoalProblems || activity.lessonsCompleted >= 1
        if (goalMet) profileUpdate.streak = advanceStreak(profile.streak, today)
        batch.set(r.profileRef, profileUpdate, { merge: true })
      }

      await batch.commit()
    },

    async completeLesson(lessonId) {
      if (!user || !profile) return
      const r = refs(user.uid)
      if (progress[lessonId]?.status === 'completed') return

      const batch = writeBatch(db)
      batch.set(
        r.progressRef(lessonId),
        { status: 'completed', completedAt: Date.now(), updatedAt: Date.now() },
        { merge: true },
      )

      const activity: DailyActivity = {
        problemsSolved: todayActivity.problemsSolved,
        lessonsCompleted: todayActivity.lessonsCompleted + 1,
        xpEarned: todayActivity.xpEarned + XP_PER_LESSON,
      }
      batch.set(r.activityRef, activity, { merge: true })

      const newXp = profile.xp + XP_PER_LESSON
      batch.set(
        r.profileRef,
        {
          xp: newXp,
          level: levelForXp(newXp),
          streak: advanceStreak(profile.streak, today),
        } satisfies Partial<UserProfile>,
        { merge: true },
      )

      await batch.commit()
    },
  }

  return <UserDataContext.Provider value={value}>{children}</UserDataContext.Provider>
}

export function useUserData(): UserDataValue {
  const ctx = useContext(UserDataContext)
  if (!ctx) throw new Error('useUserData must be used within UserDataProvider')
  return ctx
}
