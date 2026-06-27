import { useEffect, useState } from 'react'

interface Props {
  speed: number
  targetRange: number
  gravity?: number
  onValue: (angleDeg: number) => void
  revealed?: boolean
  correct?: boolean
}

const DEG2RAD = Math.PI / 180
const VB_W = 300
const VB_H = 180
const PAD_L = 30
const PAD_R = 12
const PAD_T = 12
const PAD_B = 26
const Y_MAX = 100

/**
 * Graded curve game: drag the launch angle along the range-vs-angle curve until
 * the range hits the dashed target line. Either complementary angle is accepted,
 * since both land at the same range.
 */
export default function RangeAim({ speed, targetRange, gravity = 9.8, onValue, revealed, correct }: Props) {
  const [angle, setAngle] = useState(20)

  useEffect(() => {
    onValue(angle)
  }, [angle, onValue])

  const rangeAt = (deg: number) => (speed * speed * Math.sin(2 * deg * DEG2RAD)) / gravity
  const sx = (deg: number) => PAD_L + (deg / 90) * (VB_W - PAD_L - PAD_R)
  const sy = (r: number) => PAD_T + (1 - r / Y_MAX) * (VB_H - PAD_T - PAD_B)

  const pts: string[] = []
  for (let d = 0; d <= 90; d += 2) pts.push(`${sx(d)},${sy(rangeAt(d))}`)
  const r = rangeAt(angle)
  const markerColor = revealed ? (correct ? 'var(--color-success)' : 'var(--color-danger)') : 'var(--color-brand)'

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="bg-gradient-to-b from-[#fffdf7] to-[#f1e8d6]">
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="h-52 w-full" role="img" aria-label="Aim using the range curve">
          <line x1={PAD_L} y1={VB_H - PAD_B} x2={VB_W - PAD_R} y2={VB_H - PAD_B} stroke="#bd9e6a" strokeWidth="1.5" />
          <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={VB_H - PAD_B} stroke="rgba(33,28,22,0.15)" strokeWidth="1.5" />

          {[0, 50, 100].map((rr) => (
            <g key={rr}>
              <line x1={PAD_L} y1={sy(rr)} x2={VB_W - PAD_R} y2={sy(rr)} stroke="rgba(33,28,22,0.06)" />
              <text x={PAD_L - 4} y={sy(rr) + 3} fontSize="8" textAnchor="end" fill="var(--color-ink-mute)">
                {rr === 100 ? '100m' : rr}
              </text>
            </g>
          ))}
          {[0, 30, 45, 60, 90].map((d) => (
            <text key={d} x={sx(d)} y={VB_H - PAD_B + 13} fontSize="8" textAnchor="middle" fill="var(--color-ink-mute)">
              {d}°
            </text>
          ))}

          {/* target range line */}
          <line x1={PAD_L} y1={sy(targetRange)} x2={VB_W - PAD_R} y2={sy(targetRange)} stroke="var(--color-gold)" strokeWidth="1.5" strokeDasharray="5 4" />
          <text x={VB_W - PAD_R} y={sy(targetRange) - 4} fontSize="9" textAnchor="end" fill="var(--color-gold)" fontWeight="600">
            target {targetRange} m
          </text>

          {/* curve */}
          <polyline points={pts.join(' ')} fill="none" stroke="rgba(217,96,12,0.45)" strokeWidth="2" />

          {/* active marker */}
          <line x1={sx(angle)} y1={sy(r)} x2={sx(angle)} y2={VB_H - PAD_B} stroke={markerColor} strokeWidth="1" strokeDasharray="3 3" />
          <circle cx={sx(angle)} cy={sy(r)} r="5.5" fill={markerColor} stroke="#fff" strokeWidth="2" />
        </svg>
      </div>

      <div className="border-y border-line bg-surface-2 px-3 py-2 text-center text-sm">
        <span className="text-ink-soft">Range at {Math.round(angle)}° = </span>
        <span className="font-mono font-semibold text-brand">{r.toFixed(1)} m</span>
      </div>

      <div className="p-3">
        <div className="mb-1.5 flex items-center justify-between text-sm">
          <span className="font-medium text-ink-soft">Launch angle ({speed} m/s)</span>
          <span className="font-mono font-semibold text-brand">{Math.round(angle)}°</span>
        </div>
        <input
          type="range"
          min={5}
          max={85}
          step={1}
          value={angle}
          disabled={revealed && correct}
          onChange={(e) => setAngle(Number(e.target.value))}
        />
      </div>
    </div>
  )
}
