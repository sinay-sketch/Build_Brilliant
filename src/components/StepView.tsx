import { useCallback, useRef, useState } from 'react'
import type { ConceptId, Formula, Lesson, Step } from '../types/content'
import {
  checkChoiceAnswer,
  checkCurveAim,
  checkDropTarget,
  checkGraphTarget,
  checkNumericAnswer,
  checkPlotPosition,
  checkSimChallenge,
  checkSliderEstimate,
  checkStopFall,
  checkTapLanding,
} from '../lib/checker'
import SimPlayground from './SimPlayground'
import VectorComponents from './VectorComponents'
import DropRace from './DropRace'
import MotionGraph from './MotionGraph'
import DropTower from './DropTower'
import RangeAngleCurve from './RangeAngleCurve'
import GraphTarget from './GraphTarget'
import DropTarget from './DropTarget'
import NumberLinePlot from './NumberLinePlot'
import StopFall from './StopFall'
import RangeAim from './RangeAim'
import TapLanding from './TapLanding'
import Feedback from './Feedback'
import AiTutor from './AiTutor'
import Sci, { renderSci } from './Sci'

interface Props {
  step: Step
  lesson: Lesson
  masteryScore?: number
  onSolved: (correct: boolean, answer: string | number | null, concept?: ConceptId) => void
  onContinue: () => void
  isLast: boolean
}

