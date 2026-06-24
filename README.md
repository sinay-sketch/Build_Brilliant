# Build Brilliant - Physics, learned by doing

> Subject: Physics (Kinematics). Persona: a college student / self-learner brushing up foundational physics in short, mobile sessions.

Build Brilliant is a learn-by-doing physics app modeled on Brilliant. Instead of
videos, it drops you into a problem you can poke at, gives instant hand-written
feedback, and only then names the concept. The MVP goes deep on one flagship
interactive lesson: **Projectile Motion**.

Phase 1 contains **no AI**. Every problem, hint, and explanation is hand-authored,
and all answer checking is deterministic client-side math.

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
- Firebase Hosting (deploy)

## Architecture overview

```
src/
  content/        Structured lesson data (the content model, not HTML)
    projectile.ts   The full hand-authored Projectile Motion lesson
    course.ts       Kinematics course + lesson metadata + lookups
  types/          TypeScript models for content and user data
  lib/            Pure logic: physics, answer checker, mastery, streaks, path
  context/        AuthContext (Firebase Auth) + UserDataContext (Firestore sync)
  components/      Canvas, simulator, step renderer, feedback, nav
  pages/          Login, Home, Course, Lesson, Profile
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

## Deploy (Firebase Hosting)

```bash
# one-time
npx firebase-tools@latest login
# set your project id in .firebaserc (replace the placeholder), then:
npx firebase-tools@latest deploy --only firestore:rules
npm run build
npx firebase-tools@latest deploy --only hosting
```

Deployed link: _add after first deploy_

## Phase roadmap

- **Phase 1 (this repo): MVP, no AI.** The core learn-by-doing experience.
- Phase 2: AI features grounded in lesson state (hints, problem generation).
- Phase 3: learning-science techniques (spaced repetition, interleaving, etc.).
