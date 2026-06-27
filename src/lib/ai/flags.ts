// Feature flags for AI. The hard requirement (assignment): the app must teach
// fully with AI turned OFF. Every AI surface checks these flags and falls back
// to hand-authored Phase 1 content when AI is disabled or unavailable.
//
// A flag being "on" only means "allowed to try". The client AI layer
// (client.ts) still degrades gracefully on any timeout/error, so a flag never
// makes the app depend on the network.

function envFlag(value: string | undefined, fallback: boolean): boolean {
  if (value == null) return fallback
  return value !== 'false' && value !== '0'
}

/** Master switch. Set VITE_AI_ENABLED=false to ship the pure Phase 1 app. */
export const AI_ENABLED = envFlag(import.meta.env.VITE_AI_ENABLED as string | undefined, true)

/** Per-feature switches (all default on when AI is enabled). */
export const AI_FEATURES = {
  // The conversational tutor (hint + follow-up chat) shares one switch.
  tutor: AI_ENABLED && envFlag(import.meta.env.VITE_AI_HINTS as string | undefined, true),
  generate: AI_ENABLED && envFlag(import.meta.env.VITE_AI_GENERATE as string | undefined, true),
  coach: AI_ENABLED && envFlag(import.meta.env.VITE_AI_COACH as string | undefined, true),
} as const

/** Connect to the local Functions emulator during development when asked. */
export const USE_FUNCTIONS_EMULATOR = envFlag(
  import.meta.env.VITE_USE_FUNCTIONS_EMULATOR as string | undefined,
  false,
)

/** Default timeout for an AI call before we fall back to authored content. */
export const AI_TIMEOUT_MS = 8000
