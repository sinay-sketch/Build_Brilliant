import { renderSci } from './Sci'

interface Props {
  correct: boolean
  message: string
  explanation?: string
  takeaway?: string
}

export default function Feedback({ correct, message, explanation, takeaway }: Props) {
  return (
    <div
      className={`animate-pop-in rounded-xl border p-4 ${
        correct ? 'border-success/40 bg-success-soft' : 'border-danger/40 bg-danger-soft'
      }`}
    >
      <p
        className={`flex items-center gap-2 font-display text-base font-semibold ${
          correct ? 'text-success-strong' : 'text-danger-strong'
        }`}
      >
        <span
          className={`flex h-5 w-5 items-center justify-center rounded-full text-xs text-white ${
            correct ? 'bg-success' : 'bg-danger'
          }`}
        >
          {correct ? '✓' : '!'}
        </span>
        {correct ? 'Correct' : 'Not quite'}
      </p>
      {message && <p className="mt-2 text-sm leading-relaxed text-ink">{renderSci(message)}</p>}
      {explanation && correct && (
        <p className="mt-2 border-t border-success/20 pt-2 text-sm leading-relaxed text-ink-soft">
          {renderSci(explanation)}
        </p>
      )}
      {takeaway && correct && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-brand-tint px-3 py-2">
          <span className="mt-0.5 text-brand">★</span>
          <p className="text-sm font-medium text-ink">
            <span className="eyebrow mr-1.5 text-brand">Key idea</span>
            {renderSci(takeaway)}
          </p>
        </div>
      )}
    </div>
  )
}
