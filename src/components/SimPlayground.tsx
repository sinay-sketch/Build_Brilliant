import { useEffect, useState } from 'react'
import type { SimConfig } from '../types/content'
import { computeKinematics } from '../lib/physics'
import ProjectileCanvas from './ProjectileCanvas'

interface Props {
  config: SimConfig
  /** Reports current angle/speed so a parent can check a challenge. */
  onState?: (angleDeg: number, speed: number) => void
  heightClass?: string
}

const ANGLE_MIN = 5
const ANGLE_MAX = 85
const SPEED_MIN = 5
const SPEED_MAX = 35

export default function SimPlayground({ config, onState, heightClass = 'h-64' }: Props) {
  const [angle, setAngle] = useState(config.angleDeg)
  const [speed, setSpeed] = useState(config.speed)
  const [fireSignal, setFireSignal] = useState(0)

  const canEditAngle = config.editable.includes('angle')
  const canEditSpeed = config.editable.includes('speed')

  useEffect(() => {
    onState?.(angle, speed)
  }, [angle, speed, onState])

  const k = computeKinematics(angle, speed, config.gravity)

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className={`${heightClass} w-full overflow-hidden`}>
        <ProjectileCanvas
          angleDeg={angle}
          speed={speed}
          gravity={config.gravity}
          target={config.target}
          wall={config.wall}
          ghost={config.ghost}
          fireSignal={fireSignal}
        />
      </div>

      {/* Live physics readouts */}
      <div className="grid grid-cols-3 divide-x divide-line border-y border-line bg-surface-2">
        <Readout label="Range" value={k.range} unit="m" />
        <Readout label="Peak" value={k.maxHeight} unit="m" />
        <Readout label="Air time" value={k.timeOfFlight} unit="s" />
      </div>

      <div className="space-y-3 p-3">
        {canEditAngle && (
          <SliderRow label="Angle" value={angle} min={ANGLE_MIN} max={ANGLE_MAX} unit="°" onChange={setAngle} />
        )}
        {canEditSpeed && (
          <SliderRow label="Speed" value={speed} min={SPEED_MIN} max={SPEED_MAX} unit="m/s" onChange={setSpeed} />
        )}

        <button type="button" onClick={() => setFireSignal((s) => s + 1)} className="btn-primary w-full py-3">
          Fire
        </button>
      </div>
    </div>
  )
}

function Readout({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="px-2 py-2.5 text-center">
      <p className="eyebrow text-ink-mute">{label}</p>
      <p className="font-display text-lg font-semibold text-ink">
        {value.toFixed(1)}
        <span className="ml-0.5 text-xs font-normal text-ink-soft">{unit}</span>
      </p>
    </div>
  )
}

function SliderRow({
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
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  )
}
