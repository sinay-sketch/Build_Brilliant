import { useCallback, useRef, useState } from 'react'
import type { ConceptId, Formula, Step } from '../types/content'
import {
  checkChoiceAnswer,
  checkNumericAnswer,
  checkSimChallenge,
  checkSliderEstimate,
  checkTapLanding,
} from '../lib/checker'
import SimPlayground from './SimPlayground'
import VectorComponents from './VectorComponents'
import DropRace from './DropRace'
import TapLanding from './TapLanding'
import Feedback from './Feedback'
import Sci, { renderSci } from './Sci'

interface Props {
  step: Step
  onSolved: (correct: boolean, answer: string | number | null, concept?: ConceptId) => void
  onContinue: () => void
  isLast: boolean
}

export default function StepView({ step, onSolved, onContinue, isLast }: Props) {
  const continueLabel = isLast ? 'Finish lesson' : 'Continue'

  switch (step.type) {
    case 'concept':
      return (
        <div className="space-y-5">
          <div>
            <h2 className="font-display text-2xl font-semibold text-ink">{step.title}</h2>
            <p className="mt-3 leading-relaxed text-ink-soft">{step.body}</p>
          </div>
          {step.keyPoints && step.keyPoints.length > 0 && (
            <ul className="space-y-2 rounded-xl border border-line bg-surface-2 p-4">
              {step.keyPoints.map((pt) => (
                <li key={pt} className="flex items-start gap-2.5 text-sm leading-relaxed text-ink">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                  {pt}
                </li>
              ))}
            </ul>
          )}
          {step.formula && <FormulaCard formula={step.formula} />}
          {step.visual && <SimPlayground config={step.visual} />}
          <PrimaryButton onClick={onContinue}>{continueLabel}</PrimaryButton>
        </div>
      )
    case 'interactive':
      return (
        <div className="space-y-5">
          <div>
            <h2 className="font-display text-2xl font-semibold text-ink">{step.title}</h2>
            <p className="mt-3 leading-relaxed text-ink-soft">{step.body}</p>
          </div>
          {step.widget === 'vector-components' && (
            <VectorComponents angleDeg={step.config?.angleDeg} speed={step.config?.speed} />
          )}
          {step.widget === 'drop-race' && <DropRace speed={step.config?.speed} />}
          {step.keyPoints && step.keyPoints.length > 0 && (
            <ul className="space-y-2 rounded-xl border border-line bg-surface-2 p-4">
              {step.keyPoints.map((pt) => (
                <li key={pt} className="flex items-start gap-2.5 text-sm leading-relaxed text-ink">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                  {pt}
                </li>
              ))}
            </ul>
          )}
          <PrimaryButton onClick={onContinue}>{continueLabel}</PrimaryButton>
        </div>
      )
    case 'predict':
    case 'mcq':
    case 'recall':
      return <ChoiceStep step={step} onSolved={onSolved} onContinue={onContinue} continueLabel={continueLabel} />
    case 'numeric':
      return <NumericStepView step={step} onSolved={onSolved} onContinue={onContinue} continueLabel={continueLabel} />
    case 'sim-challenge':
      return (
        <SimChallengeView step={step} onSolved={onSolved} onContinue={onContinue} continueLabel={continueLabel} />
      )
    case 'tap-landing':
      return (
        <TapLandingView step={step} onSolved={onSolved} onContinue={onContinue} continueLabel={continueLabel} />
      )
    case 'slider-estimate':
      return (
        <SliderEstimateView step={step} onSolved={onSolved} onContinue={onContinue} continueLabel={continueLabel} />
      )
    default:
      return null
  }
}

