# Build Brilliant - Phase 1 PRD + Data Schema

## 1. Product summary

A learn-by-doing physics app modeled on Brilliant, built deep on one subject.

- Subject: Physics -> Kinematics, with Projectile Motion as the flagship lesson.
- Persona: "Maya", a college student / self-learner brushing up foundational
  physics in short mobile sessions. She wants intuition that clicks, not lecture
  videos. Time-boxed (5-10 min), mobile, motivated by visible progress.
- Core promise: drop the learner into a problem they can poke at, give instant
  hand-written feedback, and only then name the concept.
- Phase 1 hard rule: NO AI. No model calls, no generated content, no chatbot.
  Every explanation, hint, and problem is hand-authored; all checking is
  deterministic client-side math.

## 2. Brilliant design principles implemented (from research)

- Problem-first / pretest: let the learner try before naming the concept.
- One concept per lesson, simplest version first, then build up.
- Visual + hands-on: something on screen changes as you act.
- Instant, answer-specific feedback (<100ms), with explanation on right and wrong.
- Habit loop: streaks (finish a lesson OR 3 problems/day), freeze charges, XP.
- Mastery tracking drives the path: track mastery, recommend next, resurface gaps.

## 3. Phase 1 requirements -> implementation

- Chosen subject + persona stated up front: README + this PRD.
- One interactive lesson: Projectile Motion, 11 hands-on steps
  (`src/content/projectile.ts`).
- Rich problem type beyond MCQ: slider-driven projectile simulator with
  hit-target and clear-wall challenges (`src/components/SimPlayground.tsx`,
  `ProjectileCanvas.tsx`).
- Responsive visual: live Canvas trajectory animated at 60 FPS via
  `requestAnimationFrame`.
- Instant specific feedback: `src/lib/checker.ts` + authored content.
- Progress persists: Firestore, resume mid-lesson (`UserDataContext`, `Lesson`).
- Auth + names: Firebase Auth email/password + Google (`AuthContext`, `Login`).
- Course path + mastery + next-step rec: `src/lib/path.ts`, `Course`, `Home`.
- Streaks / milestones: `src/lib/streak.ts`, XP/levels, daily goal, celebration.
- Mobile + deployable: mobile-first Tailwind, touch sliders, Firebase Hosting.
- Performance: feedback < 100ms (local), 60 FPS canvas, content bundled for
  fast first interaction.

## 4. Architecture

- Content lives as local TypeScript/JSON modules (bundled), so first interaction
  is fast and there is zero AI/runtime generation. Firestore stores only
  per-user state.
- Routes: `/login`, `/` (home), `/course`, `/lesson/:lessonId`, `/profile`.
- Layers:
  - Content model (data) -> `src/types/content.ts`, `src/content/*`
  - Rendering + interaction -> `src/components/*`
  - Logic (physics, checking, mastery, streak, path) -> `src/lib/*`
  - Persistence + auth -> `src/context/*`, `src/firebase.ts`

## 5. Content model

A lesson is a sequence of typed steps (discriminated union in
`src/types/content.ts`):

- `concept`: intro/free-play card, optional simulator.
- `predict`: predict-first multiple choice with per-choice feedback.
- `mcq`: multiple choice with per-choice feedback.
- `numeric`: numeric answer with tolerance and laddered hints.
- `sim-challenge`: manipulate the simulator to hit a target or clear a wall.
- `recall`: retrieval-practice multiple choice (no visual aid).

Each problem step carries a `concept` tag used for mastery. Lessons declare
`prerequisites` and a `playable` flag (one lesson is fully built for the MVP).

## 6. Firestore data schema

```
users/{uid}
  displayName, email, createdAt
  xp:number, level:number
  streak: { current, longest, lastActiveDate, charges }
  dailyGoalProblems:number

users/{uid}/progress/{lessonId}
  status: "not_started" | "in_progress" | "completed"
  currentStepIndex:number
  stepStates: { [stepId]: { attempts, correct, lastAnswer } }
  startedAt, completedAt, updatedAt

users/{uid}/mastery/{conceptId}
  score:number (0..1), attempts, correct, lastReviewed

users/{uid}/activity/{yyyy-mm-dd}
  problemsSolved, lessonsCompleted, xpEarned
```

- Mastery: a concept's `score` rises with correct first-attempts and dips on
  first-attempt misses; mastered at >= 0.8.
- Next-step rec: first playable, unlocked, not-completed lesson in path order.
- Streak: extends when today's activity meets the daily goal (a full lesson OR 3
  problems); a missed day consumes a freeze charge instead of resetting (max 2).
- Security: a user can read/write only under their own `users/{uid}` subtree
  (`firestore.rules`).

## 7. Course path (depth over breadth)

`Position & Velocity` -> `Free Fall & Gravity` -> **Projectile Motion (playable)**
-> `Range vs. Angle` -> `Hit the Target`. Non-flagship lessons are visible and
marked "coming soon" so the path feels real with a sensible next step.

## 8. Out of scope for Phase 1 (deferred)

AI hints/generation (Phase 2); spaced repetition / interleaving engine (Phase 3);
leaderboards/leagues; multiple fully-built lessons beyond the flagship.
