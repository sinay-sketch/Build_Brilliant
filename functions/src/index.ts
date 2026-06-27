/**
 * Build Brilliant - AI proxy (Phase 2).
 *
 * These callable functions are the ONLY place the OpenAI key is used; it lives
 * in Secret Manager and never reaches the browser. Every function is grounded
 * in the structured lesson state the client sends, and obeys two hard rules:
 *   1. A hint never reveals the final answer.
 *   2. The model never states a physics number for a generated problem -- it
 *      only proposes a scenario; the client computes the answer with its
 *      deterministic engine.
 *
 * The web app works fully with these turned off (it falls back to authored
 * content), so this proxy is strictly additive.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
import { setGlobalOptions } from 'firebase-functions/v2'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import OpenAI from 'openai'

initializeApp()
setGlobalOptions({ region: 'us-central1', maxInstances: 10 })

const OPENAI_API_KEY = defineSecret('OPENAI_API_KEY')
const MODEL = 'gpt-4o-mini'

// ---- Persona + pedagogy ---------------------------------------------------

const PERSONA = `You are the in-app tutor for "Build Brilliant", a learn-by-doing physics app for foundational kinematics.
The learner studies in short mobile sessions and wants intuition that clicks, not lectures.
Be warm, concise, and concrete. No markdown headers, no preamble like "Sure!".
Address the learner by their first name ONLY if it is explicitly provided to you; never guess or invent a name.`

const HINT_RULES = `You give ONE nudge that moves the learner forward WITHOUT revealing the final answer.
- Never state the numeric answer or name the correct choice.
- Point at the next idea, formula, or observation to try.
- Respect the teaching phase: in "predict"/"explore" be Socratic and intuition-first; in "practice"/"master" be more direct and procedural.
- Higher hintLevel means escalate toward a more concrete step (but still not the answer).
- Keep it to 1-2 short sentences.`

const CHAT_RULES = `You are having a short back-and-forth to help the learner past a sticking point on the CURRENT problem.
- NEVER reveal the final numeric answer or name the correct multiple-choice option, even if asked directly or repeatedly. If pushed for the answer, explain the method or ask a guiding question instead.
- Answer the learner's actual question, clear up misunderstandings, and define terms when asked.
- If the learner asks what they did wrong (and you were given their last answer), diagnose the likely mistake in their reasoning.
- Keep each reply to 1-3 short sentences. Be encouraging and stay on this problem's topic.`

// ---- Rate limiting ---------------------------------------------------------

const DAILY_CAPS: Record<string, number> = {
  hints: 80,
  chat: 200,
  generations: 100,
  coach: 40,
}

function dayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

async function enforceRateLimit(uid: string, field: keyof typeof DAILY_CAPS): Promise<void> {
  const db = getFirestore()
  const ref = db.doc(`users/${uid}/aiUsage/${dayKey()}`)
  const snap = await ref.get()
  const used = (snap.exists ? (snap.data()?.[field] as number | undefined) : 0) ?? 0
  if (used >= DAILY_CAPS[field]) {
    throw new HttpsError('resource-exhausted', 'Daily AI limit reached. Try again tomorrow.')
  }
  await ref.set({ [field]: FieldValue.increment(1) }, { merge: true })
}

function requireAuth(auth: { uid: string } | undefined): string {
  if (!auth?.uid) throw new HttpsError('unauthenticated', 'Sign in to use AI features.')
  return auth.uid
}

function client(): OpenAI {
  return new OpenAI({ apiKey: OPENAI_API_KEY.value() })
}

// ---- Hint ------------------------------------------------------------------

export const aiHint = onCall({ secrets: [OPENAI_API_KEY] }, async (request) => {
  const uid = requireAuth(request.auth)
  await enforceRateLimit(uid, 'hints')
  const d = request.data ?? {}

  const choices = Array.isArray(d.choices)
    ? d.choices.map((c: { id: string; label: string }) => `- ${c.label}`).join('\n')
    : ''

  const context = [
    `Lesson: ${d.lessonTitle ?? ''}`,
    d.bigIdea ? `Big idea: ${d.bigIdea}` : '',
    d.concept ? `Concept: ${d.concept}` : '',
    d.phase ? `Teaching phase: ${d.phase}` : '',
    `Problem type: ${d.stepType ?? ''}`,
    `Prompt shown to learner: ${d.prompt ?? ''}`,
    choices ? `Choices:\n${choices}` : '',
    d.correctAnswer ? `(For your grounding only, do NOT reveal: correct answer is "${d.correctAnswer}")` : '',
    d.lastWrongAnswer ? `The learner just answered (incorrectly): "${d.lastWrongAnswer}"` : '',
    `Attempts so far: ${d.attempts ?? 0}. Hint level: ${d.hintLevel ?? 1}.`,
  ]
    .filter(Boolean)
    .join('\n')

  const res = await client().chat.completions.create({
    model: MODEL,
    temperature: 0.5,
    max_tokens: 120,
    messages: [
      { role: 'system', content: `${PERSONA}\n\n${HINT_RULES}` },
      { role: 'user', content: `${context}\n\nGive the next hint now.` },
    ],
  })

  return { hint: res.choices[0]?.message?.content?.trim() ?? '' }
})

// ---- Conversational tutor --------------------------------------------------

interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

export const aiChat = onCall({ secrets: [OPENAI_API_KEY] }, async (request) => {
  const uid = requireAuth(request.auth)
  await enforceRateLimit(uid, 'chat')
  const d = request.data ?? {}

  const choices = Array.isArray(d.choices)
    ? d.choices.map((c: { id: string; label: string }) => `- ${c.label}`).join('\n')
    : ''

  const context = [
    `Lesson: ${d.lessonTitle ?? ''}`,
    d.bigIdea ? `Big idea: ${d.bigIdea}` : '',
    d.concept ? `Concept: ${d.concept}` : '',
    d.phase ? `Teaching phase: ${d.phase}` : '',
    `Problem type: ${d.stepType ?? ''}`,
    `Prompt shown to learner: ${d.prompt ?? ''}`,
    choices ? `Choices:\n${choices}` : '',
    d.correctAnswer ? `(For your grounding only, NEVER reveal: correct answer is "${d.correctAnswer}")` : '',
    d.learnerAnswer ? `The learner's most recent answer was: "${d.learnerAnswer}"` : '',
  ]
    .filter(Boolean)
    .join('\n')

  // Keep the conversation bounded; only the most recent turns matter.
  const history: ChatTurn[] = Array.isArray(d.messages)
    ? (d.messages as ChatTurn[])
        .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
        .slice(-12)
        .map((m) => ({ role: m.role, content: String(m.content).slice(0, 600) }))
    : []

  if (history.length === 0 || history[history.length - 1].role !== 'user') {
    history.push({ role: 'user', content: "I'm stuck. Give me a hint to get started (without the answer)." })
  }

  const res = await client().chat.completions.create({
    model: MODEL,
    temperature: 0.5,
    max_tokens: 200,
    messages: [
      { role: 'system', content: `${PERSONA}\n\n${CHAT_RULES}\n\nProblem context:\n${context}` },
      ...history,
    ],
  })

  return { reply: res.choices[0]?.message?.content?.trim() ?? '' }
})

// ---- Generate a practice scenario -----------------------------------------

export const aiGenerateProblem = onCall({ secrets: [OPENAI_API_KEY] }, async (request) => {
  const uid = requireAuth(request.auth)
  await enforceRateLimit(uid, 'generations')
  const d = request.data ?? {}

  const allowed: string[] = Array.isArray(d.allowedQuantities) ? d.allowedQuantities : ['range']
  const avoid: string[] = Array.isArray(d.avoid) ? d.avoid : []

  const res = await client().chat.completions.create({
    model: MODEL,
    temperature: 0.8,
    max_tokens: 320,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `${PERSONA}

You design a fresh projectile-motion practice problem. Output ONLY JSON with this exact shape:
{
  "kind": "numeric",
  "quantity": one of ${JSON.stringify(allowed)},
  "angleDeg": number between 10 and 80,
  "speed": number between 5 and 45,
  "gravity": 9.8,
  "unit": "m" | "s" | "m/s" (must match the quantity),
  "prompt": string (the question text shown to the learner; state the launch angle, speed, and g),
  "hints": [two short strings that nudge without giving the number],
  "explanationTemplate": string (a short worked explanation; use the literal token {answer} where the final value goes -- do NOT compute the number yourself)
}
Do NOT include the numeric answer anywhere except via the {answer} token. Pick numbers that differ from these recent ones: ${JSON.stringify(avoid)}.`,
      },
      {
        role: 'user',
        content: `Difficulty: ${d.difficulty ?? 'medium'}. Concept focus: ${d.concept ?? 'range-reasoning'}. Generate the JSON now.`,
      },
    ],
  })

  const raw = res.choices[0]?.message?.content ?? '{}'
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new HttpsError('internal', 'Generation returned malformed JSON.')
  }
  return parsed
})

// ---- Coach -----------------------------------------------------------------

export const aiCoach = onCall({ secrets: [OPENAI_API_KEY] }, async (request) => {
  const uid = requireAuth(request.auth)
  await enforceRateLimit(uid, 'coach')
  const d = request.data ?? {}

  const mastery = Array.isArray(d.mastery)
    ? d.mastery
        .map((m: { concept: string; score: number; label: string }) => `- ${m.concept}: ${m.label} (${m.score})`)
        .join('\n')
    : 'no data yet'

  const firstName = typeof d.userName === 'string' && d.userName.trim() ? d.userName.trim() : ''

  const res = await client().chat.completions.create({
    model: MODEL,
    temperature: 0.6,
    max_tokens: 120,
    messages: [
      {
        role: 'system',
        content: `${PERSONA}\n\nYou are the learner's coach on the home screen. In 1-2 sentences, tell them what to focus on next and why, based on their mastery. Be encouraging and specific. Do not invent lessons that are not mentioned.${
          firstName
            ? ` You may address the learner as "${firstName}".`
            : ' Do NOT use any name for the learner; you have not been told their name.'
        }`,
      },
      {
        role: 'user',
        content: `${firstName ? `Learner's first name: ${firstName}.\n` : ''}Lessons completed: ${d.lessonsCompleted ?? 0}.\nWeakest concept: ${d.weakestConcept ?? 'none yet'}.\nRecommended next lesson: ${d.recommendedNextTitle ?? 'none'}.\nMastery by concept:\n${mastery}\n\nWrite the coaching message.`,
      },
    ],
  })

  return { message: res.choices[0]?.message?.content?.trim() ?? '' }
})
