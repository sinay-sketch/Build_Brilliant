import { useEffect, useState } from 'react'

interface Props {
  target: { t: number; x: number }
  startV?: number
  /** Reports the current velocity (slope) so the parent can grade on Check. */
  onValue: (v: number) => void
  revealed?: boolean
  correct?: boolean
}

const T_MAX = 5
const VB_W = 300
const VB_H = 180
const PAD_L = 30
const PAD_R = 12
const PAD_T = 12
const PAD_B = 26

/**
 * Graded graph game: drag the velocity until the position-time line passes
 * through the target point. Because the axes are fixed, the slope you set is
 * the velocity — steeper line, larger velocity.
 */
export default function GraphTarget({ target, startV, onValue, revealed, correct }: Props) {
  const needed = target.x / target.t
  const sliderMax = Math.max(12, Math.ceil(needed + 4))
  const posMax = Math.max(60, Math.ceil(target.x / 10) * 10 + 10)
  const [v, setV] = useState(startV ?? Math.max(0, Math.round(needed * 0.4)))

  useEffect(() => {
    onValue(v)
  }, [v, onValue])

  const sx = (t: number) => PAD_L + (t / T_MAX) * (VB_W - PAD_L - PAD_R)
  const sy = (x: number) => PAD_T + (1 - x / posMax) * (VB_H - PAD_T - PAD_B)

  const lineColor = revealed ? (correct ? 'var(--color-success)' : 'var(--color-danger)') : 'var(--color-brand)'

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="bg-gradient-to-b from-[#fffdf7] to-[#f1e8d6]">
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="h-52 w-full" role="img" aria-label="Position-time graph">
          {/* gridlines + position labels */}
          {[0, posMax / 2, posMax].map((x) => (
            <g key={x}>
              <line x1={PAD_L} y1={sy(x)} x2={VB_W - PAD_R} y2={sy(x)} stroke="rgba(33,28,22,0.07)" />
              <text x={PAD_L - 4} y={sy(x) + 3} fontSize="8" textAnchor="end" fill="var(--color-ink-mute)">
                {x === posMax ? `${x}m` : x}
              </text>
            </g>
          ))}
          {/* time ticks */}
          {[0, 1, 2, 3, 4, 5].map((t) => (
            <g key={t}>
              <line x1={sx(t)} y1={PAD_T} x2={sx(t)} y2={VB_H - PAD_B} stroke="rgba(33,28,22,0.05)" />
              <text x={sx(t)} y={VB_H - PAD_B + 13} fontSize="8" textAnchor="middle" fill="var(--color-ink-mute)">
                {t}s
              </text>
            </g>
          ))}
          {/* baseline */}
          <line x1={PAD_L} y1={sy(0)} x2={VB_W - PAD_R} y2={sy(0)} stroke="#bd9e6a" strokeWidth="1.5" />

          {/* axis labels */}
          <text x={(PAD_L + VB_W - PAD_R) / 2} y={VB_H - 2} fontSize="9" textAnchor="middle" fill="var(--color-ink-soft)" fontWeight="600">
            time (s)
          </text>
          <text x={9} y={(PAD_T + VB_H - PAD_B) / 2} fontSize="9" textAnchor="middle" fill="var(--color-ink-soft)" fontWeight="600" transform={`rotate(-90 9 ${(PAD_T + VB_H - PAD_B) / 2})`}>
            position (m)
          </text>

          {/* target point */}
          <line x1={sx(target.t)} y1={sy(target.x)} x2={sx(target.t)} y2={sy(0)} stroke="rgba(33,28,22,0.2)" strokeDasharray="3 3" />
          <line x1={PAD_L} y1={sy(target.x)} x2={sx(target.t)} y2={sy(target.x)} stroke="rgba(33,28,22,0.2)" strokeDasharray="3 3" />
          <circle cx={sx(target.t)} cy={sy(target.x)} r="6" fill="none" stroke="var(--color-gold)" strokeWidth="2" />
          <text x={sx(target.t)} y={sy(target.x) - 9} fontSize="9" textAnchor="middle" fill="var(--color-gold)" fontWeight="600">
            ({target.t}s, {target.x}m)
          </text>

          {/* the learner's line */}
          <line x1={sx(0)} y1={sy(0)} x2={sx(T_MAX)} y2={sy(Math.min(posMax, v * T_MAX))} stroke={lineColor} strokeWidth="3" />
        </svg>
      </div>

      <div className="border-y border-line bg-surface-2 px-3 py-2 text-center text-sm">
        <span className="text-ink-soft">At {target.t}s your line is at </span>
        <span className="font-mono font-semibold text-brand">{Math.round(v * target.t)} m</span>
        <span className="text-ink-soft"> (need {target.x} m)</span>
      </div>

      <div className="p-3">
        <div className="mb-1.5 flex items-center justify-between text-sm">
          <span className="font-medium text-ink-soft">Velocity (slope)</span>
          <span className="font-mono font-semibold text-brand">{v} m/s</span>
        </div>
        <input
          type="range"
          min={0}
          max={sliderMax}
          step={1}
          value={v}
          disabled={revealed && correct}
          onChange={(e) => setV(Number(e.target.value))}
        />
      </div>
    </div>
  )
}
