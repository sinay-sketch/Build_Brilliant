import { defineConfig } from 'vitest/config'

// Tests target the pure, deterministic logic (physics, checking, mastery,
// streaks, leveling, problem generation). They run in a Node environment and
// live in tests/ so the production `tsc -b` build never compiles them.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
})
