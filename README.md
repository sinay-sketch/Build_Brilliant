# Build Brilliant - Physics, learned by doing

> Subject: Physics (Kinematics). Persona: a college student / self-learner brushing up foundational physics in short, mobile sessions.

Build Brilliant is a learn-by-doing physics app modeled on Brilliant. Instead of
videos, it drops you into a problem you can poke at, gives instant hand-written
feedback, and only then names the concept. The MVP goes deep on one flagship
interactive lesson: **Projectile Motion**.

Phase 1 contains **no AI**. Every problem, hint, and explanation is hand-authored,
and all answer checking is deterministic client-side math.

**Phase 2 adds AI as a strictly additive layer** (OpenAI, behind a Cloud
Functions proxy): a Socratic tutor, "explain my mistake", an endless verified
practice generator, and an adaptive coach. The app still teaches fully with AI
turned off (`VITE_AI_ENABLED=false`) — every AI surface falls back to authored
content. See [Phase 2: AI features](#phase-2-ai-features) below.

## What it does

- One rich, interactive lesson (Projectile Motion) built as a sequence of
  hands-on steps: predict, manipulate, solve, recall.
- A live projectile **simulator** on HTML5 Canvas (drag angle/speed sliders, fire,
  hit a target, clear a wall) animated at 60 FPS.
- **Instant, answer-specific feedback** on every attempt, with hints on wrong
  answers and a short explanation when you get it right.
- **Progress that persists** in Firestore: leave mid-lesson, return on any device,
  and pick up exactly where you left off.
- A **course path** (Kinematics) with mastery tracking, lock/unlock, and a
  sensible next-step recommendation.
- A **habit loop**: streaks with freeze charges, XP, levels, a daily goal, and a
  lesson-complete celebration.
- **Auth** (email/password + Google) and a mobile-first responsive UI.

## Tech stack

- React 19 + Vite + TypeScript
- Tailwind CSS v4
- Firebase Auth + Cloud Firestore
- Firebase Cloud Functions v2 (AI proxy) + OpenAI (Phase 2)
- Firebase Hosting (deploy)

## Architecture overview

```
src/
  content/        Structured lesson data (the content model, not HTML)
    projectile.ts   The full hand-authored Projectile Motion lesson
    freeFall.ts     Free Fall & Gravity lesson (Phase 2)
    rangeVsAngle.ts Range vs. Angle lesson (Phase 2)
    course.ts       Kinematics course + lesson metadata + lookups
  types/          TypeScript models for content and user data
  lib/            Pure logic: physics, answer checker, mastery, streaks, path
    ai/             Phase 2 AI: flags, context builder, engine verifier,
                    callable client, practice generator, coach
  context/        AuthContext (Firebase Auth) + UserDataContext (Firestore sync)
  components/      Canvas, simulator, step renderer, feedback, AI tutor, nav
  pages/          Login, Home, Course, Lesson, Practice, Profile
functions/        Cloud Functions AI proxy (OpenAI; key stays server-side)
```

- A **lesson is data**: a sequence of typed interactive steps (`concept`,
  `predict`, `mcq`, `numeric`, `sim-challenge`, `recall`). This is what lets us
  add lessons fast and, later, lets AI generate them (Phase 2).
- The frontend renders steps, captures interaction, and checks answers locally
  (well under 100ms, no network).
- Firestore stores only per-user state: profile, per-lesson progress, per-concept
  mastery, and per-day activity. See [docs/PRD.md](docs/PRD.md) for the full schema.

## Setup

### 1. Install

```bash
npm install
```

### 2. Create a Firebase project

1. Go to the [Firebase Console](https://console.firebase.google.com) and create a
   project (e.g. `build-brilliant`).
2. **Authentication** -> Get started -> enable **Email/Password** and **Google**.
3. **Firestore Database** -> Create database -> production mode.
4. Project settings -> Your apps -> Web app -> register, and copy the config.

### 3. Configure environment

Copy `.env.example` to `.env` and paste your Firebase web config:

```bash
cp .env.example .env
```

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### 4. Run locally

```bash
npm run dev
```

Open the printed URL (defaults to http://localhost:5173).

## Phase 2: AI features

All AI is grounded in the app's structured lesson state and verified against the
deterministic physics engine. The OpenAI key never reaches the browser — it
lives in a Cloud Functions secret. Every feature degrades to hand-authored
content when AI is off or unavailable.

**What we shipped (and why):**

- **Conversational tutor (`aiHint` + `aiChat`)** — "I'm stuck" opens a chat: it
  gives an initial nudge, then the learner can ask follow-up questions (including
  "what did I do wrong?"). Grounded in the step's concept, phase, attempts, and
  last answer; it never reveals the final answer, and respects the teaching
  phase. Falls back to authored hints when AI is off/unreachable.
- **Verified practice generator (`aiGenerateProblem`)** — endless fresh problems
  at a difficulty adapted to mastery. The model only proposes a *scenario*; the
  client computes the answer with `lib/physics` (`src/lib/ai/verify.ts`), so the
  AI can never state a wrong number. Powers `/practice`.
- **Adaptive coach (`aiCoach`)** — a personalized "what to focus on next" blurb
  on Home, driven by real per-concept mastery. The lesson gating stays
  deterministic; AI only personalizes the wording.

**Deliberately skipped:** an open-ended chatbot, AI grading / overriding the
deterministic checker, and runtime AI-generated full lessons or visuals. Spaced
repetition and interleaving are reserved for Phase 3.

**Architecture:** client AI layer in `src/lib/ai/*` (flags, structured-context
builder, engine verifier, timeout-guarded callable wrappers, generator, coach);
server proxy in `functions/` (per-feature callables, auth + per-user daily rate
limits, persona/pedagogy system prompts). New Firestore: per-concept
`users/{uid}/mastery/{conceptId}` and `users/{uid}/aiUsage/{yyyy-mm-dd}`.

**Turn AI off:** set `VITE_AI_ENABLED=false` (or any per-feature flag) and the
app runs as the pure Phase 1 experience.

## Tests

Automated tests (Vitest) cover the deterministic core: the physics engine,
answer checker, mastery model, streak logic, XP/leveling, and the practice
generation invariant (every generated problem is engine-correct). They run in
CI on every push.

```bash
npm test          # run the suite once
npm run test:watch # watch mode
```

A standalone property check of the generator is also available:

```bash
npx tsx scripts/verify-generation.ts
```

## Deploy

```bash
# one-time
npx firebase-tools@latest login
# set your project id in .firebaserc (already set to project1-678d2), then:
npx firebase-tools@latest deploy --only firestore:rules

# --- Phase 2 AI proxy (Cloud Functions) ---
# Requires the Blaze (pay-as-you-go) plan. Set the OpenAI key as a secret:
npx firebase-tools@latest functions:secrets:set OPENAI_API_KEY
cd functions && npm install && cd ..
npx firebase-tools@latest deploy --only functions

# --- Frontend ---
npm run build
npx firebase-tools@latest deploy --only hosting
```

Deployed link: https://project1-678d2.web.app

> Console steps only the project owner can do: upgrade to the **Blaze** plan
> (for Cloud Functions), provide the **OpenAI API key** (stored as the secret
> above), and optionally enable **App Check**. The app works AI-off until these
> are done.

## Phase roadmap

- **Phase 1 (this repo): MVP, no AI.** The core learn-by-doing experience.
- Phase 2: AI features grounded in lesson state (hints, problem generation).
- Phase 3: learning-science techniques (spaced repetition, interleaving, etc.).
