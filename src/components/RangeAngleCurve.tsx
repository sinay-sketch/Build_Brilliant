import { useState } from 'react'

interface Props {
  angleDeg?: number
  speed?: number
}

const DEG2RAD = Math.PI / 180
const G = 9.8
const VB_W = 300
const VB_H = 180
const PAD_L = 30
const PAD_R = 12
const PAD_T = 12
const PAD_B = 26

/**
 * A live plot of range R(θ) = v²·sin(2θ)/g across all launch angles. Drag the
 * angle and watch the marker ride the curve: it peaks at 45°, and the angle and
 * its complement (90 − θ) sit at the SAME height — the symmetry made visible.
 */
export default function RangeAngleCurve({ angleDeg = 30, speed = 22 }: Props) {
  const [angle, setAngle] = useState(angleDeg)
  const [v, setV] = useState(speed)

  const rangeAt = (deg: number) => (v * v * Math.sin(2 * deg * DEG2RAD)) / G
  const maxR = (v * v) / G // peak at 45 deg
  // FIXED y-axis (max speed 30 m/s → ~92 m), so changing the speed visibly
  // raises or lowers the whole curve instead of being auto-normalized away.
  const yMax = 100

  const sx = (deg: number) => PAD_L + (deg / 90) * (VB_W - PAD_L - PAD_R)
  const sy = (r: number) => PAD_T + (1 - r / yMax) * (VB_H - PAD_T - PAD_B)

  const pts: string[] = []
  for (let d = 0; d <= 90; d += 2) pts.push(`${sx(d)},${sy(rangeAt(d))}`)

  const comp = 90 - angle
  const r = rangeAt(angle)

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="bg-gradient-to-b from-[#fffdf7] to-[#f1e8d6]">
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="h-52 w-full" role="img" aria-label="Range versus angle curve">
          {/* axes */}
          <line x1={PAD_L} y1={VB_H - PAD_B} x2={VB_W - PAD_R} y2={VB_H - PAD_B} stroke="#bd9e6a" strokeWidth="1.5" />
          <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={VB_H - PAD_B} stroke="rgba(33,28,22,0.15)" strokeWidth="1.5" />

          {/* range (y) gridlines + labels — fixed scale */}
          {[0, 25, 50, 75, 100].map((r) => (
            <g key={r}>
              <line x1={PAD_L} y1={sy(r)} x2={VB_W - PAD_R} y2={sy(r)} stroke="rgba(33,28,22,0.06)" strokeWidth="1" />
              <text x={PAD_L - 4} y={sy(r) + 3} fontSize="8" textAnchor="end" fill="var(--color-ink-mute)">
                {r === 100 ? '100m' : r}
              </text>
            </g>
          ))}

          {/* angle ticks */}
          {[0, 30, 45, 60, 90].map((d) => (
            <g key={d}>
              <line x1={sx(d)} y1={VB_H - PAD_B} x2={sx(d)} y2={VB_H - PAD_B + 4} stroke="#bd9e6a" />
              <text x={sx(d)} y={VB_H - PAD_B + 14} fontSize="9" textAnchor="middle" fill="var(--color-ink-soft)">
                {d}°
              </text>
            </g>
          ))}

          {/* 45-degree peak guide */}
          <line x1={sx(45)} y1={sy(maxR)} x2={sx(45)} y2={VB_H - PAD_B} stroke="rgba(176,125,24,0.4)" strokeWidth="1" strokeDasharray="3 3" />

          {/* the curve */}
          <polyline points={pts.join(' ')} fill="none" stroke="var(--color-brand)" strokeWidth="2.5" />

          {/* complement marker (equal range) */}
          <line x1={sx(comp)} y1={sy(r)} x2={sx(angle)} y2={sy(r)} stroke="rgba(33,28,22,0.25)" strokeWidth="1" strokeDasharray="4 3" />
          <circle cx={sx(comp)} cy={sy(r)} r="4" fill="none" stroke="var(--color-ink-mute)" strokeWidth="1.5" />
          <text x={sx(comp)} y={sy(r) - 7} fontSize="9" textAnchor="middle" fill="var(--color-ink-mute)">
            {Math.round(comp)}°
          </text>

          {/* active marker */}
          <line x1={sx(angle)} y1={sy(r)} x2={sx(angle)} y2={VB_H - PAD_B} stroke="var(--color-brand)" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx={sx(angle)} cy={sy(r)} r="5.5" fill="var(--color-brand)" stroke="#fff" strokeWidth="2" />
        </svg>
      </div>

      <div className="grid grid-cols-2 divide-x divide-line border-y border-line bg-surface-2 text-center">
        <div className="px-2 py-2">
          <p className="font-display text-base font-semibold text-ink">{r.toFixed(1)} m</p>
          <p className="text-[10px] text-ink-soft">Range at {Math.round(angle)}°</p>
        </div>
        <div className="px-2 py-2">
          <p className="font-display text-base font-semibold text-ink">{Math.round(comp)}°</p>
          <p className="text-[10px] text-ink-soft">Complement — same range</p>
        </div>
      </div>

      <div className="space-y-3 p-3">
        <Slider label="Angle" value={angle} min={5} max={85} unit="°" onChange={setAngle} />
        <Slider label="Launch speed" value={v} min={10} max={30} unit=" m/s" onChange={setV} />
      </div>
    </div>
  )
}

function Slider({
  label,
  value,
  min,
  max,
  unit,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  unit: string
  onChange: (v: number) => void
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="font-medium text-ink-soft">{label}</span>
        <span className="font-mono font-semibold text-brand">
          {Math.round(value)}
          {unit}
        </span>
      </div>
      <input type="range" min={min} max={max} step={1} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  )
}