export default function StepView({ step, lesson, masteryScore, onSolved, onContinue, isLast }: Props) {
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
          {step.widget === 'motion-graph' && <MotionGraph velocity={step.config?.velocity} />}
          {step.widget === 'drop-tower' && <DropTower height={step.config?.height} />}
          {step.widget === 'range-curve' && (
            <RangeAngleCurve angleDeg={step.config?.angleDeg} speed={step.config?.speed} />
          )}
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
      return <ChoiceStep step={step} lesson={lesson} masteryScore={masteryScore} onSolved={onSolved} onContinue={onContinue} continueLabel={continueLabel} />
    case 'numeric':
      return <NumericStepView step={step} lesson={lesson} masteryScore={masteryScore} onSolved={onSolved} onContinue={onContinue} continueLabel={continueLabel} />
    case 'sim-challenge':
      return (
        <SimChallengeView step={step} lesson={lesson} masteryScore={masteryScore} onSolved={onSolved} onContinue={onContinue} continueLabel={continueLabel} />
      )
    case 'tap-landing':
      return (
        <TapLandingView step={step} lesson={lesson} masteryScore={masteryScore} onSolved={onSolved} onContinue={onContinue} continueLabel={continueLabel} />
      )
    case 'slider-estimate':
      return (
        <SliderEstimateView step={step} lesson={lesson} masteryScore={masteryScore} onSolved={onSolved} onContinue={onContinue} continueLabel={continueLabel} />
      )
    case 'graph-target':
      return (
        <GraphTargetView step={step} lesson={lesson} masteryScore={masteryScore} onSolved={onSolved} onContinue={onContinue} continueLabel={continueLabel} />
      )
    case 'drop-target':
      return (
        <DropTargetView step={step} lesson={lesson} masteryScore={masteryScore} onSolved={onSolved} onContinue={onContinue} continueLabel={continueLabel} />
      )
    case 'plot-position':
      return (
        <PlotPositionView step={step} lesson={lesson} masteryScore={masteryScore} onSolved={onSolved} onContinue={onContinue} continueLabel={continueLabel} />
      )
    case 'stop-fall':
      return (
        <StopFallView step={step} lesson={lesson} masteryScore={masteryScore} onSolved={onSolved} onContinue={onContinue} continueLabel={continueLabel} />
      )
    case 'curve-aim':
      return (
        <CurveAimView step={step} lesson={lesson} masteryScore={masteryScore} onSolved={onSolved} onContinue={onContinue} continueLabel={continueLabel} />
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

/**
 * Every graded question gets a relevant interactive model to think with. If the
 * step authored its own projectile sim we use that; otherwise we pick a widget
 * by concept (a position-time grapher for velocity questions, a drop tower for
 * free fall, a range curve for angle questions, and so on). This guarantees no
 * question is just plain text and choices.
 */
function QuestionVisual({ step }: { step: Step }) {
  if ('visual' in step && step.visual) return <SimPlayground config={step.visual} />
  switch (step.concept) {
    case 'velocity-graph':
    case 'avg-velocity':
    case 'displacement':
    case 'speed-vs-velocity':
      return <MotionGraph />
    case 'gravity-accel':
    case 'fall-distance':
      return <DropTower />
    case 'free-fall-rate':
    case 'gravity-independence':
      return <DropRace />
    case 'components':
      return <VectorComponents />
    case 'trajectory-shape':
      return <SimPlayground config={{ angleDeg: 45, speed: 20, gravity: 9.8, editable: ['angle', 'speed'] }} />
    case 'angle-range':
    case 'range-reasoning':
    case 'complementary-angles':
      return <RangeAngleCurve />
    default:
      return null
  }
}

type ChoiceStepType = Extract<Step, { type: 'predict' | 'mcq' | 'recall' }>

function ChoiceStep({
  step,
  lesson,
  masteryScore,
  onSolved,
  onContinue,
  continueLabel,
}: {
  step: ChoiceStepType
  lesson: Lesson
  masteryScore?: number
  onSolved: Props['onSolved']
  onContinue: () => void
  continueLabel: string
}) {
  const [selected, setSelected] = useState<string | null>(null)
  const [result, setResult] = useState<{ correct: boolean; message: string } | null>(null)
  const [attempts, setAttempts] = useState(0)
  const solved = result?.correct ?? false

  const check = () => {
    if (!selected) return
    const r = checkChoiceAnswer(step, selected)
    setResult(r)
    setAttempts((a) => a + 1)
    onSolved(r.correct, selected, step.concept)
  }

  return (
    <div className="space-y-4">
      <p className="font-display text-xl font-medium leading-snug text-ink">{renderSci(step.prompt)}</p>
      <QuestionVisual step={step} />
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

      <AiTutor
        lesson={lesson}
        step={step}
        attempts={attempts}
        lastAnswer={selected}
        solved={solved}
        masteryScore={masteryScore}
      />

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
  lesson,
  masteryScore,
  onSolved,
  onContinue,
  continueLabel,
}: {
  step: Extract<Step, { type: 'numeric' }>
  lesson: Lesson
  masteryScore?: number
  onSolved: Props['onSolved']
  onContinue: () => void
  continueLabel: string
}) {
  const [value, setValue] = useState('')
  const [result, setResult] = useState<{ correct: boolean; message: string } | null>(null)
  const [hintIndex, setHintIndex] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [lastNum, setLastNum] = useState<number | null>(null)
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
    setAttempts((a) => a + 1)
    setLastNum(num)
    onSolved(correct, num, step.concept)
  }

  return (
    <div className="space-y-4">
      <p className="font-display text-xl font-medium leading-snug text-ink">{renderSci(step.prompt)}</p>
      <QuestionVisual step={step} />
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

      <AiTutor
        lesson={lesson}
        step={step}
        attempts={attempts}
        lastAnswer={lastNum}
        solved={solved}
        masteryScore={masteryScore}
      />

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
  lesson,
  masteryScore,
  onSolved,
  onContinue,
  continueLabel,
}: {
  step: Extract<Step, { type: 'sim-challenge' }>
  lesson: Lesson
  masteryScore?: number
  onSolved: Props['onSolved']
  onContinue: () => void
  continueLabel: string
}) {
  const live = useRef({ angle: step.sim.angleDeg, speed: step.sim.speed })
  const [result, setResult] = useState<{ correct: boolean; message: string } | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [lastShot, setLastShot] = useState<string | null>(null)
  const solved = result?.correct ?? false

  const onState = useCallback((angle: number, speed: number) => {
    live.current = { angle, speed }
  }, [])

  const check = () => {
    const r = checkSimChallenge(step, live.current.angle, live.current.speed)
    setResult({ correct: r.correct, message: r.message })
    setAttempts((a) => a + 1)
    const shot = `${Math.round(live.current.angle)}deg/${Math.round(live.current.speed)}`
    setLastShot(shot)
    onSolved(r.correct, shot, step.concept)
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

      <AiTutor
        lesson={lesson}
        step={step}
        attempts={attempts}
        lastAnswer={lastShot}
        solved={solved}
        masteryScore={masteryScore}
      />

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
  lesson,
  masteryScore,
  onSolved,
  onContinue,
  continueLabel,
}: {
  step: Extract<Step, { type: 'tap-landing' }>
  lesson: Lesson
  masteryScore?: number
  onSolved: Props['onSolved']
  onContinue: () => void
  continueLabel: string
}) {
  const guess = useRef(0)
  const [result, setResult] = useState<{ correct: boolean; message: string } | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [lastGuess, setLastGuess] = useState<number | null>(null)
  const revealed = result !== null

  const onGuessChange = useCallback((m: number) => {
    guess.current = m
  }, [])

  const check = () => {
    const r = checkTapLanding(step, guess.current)
    setResult({ correct: r.correct, message: r.message })
    setAttempts((a) => a + 1)
    setLastGuess(Math.round(guess.current))
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

      <AiTutor
        lesson={lesson}
        step={step}
        attempts={attempts}
        lastAnswer={lastGuess}
        solved={revealed}
        masteryScore={masteryScore}
      />

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
  lesson,
  masteryScore,
  onSolved,
  onContinue,
  continueLabel,
}: {
  step: Extract<Step, { type: 'slider-estimate' }>
  lesson: Lesson
  masteryScore?: number
  onSolved: Props['onSolved']
  onContinue: () => void
  continueLabel: string
}) {
  const live = useRef({ angle: step.sim.angleDeg, speed: step.sim.speed })
  const [result, setResult] = useState<{ correct: boolean; message: string } | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [lastVal, setLastVal] = useState<number | null>(null)
  const solved = result?.correct ?? false

  const onState = useCallback((angle: number, speed: number) => {
    live.current = { angle, speed }
  }, [])

  const check = () => {
    const value = step.judge === 'angle' ? live.current.angle : live.current.speed
    const r = checkSliderEstimate(step, value)
    setResult(r)
    setAttempts((a) => a + 1)
    setLastVal(Math.round(value))
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

      <AiTutor
        lesson={lesson}
        step={step}
        attempts={attempts}
        lastAnswer={lastVal}
        solved={solved}
        masteryScore={masteryScore}
      />

      {solved ? (
        <PrimaryButton onClick={onContinue}>{continueLabel}</PrimaryButton>
      ) : (
        <PrimaryButton onClick={check}>Check</PrimaryButton>
      )}
    </div>
  )
}

function GraphTargetView({
  step,
  lesson,
  masteryScore,
  onSolved,
  onContinue,
  continueLabel,
}: {
  step: Extract<Step, { type: 'graph-target' }>
  lesson: Lesson
  masteryScore?: number
  onSolved: Props['onSolved']
  onContinue: () => void
  continueLabel: string
}) {
  const live = useRef(0)
  const [result, setResult] = useState<{ correct: boolean; message: string } | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [lastV, setLastV] = useState<number | null>(null)
  const solved = result?.correct ?? false

  const onValue = useCallback((v: number) => {
    live.current = v
  }, [])

  const check = () => {
    const r = checkGraphTarget(step, live.current)
    setResult(r)
    setAttempts((a) => a + 1)
    setLastV(Math.round(live.current))
    onSolved(r.correct, Math.round(live.current), step.concept)
  }

  return (
    <div className="space-y-4">
      <p className="font-display text-xl font-medium leading-snug text-ink">{renderSci(step.prompt)}</p>
      <GraphTarget
        target={step.target}
        startV={step.startV}
        onValue={onValue}
        revealed={result !== null}
        correct={result?.correct}
      />

      {result && (
        <Feedback correct={result.correct} message={result.message} explanation={step.explanation} takeaway={step.takeaway} />
      )}

      <AiTutor lesson={lesson} step={step} attempts={attempts} lastAnswer={lastV} solved={solved} masteryScore={masteryScore} />

      {solved ? (
        <PrimaryButton onClick={onContinue}>{continueLabel}</PrimaryButton>
      ) : (
        <PrimaryButton onClick={check}>Check the line</PrimaryButton>
      )}
    </div>
  )
}

function DropTargetView({
  step,
  lesson,
  masteryScore,
  onSolved,
  onContinue,
  continueLabel,
}: {
  step: Extract<Step, { type: 'drop-target' }>
  lesson: Lesson
  masteryScore?: number
  onSolved: Props['onSolved']
  onContinue: () => void
  continueLabel: string
}) {
  const live = useRef(20)
  const [result, setResult] = useState<{ correct: boolean; message: string } | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [lastH, setLastH] = useState<number | null>(null)
  const solved = result?.correct ?? false

  const onValue = useCallback((h: number) => {
    live.current = h
  }, [])

  const check = () => {
    const r = checkDropTarget(step, live.current)
    setResult({ correct: r.correct, message: r.message })
    setAttempts((a) => a + 1)
    setLastH(Math.round(live.current))
    onSolved(r.correct, Math.round(live.current), step.concept)
  }

  return (
    <div className="space-y-4">
      <p className="font-display text-xl font-medium leading-snug text-ink">{renderSci(step.prompt)}</p>
      <DropTarget
        targetTime={step.targetTime}
        gravity={step.gravity}
        onValue={onValue}
        revealed={result !== null}
        correct={result?.correct}
      />

      {result && (
        <Feedback correct={result.correct} message={result.message} explanation={step.explanation} takeaway={step.takeaway} />
      )}

      <AiTutor lesson={lesson} step={step} attempts={attempts} lastAnswer={lastH} solved={solved} masteryScore={masteryScore} />

      {solved ? (
        <PrimaryButton onClick={onContinue}>{continueLabel}</PrimaryButton>
      ) : (
        <PrimaryButton onClick={check}>Check the fall</PrimaryButton>
      )}
    </div>
  )
}

function PlotPositionView({
  step,
  lesson,
  masteryScore,
  onSolved,
  onContinue,
  continueLabel,
}: {
  step: Extract<Step, { type: 'plot-position' }>
  lesson: Lesson
  masteryScore?: number
  onSolved: Props['onSolved']
  onContinue: () => void
  continueLabel: string
}) {
  const live = useRef(0)
  const [result, setResult] = useState<{ correct: boolean; message: string } | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [lastPos, setLastPos] = useState<number | null>(null)
  const solved = result?.correct ?? false
  const max = step.max ?? Math.max(20, Math.ceil((step.velocity * step.time * 1.4) / 10) * 10)

  const onValue = useCallback((p: number) => {
    live.current = p
  }, [])

  const check = () => {
    const r = checkPlotPosition(step, live.current)
    setResult(r)
    setAttempts((a) => a + 1)
    setLastPos(Math.round(live.current))
    onSolved(r.correct, Math.round(live.current), step.concept)
  }

  return (
    <div className="space-y-4">
      <p className="font-display text-xl font-medium leading-snug text-ink">{renderSci(step.prompt)}</p>
      <NumberLinePlot max={max} onValue={onValue} revealed={result !== null} correct={result?.correct} />

      {result && (
        <Feedback correct={result.correct} message={result.message} explanation={step.explanation} takeaway={step.takeaway} />
      )}

      <AiTutor lesson={lesson} step={step} attempts={attempts} lastAnswer={lastPos} solved={solved} masteryScore={masteryScore} />

      {solved ? (
        <PrimaryButton onClick={onContinue}>{continueLabel}</PrimaryButton>
      ) : (
        <PrimaryButton onClick={check}>Check the spot</PrimaryButton>
      )}
    </div>
  )
}

function StopFallView({
  step,
  lesson,
  masteryScore,
  onSolved,
  onContinue,
  continueLabel,
}: {
  step: Extract<Step, { type: 'stop-fall' }>
  lesson: Lesson
  masteryScore?: number
  onSolved: Props['onSolved']
  onContinue: () => void
  continueLabel: string
}) {
  const live = useRef<number | null>(null)
  const [result, setResult] = useState<{ correct: boolean; message: string } | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [lastD, setLastD] = useState<number | null>(null)
  const solved = result?.correct ?? false

  const onValue = useCallback((d: number) => {
    live.current = d
  }, [])

  const check = () => {
    if (live.current == null) return
    const r = checkStopFall(step, live.current)
    setResult(r)
    setAttempts((a) => a + 1)
    setLastD(Math.round(live.current))
    onSolved(r.correct, Math.round(live.current), step.concept)
  }

  return (
    <div className="space-y-4">
      <p className="font-display text-xl font-medium leading-snug text-ink">{renderSci(step.prompt)}</p>
      <StopFall targetDistance={step.targetDistance} height={step.height} gravity={step.gravity} onValue={onValue} />

      {result && (
        <Feedback correct={result.correct} message={result.message} explanation={step.explanation} takeaway={step.takeaway} />
      )}

      <AiTutor lesson={lesson} step={step} attempts={attempts} lastAnswer={lastD} solved={solved} masteryScore={masteryScore} />

      {solved ? (
        <PrimaryButton onClick={onContinue}>{continueLabel}</PrimaryButton>
      ) : (
        <PrimaryButton onClick={check}>Check my timing</PrimaryButton>
      )}
    </div>
  )
}

function CurveAimView({
  step,
  lesson,
  masteryScore,
  onSolved,
  onContinue,
  continueLabel,
}: {
  step: Extract<Step, { type: 'curve-aim' }>
  lesson: Lesson
  masteryScore?: number
  onSolved: Props['onSolved']
  onContinue: () => void
  continueLabel: string
}) {
  const live = useRef(20)
  const [result, setResult] = useState<{ correct: boolean; message: string } | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [lastAngle, setLastAngle] = useState<number | null>(null)
  const solved = result?.correct ?? false

  const onValue = useCallback((a: number) => {
    live.current = a
  }, [])

  const check = () => {
    const r = checkCurveAim(step, live.current)
    setResult({ correct: r.correct, message: r.message })
    setAttempts((a) => a + 1)
    setLastAngle(Math.round(live.current))
    onSolved(r.correct, Math.round(live.current), step.concept)
  }

  return (
    <div className="space-y-4">
      <p className="font-display text-xl font-medium leading-snug text-ink">{renderSci(step.prompt)}</p>
      <RangeAim
        speed={step.speed}
        targetRange={step.targetRange}
        gravity={step.gravity}
        onValue={onValue}
        revealed={result !== null}
        correct={result?.correct}
      />

      {result && (
        <Feedback correct={result.correct} message={result.message} explanation={step.explanation} takeaway={step.takeaway} />
      )}

      <AiTutor lesson={lesson} step={step} attempts={attempts} lastAnswer={lastAngle} solved={solved} masteryScore={masteryScore} />

      {solved ? (
        <PrimaryButton onClick={onContinue}>{continueLabel}</PrimaryButton>
      ) : (
        <PrimaryButton onClick={check}>Check the aim</PrimaryButton>
      )}
    </div>
  )
}