function FormulaCard({ formula }: { formula: Formula }) {
  // Each line of `expr` (split on newline) is a distinct formula, stacked with
  // clear separation so two formulas never read as one.
  const lines = formula.expr.split('\n').map((l) => l.trim()).filter(Boolean)
  return (
    <div className="rounded-xl border border-line-strong bg-paper-2 p-4">
      <div className={lines.length > 1 ? 'divide-y divide-line/70' : ''}>
        {lines.map((line, i) => (
          <p
            key={i}
            className={`text-center font-display text-xl font-semibold tracking-tight text-ink ${
              i === 0 ? '' : 'pt-2.5'
            } ${i < lines.length - 1 ? 'pb-2.5' : ''}`}
          >
            {renderSci(line)}
          </p>
        ))}
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-line pt-3 text-sm">
        {formula.terms.map((t) => (
          <div key={t.symbol} className="flex items-baseline gap-2">
            <dt className="font-mono font-semibold text-brand">
              <Sci>{t.symbol}</Sci>
            </dt>
            <dd className="text-ink-soft">{t.meaning}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="btn-primary w-full py-3">
      {children}
    </button>
  )
}

type ChoiceStepType = Extract<Step, { type: 'predict' | 'mcq' | 'recall' }>

function ChoiceStep({
  step,
  onSolved,
  onContinue,
  continueLabel,
}: {
  step: ChoiceStepType
  onSolved: Props['onSolved']
  onContinue: () => void
  continueLabel: string
}) {
  const [selected, setSelected] = useState<string | null>(null)
  const [result, setResult] = useState<{ correct: boolean; message: string } | null>(null)
  const solved = result?.correct ?? false
  const hasVisual = step.type !== 'recall' && step.visual

  const check = () => {
    if (!selected) return
    const r = checkChoiceAnswer(step, selected)
    setResult(r)
    onSolved(r.correct, selected, step.concept)
  }

  return (
    <div className="space-y-4">
      <p className="font-display text-xl font-medium leading-snug text-ink">{renderSci(step.prompt)}</p>
      {hasVisual && <SimPlayground config={step.visual!} />}
      <div className="space-y-2.5">
        {step.choices.map((c) => {
          const isSel = selected === c.id
          const isCorrect = solved && c.id === step.correctId
          return (
            <button
              key={c.id}
              type="button"
              disabled={solved}
              onClick={() => setSelected(c.id)}
              className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left font-medium transition ${
                isCorrect
                  ? 'border-success bg-success-soft text-ink'
                  : isSel
                    ? 'border-brand bg-brand-tint text-ink'
                    : 'border-line bg-surface text-ink hover:border-brand/50 hover:bg-surface-2'
              } disabled:cursor-not-allowed`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] ${
                  isCorrect
                    ? 'border-success bg-success text-white'
                    : isSel
                      ? 'border-brand bg-brand text-white'
                      : 'border-line-strong text-transparent'
                }`}
              >
                {isCorrect ? '✓' : isSel ? '•' : ''}
              </span>
              {c.label}
            </button>
          )
        })}
      </div>

      {result && (
        <Feedback
          correct={result.correct}
          message={result.message}
          explanation={'explanation' in step ? step.explanation : undefined}
          takeaway={'takeaway' in step ? step.takeaway : undefined}
        />
      )}

      {solved ? (
        <PrimaryButton onClick={onContinue}>{continueLabel}</PrimaryButton>
      ) : (
        <PrimaryButton onClick={check} disabled={!selected}>
          Check
        </PrimaryButton>
      )}
    </div>
  )
}

function NumericStepView({
  step,
  onSolved,
  onContinue,
  continueLabel,
}: {
  step: Extract<Step, { type: 'numeric' }>
  onSolved: Props['onSolved']
  onContinue: () => void
  continueLabel: string
}) {
  const [value, setValue] = useState('')
  const [result, setResult] = useState<{ correct: boolean; message: string } | null>(null)
  const [hintIndex, setHintIndex] = useState(0)
  const solved = result?.correct ?? false

  const check = () => {
    const num = Number(value)
    if (value.trim() === '' || Number.isNaN(num)) return
    const correct = checkNumericAnswer(num, step.answer, step.tolerance)
    if (correct) {
      setResult({ correct: true, message: 'Spot on.' })
    } else {
      const hint = step.hints[Math.min(hintIndex, step.hints.length - 1)]
      setResult({ correct: false, message: `Not quite. ${hint}` })
      setHintIndex((i) => Math.min(i + 1, step.hints.length))
    }
    onSolved(correct, num, step.concept)
  }

  return (
    <div className="space-y-4">
      <p className="font-display text-xl font-medium leading-snug text-ink">{renderSci(step.prompt)}</p>
      {step.visual && <SimPlayground config={step.visual} />}
      <div className="flex items-center gap-2">
        <input
          type="number"
          inputMode="decimal"
          value={value}
          disabled={solved}
          min={step.min}
          max={step.max}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && check()}
          placeholder="Your answer"
          className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-ink outline-none transition focus:border-brand disabled:opacity-60"
        />
        <span className="font-mono text-ink-soft">{step.unit}</span>
      </div>

      {result && (
        <Feedback
          correct={result.correct}
          message={result.message}
          explanation={step.explanation}
          takeaway={step.takeaway}
        />
      )}

      {solved && step.solution && step.solution.length > 0 && (
        <div className="rounded-xl border border-line bg-surface-2 p-4">
          <p className="eyebrow mb-2 text-ink-mute">Worked solution</p>
          <ol className="space-y-1.5">
            {step.solution.map((line, i) => (
              <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-ink">
                <span className="font-mono text-xs text-brand">{i + 1}</span>
                <span>{renderSci(line)}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {solved ? (
        <PrimaryButton onClick={onContinue}>{continueLabel}</PrimaryButton>
      ) : (
        <PrimaryButton onClick={check} disabled={value.trim() === ''}>
          Check
        </PrimaryButton>
      )}
    </div>
  )
}

function SimChallengeView({
  step,
  onSolved,
  onContinue,
  continueLabel,
}: {
  step: Extract<Step, { type: 'sim-challenge' }>
  onSolved: Props['onSolved']
  onContinue: () => void
  continueLabel: string
}) {
  const live = useRef({ angle: step.sim.angleDeg, speed: step.sim.speed })
  const [result, setResult] = useState<{ correct: boolean; message: string } | null>(null)
  const [attempts, setAttempts] = useState(0)
  const solved = result?.correct ?? false

  const onState = useCallback((angle: number, speed: number) => {
    live.current = { angle, speed }
  }, [])

  const check = () => {
    const r = checkSimChallenge(step, live.current.angle, live.current.speed)
    setResult({ correct: r.correct, message: r.message })
    setAttempts((a) => a + 1)
    onSolved(r.correct, `${Math.round(live.current.angle)}deg/${Math.round(live.current.speed)}`, step.concept)
  }

  const hint = !solved && attempts > 0 ? step.hints[Math.min(attempts - 1, step.hints.length - 1)] : null

  return (
    <div className="space-y-4">
      <p className="font-display text-xl font-medium leading-snug text-ink">{renderSci(step.prompt)}</p>
      <SimPlayground config={step.sim} onState={onState} heightClass="h-72" />

      {result && (
        <Feedback
          correct={result.correct}
          message={result.message}
          explanation={step.explanation}
          takeaway={step.takeaway}
        />
      )}
      {hint && (
        <div className="flex items-start gap-2 rounded-xl border border-line bg-surface-2 p-3 text-sm text-ink-soft">
          <span className="text-brand">💡</span>
          <span>{hint}</span>
        </div>
      )}

      {solved ? (
        <PrimaryButton onClick={onContinue}>{continueLabel}</PrimaryButton>
      ) : (
        <PrimaryButton onClick={check}>Check shot</PrimaryButton>
      )}
    </div>
  )
}

function TapLandingView({
  step,
  onSolved,
  onContinue,
  continueLabel,
}: {
  step: Extract<Step, { type: 'tap-landing' }>
  onSolved: Props['onSolved']
  onContinue: () => void
  continueLabel: string
}) {
  const guess = useRef(0)
  const [result, setResult] = useState<{ correct: boolean; message: string } | null>(null)
  const revealed = result !== null

  const onGuessChange = useCallback((m: number) => {
    guess.current = m
  }, [])

  const check = () => {
    const r = checkTapLanding(step, guess.current)
    setResult({ correct: r.correct, message: r.message })
    onSolved(r.correct, Math.round(guess.current), step.concept)
  }

  return (
    <div className="space-y-4">
      <p className="font-display text-xl font-medium leading-snug text-ink">{renderSci(step.prompt)}</p>
      <TapLanding
        sim={step.sim}
        tolerance={step.tolerance}
        revealed={revealed}
        correct={result?.correct}
        onGuessChange={onGuessChange}
      />

      {result && (
        <>
          <Feedback correct={result.correct} message={result.message} explanation={step.explanation} takeaway={step.takeaway} />
          {!result.correct && (
            <p className="rounded-xl border border-line bg-surface-2 p-3 text-sm leading-relaxed text-ink-soft">
              {renderSci(step.explanation)}
            </p>
          )}
        </>
      )}

      {revealed ? (
        <PrimaryButton onClick={onContinue}>{continueLabel}</PrimaryButton>
      ) : (
        <PrimaryButton onClick={check}>Fire & check</PrimaryButton>
      )}
    </div>
  )
}

function SliderEstimateView({
  step,
  onSolved,
  onContinue,
  continueLabel,
}: {
  step: Extract<Step, { type: 'slider-estimate' }>
  onSolved: Props['onSolved']
  onContinue: () => void
  continueLabel: string
}) {
  const live = useRef({ angle: step.sim.angleDeg, speed: step.sim.speed })
  const [result, setResult] = useState<{ correct: boolean; message: string } | null>(null)
  const [attempts, setAttempts] = useState(0)
  const solved = result?.correct ?? false

  const onState = useCallback((angle: number, speed: number) => {
    live.current = { angle, speed }
  }, [])

  const check = () => {
    const value = step.judge === 'angle' ? live.current.angle : live.current.speed
    const r = checkSliderEstimate(step, value)
    setResult(r)
    setAttempts((a) => a + 1)
    onSolved(r.correct, Math.round(value), step.concept)
  }

  const hint =
    !solved && attempts > 0 && step.hints && step.hints.length > 0
      ? step.hints[Math.min(attempts - 1, step.hints.length - 1)]
      : null

  return (
    <div className="space-y-4">
      <p className="font-display text-xl font-medium leading-snug text-ink">{renderSci(step.prompt)}</p>
      <SimPlayground config={step.sim} onState={onState} />

      {result && (
        <Feedback correct={result.correct} message={result.message} explanation={step.explanation} takeaway={step.takeaway} />
      )}
      {hint && (
        <div className="flex items-start gap-2 rounded-xl border border-line bg-surface-2 p-3 text-sm text-ink-soft">
          <span className="text-brand">💡</span>
          <span>{renderSci(hint)}</span>
        </div>
      )}

      {solved ? (
        <PrimaryButton onClick={onContinue}>{continueLabel}</PrimaryButton>
      ) : (
        <PrimaryButton onClick={check}>Check</PrimaryButton>
      )}
    </div>
  )
}
