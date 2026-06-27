// Thin, defensive wrappers over the Cloud Functions AI proxy. Every call:
//   - is gated by a feature flag (flags.ts),
//   - races a timeout, and
//   - returns null on ANY failure
// so the caller can fall back to hand-authored content. The app must never
// break or hang because AI is slow or unavailable.

import { httpsCallable } from 'firebase/functions'
import { functions } from '../../firebase'
import { AI_FEATURES, AI_TIMEOUT_MS } from './flags'
import type {
  ChatRequest,
  ChatResponse,
  CoachRequest,
  CoachResponse,
  GenerateRequest,
  GeneratedProblemSpec,
  HintRequest,
  HintResponse,
} from './types'

async function callWithTimeout<Req, Res>(
  name: string,
  data: Req,
  timeoutMs = AI_TIMEOUT_MS,
): Promise<Res | null> {
  try {
    const fn = httpsCallable<Req, Res>(functions, name)
    const result = await Promise.race([
      fn(data).then((r) => r.data),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
    ])
    return (result as Res) ?? null
  } catch {
    return null
  }
}

export async function requestHint(req: HintRequest): Promise<string | null> {
  if (!AI_FEATURES.tutor) return null
  const res = await callWithTimeout<HintRequest, HintResponse>('aiHint', req)
  return res?.hint?.trim() || null
}

export async function requestChatReply(req: ChatRequest): Promise<string | null> {
  if (!AI_FEATURES.tutor) return null
  const res = await callWithTimeout<ChatRequest, ChatResponse>('aiChat', req, 12000)
  return res?.reply?.trim() || null
}

export async function requestProblemSpec(
  req: GenerateRequest,
): Promise<GeneratedProblemSpec | null> {
  if (!AI_FEATURES.generate) return null
  // Generation can take a touch longer than a hint.
  return callWithTimeout<GenerateRequest, GeneratedProblemSpec>('aiGenerateProblem', req, 12000)
}

export async function requestCoachMessage(req: CoachRequest): Promise<string | null> {
  if (!AI_FEATURES.coach) return null
  const res = await callWithTimeout<CoachRequest, CoachResponse>('aiCoach', req)
  return res?.message?.trim() || null
}
