import { useEffect, useState } from 'react'

interface Props {
  max?: number
  startValue?: number
  onValue: (pos: number) => void
  revealed?: boolean
  correct?: boolean
}

/**
 * A draggable number line: the learner slides a marker to a position in meters.
 * Used for "where is the object after t seconds?" style questions.
 */
export default function NumberLinePlot({ max = 60, startValue = 0, onValue, revealed, correct }: Props) {
  const [pos, setPos] = useState(startValue)

  useEffect(() => {
    onValue(pos)
  }, [pos, onValue])

  const pct = (pos / max) * 100
  const markerColor = revealed ? (correct ? 'var(--color-success)' : 'var(--color-danger)') : 'var(--color-brand)'
  const ticks = Array.from({ length: 7 }, (_, i) => Math.round((max / 6) * i))

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface p-4">
      <div className="relative h-20">
        {/* track */}
        <div className="absolute left-0 right-0 top-12 h-1 rounded-full bg-track" />
        {/* ticks */}
        {ticks.map((tk) => (
          <div key={tk} className="absolute top-12 -translate-x-1/2" style={{ left: `${(tk / max) * 100}%` }}>
            <div className="mx-auto h-2 w-px bg-line-strong" />
            <div className="mt-1 text-center text-[10px] text-ink-mute">{tk}</div>
          </div>
        ))}
        {/* marker (the object) */}
        <div
          className="absolute top-12 -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${pct}%` }}
        >
          <div className="h-5 w-5 rounded-full border-2 border-white shadow-md" style={{ backgroundColor: markerColor }} />
        </div>
        {/* value bubble */}
        <div
          className="absolute top-0 -translate-x-1/2 rounded-lg bg-ink px-2 py-0.5 font-mono text-xs font-semibold text-[#f4efe4]"
          style={{ left: `${Math.min(92, Math.max(8, pct))}%` }}
        >
          {Math.round(pos)} m
        </div>
      </div>

      <input
        type="range"
        min={0}
        max={max}
        step={1}
        value={pos}
        disabled={revealed && correct}
        onChange={(e) => setPos(Number(e.target.value))}
        className="mt-2"
      />
    </div>
  )
}
