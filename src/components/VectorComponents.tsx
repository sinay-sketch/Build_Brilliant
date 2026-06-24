import { useState } from 'react'
import Sci from './Sci'

interface Props {
  angleDeg?: number
  speed?: number
}

const DEG2RAD = Math.PI / 180
const SCALE = 3 // px per (m/s)
const OX = 28 // origin x
const OY = 150 // origin y (baseline)

/**
 * Interactive decomposition of a launch velocity into horizontal (v·cosθ) and
 * vertical (v·sinθ) parts. SVG so the arrows and labels stay crisp. Pure play —
 * the learner drags and watches the two components respond.
 */
export default function VectorComponents({ angleDeg = 35, speed = 22 }: Props) {
  const [angle, setAngle] = useState(angleDeg)
  const [spd, setSpd] = useState(speed)

  const rad = angle * DEG2RAD
  const vx = spd * Math.cos(rad)
  const vy = spd * Math.sin(rad)

  const tipX = OX + vx * SCALE
  const tipY = OY - vy * SCALE
  const cornerX = tipX // vertical component sits above the horizontal one
  const cornerY = OY

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="bg-gradient-to-b from-[#fffdf7] to-[#f1e8d6]">
        <svg viewBox="0 0 280 175" className="h-56 w-full" role="img" aria-label="Velocity components">
          {/* axes */}
          <line x1={OX} y1={OY} x2={262} y2={OY} stroke="#bd9e6a" strokeWidth="1.5" />
          <line x1={OX} y1={OY} x2={OX} y2={14} stroke="rgba(33,28,22,0.15)" strokeWidth="1.5" />

          {/* horizontal component vx */}
          <Arrow x1={OX} y1={OY} x2={cornerX} y2={cornerY} color="var(--color-brand)" />
          {/* vertical component vy */}
          <Arrow x1={cornerX} y1={cornerY} x2={tipX} y2={tipY} color="var(--color-success)" />
          {/* dashed helpers completing the rectangle */}
          <line x1={OX} y1={tipY} x2={tipX} y2={tipY} stroke="rgba(33,28,22,0.2)" strokeWidth="1" strokeDasharray="3 3" />
          <line x1={OX} y1={tipY} x2={OX} y2={OY} stroke="transparent" />
          {/* resultant velocity v */}
          <Arrow x1={OX} y1={OY} x2={tipX} y2={tipY} color="var(--color-ink)" width={2.5} />

          {/* right-angle marker at the corner */}
          <path
            d={`M ${cornerX - 8} ${cornerY} L ${cornerX - 8} ${cornerY - 8} L ${cornerX} ${cornerY - 8}`}
            fill="none"
            stroke="rgba(33,28,22,0.35)"
            strokeWidth="1"
          />

          {/* angle arc */}
          <path
            d={describeArc(OX, OY, 24, angle)}
            fill="none"
            stroke="var(--color-gold)"
            strokeWidth="1.5"
          />
          <text x={OX + 30} y={OY - 8} fontSize="11" fill="var(--color-gold)" fontWeight="600">
            θ {Math.round(angle)}°
          </text>

          {/* component labels */}
          <text x={(OX + cornerX) / 2} y={OY + 15} fontSize="11" textAnchor="middle" fill="var(--color-brand)" fontWeight="700">
            <tspan>v</tspan>
            <tspan dy="3" fontSize="8">x</tspan>
            <tspan dy="-3"> {vx.toFixed(1)}</tspan>
          </text>
          <text x={cornerX + 6} y={(cornerY + tipY) / 2} fontSize="11" fill="var(--color-success)" fontWeight="700">
            <tspan>v</tspan>
            <tspan dy="3" fontSize="8">y</tspan>
            <tspan dy="-3"> {vy.toFixed(1)}</tspan>
          </text>
        </svg>
      </div>

      {/* live formula readouts */}
      <div className="grid grid-cols-2 divide-x divide-line border-y border-line bg-surface-2 text-center">
        <div className="px-2 py-2">
          <p className="text-xs font-semibold text-brand">
            <Sci>v_x = v · cos θ</Sci>
          </p>
          <p className="font-display text-base font-semibold text-ink">
            {spd} · cos{Math.round(angle)}° = {vx.toFixed(1)} <span className="text-xs font-normal text-ink-soft">m/s</span>
          </p>
        </div>
        <div className="px-2 py-2">
          <p className="text-xs font-semibold text-success-strong">
            <Sci>v_y = v · sin θ</Sci>
          </p>
          <p className="font-display text-base font-semibold text-ink">
            {spd} · sin{Math.round(angle)}° = {vy.toFixed(1)} <span className="text-xs font-normal text-ink-soft">m/s</span>
          </p>
        </div>
      </div>

      <div className="space-y-3 p-3">
        <Slider label="Angle" value={angle} min={5} max={85} unit="°" onChange={setAngle} />
        <Slider label="Launch speed" value={spd} min={5} max={35} unit="m/s" onChange={setSpd} />
      </div>
    </div>
  )
}

function Arrow({
  x1,
  y1,
  x2,
  y2,
  color,
  width = 2,
}: {
  x1: number
  y1: number
  x2: number
  y2: number
  color: string
  width?: number
}) {
  const angle = Math.atan2(y2 - y1, x2 - x1)
  const len = Math.hypot(x2 - x1, y2 - y1)
  if (len < 2) return null
  const head = 7
  const a1 = angle + Math.PI - 0.4
  const a2 = angle + Math.PI + 0.4
  return (
    <g stroke={color} fill={color}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={width} />
      <polygon
        points={`${x2},${y2} ${x2 + head * Math.cos(a1)},${y2 + head * Math.sin(a1)} ${x2 + head * Math.cos(a2)},${y2 + head * Math.sin(a2)}`}
      />
    </g>
  )
}

function describeArc(cx: number, cy: number, r: number, deg: number) {
  const end = -deg * DEG2RAD
  const x = cx + r * Math.cos(end)
  const y = cy + r * Math.sin(end)
  return `M ${cx + r} ${cy} A ${r} ${r} 0 0 0 ${x} ${y}`
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
