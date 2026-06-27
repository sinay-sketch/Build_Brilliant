import { useEffect, useRef, useState } from 'react'
import { computeKinematics, trajectoryPoints } from '../lib/physics'

interface Props {
  angleDeg?: number
  speed?: number
}

const G = 9.8
// Wall-clock seconds the LONGER flight should take — the playback factor is
// derived from this so both arcs stay watchable and the slow one finishes.
const WATCH_SECONDS = 2.6

const COLORS = {
  skyTop: '#fffdf7',
  skyBottom: '#f1e8d6',
  ground: '#bd9e6a',
  groundFill: '#e7d6b3',
  flat: '#d9600c', // chosen angle θ
  high: '#b07d18', // complement 90 − θ
  target: '#1f8a4c',
}

/**
 * Fire two projectiles at the SAME speed: one at θ (orange, flat & fast) and one
 * at its complement 90 − θ (gold, high & slow). They take different times in the
 * air yet land at the exact same spot — complementary angles share a range. The
 * green marker shows that shared landing point. At θ = 45° the two arcs coincide.
 */
export default function ComplementaryPair({ angleDeg = 30, speed = 22 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [angle, setAngle] = useState(angleDeg)
  const [v, setV] = useState(speed)
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle')
  const startRef = useRef<number | null>(null)
  const params = useRef({ angle, v, phase })
  params.current = { angle, v, phase }

  const fire = () => {
    startRef.current = performance.now()
    setPhase('running')
  }
  const reset = () => {
    startRef.current = null
    setPhase('idle')
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let raf = 0

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const rect = canvas.getBoundingClientRect()
      canvas.width = Math.round(rect.width * dpr)
      canvas.height = Math.round(rect.height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const draw = (now: number) => {
      const p = params.current
      const rect = canvas.getBoundingClientRect()
      const W = rect.width
      const Hpx = rect.height
      const padL = 16
      const padR = 16
      const padT = 16
      const padB = 22

      const comp = 90 - p.angle
      const kFlat = computeKinematics(p.angle, p.v, G)
      const kHigh = computeKinematics(comp, p.v, G)
      const range = kFlat.range
      const tofMax = Math.max(kFlat.timeOfFlight, kHigh.timeOfFlight)
      const peak = Math.max(kFlat.maxHeight, kHigh.maxHeight)

      // world → canvas (independent x/y fit so both arcs use the full panel)
      const worldW = Math.max(range, 1)
      const worldH = Math.max(peak, 1)
      const sx = (x: number) => padL + (x / worldW) * (W - padL - padR)
      const sy = (y: number) => Hpx - padB - (y / worldH) * (Hpx - padT - padB)

      ctx.clearRect(0, 0, W, Hpx)
      const sky = ctx.createLinearGradient(0, 0, 0, Hpx)
      sky.addColorStop(0, COLORS.skyTop)
      sky.addColorStop(1, COLORS.skyBottom)
      ctx.fillStyle = sky
      ctx.fillRect(0, 0, W, Hpx)

      // ground
      ctx.fillStyle = COLORS.groundFill
      ctx.fillRect(0, Hpx - padB, W, padB)
      ctx.strokeStyle = COLORS.ground
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(0, Hpx - padB)
      ctx.lineTo(W, Hpx - padB)
      ctx.stroke()

      // faint full arcs (predicted paths)
      const arc = (deg: number, color: string) => {
        const pts = trajectoryPoints(deg, p.v, G)
        ctx.strokeStyle = color
        ctx.globalAlpha = 0.3
        ctx.lineWidth = 2
        ctx.beginPath()
        pts.forEach((pt, i) => {
          const X = sx(pt.x)
          const Y = sy(pt.y)
          if (i === 0) ctx.moveTo(X, Y)
          else ctx.lineTo(X, Y)
        })
        ctx.stroke()
        ctx.globalAlpha = 1
      }
      arc(p.angle, COLORS.flat)
      arc(comp, COLORS.high)

      // shared landing marker (green) on the ground
      const lx = sx(range)
      const gy = Hpx - padB
      ctx.fillStyle = COLORS.target
      ctx.beginPath()
      ctx.moveTo(lx, gy - 14)
      ctx.lineTo(lx + 5, gy - 22)
      ctx.lineTo(lx, gy - 22)
      ctx.closePath()
      ctx.fill()
      ctx.strokeStyle = COLORS.target
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(lx, gy)
      ctx.lineTo(lx, gy - 22)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(lx, gy, 4, 0, Math.PI * 2)
      ctx.fill()

      // animate both projectiles
      let t = 0
      if (startRef.current != null) {
        const elapsed = (now - startRef.current) / 1000
        t = (Math.min(elapsed, WATCH_SECONDS) / WATCH_SECONDS) * tofMax
        if (elapsed >= WATCH_SECONDS && p.phase === 'running') {
          queueMicrotask(() => setPhase('done'))
        }
      }

      const ball = (k: typeof kFlat, color: string) => {
        const tt = Math.min(t, k.timeOfFlight)
        const x = k.vx * tt
        const y = Math.max(0, k.vy * tt - 0.5 * G * tt * tt)
        ctx.fillStyle = color
        ctx.shadowColor = 'rgba(33,28,22,0.25)'
        ctx.shadowBlur = 6
        ctx.beginPath()
        ctx.arc(sx(x), sy(y), 8, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
      }
      if (startRef.current != null) {
        ball(kHigh, COLORS.high)
        ball(kFlat, COLORS.flat)
      }

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  const comp = 90 - angle
  const range = computeKinematics(angle, v, G).range
  const isDegenerate = Math.round(angle) === 45

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="h-56 w-full">
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      </div>

      <div className="border-y border-line bg-surface-2 px-3 py-2 text-center">
        <p className="font-display text-sm font-semibold text-ink">
          θ = {Math.round(angle)}°, complement = {Math.round(comp)}°, both land at R = {range.toFixed(1)} m
        </p>
        <p className="text-[10px] leading-tight text-ink-soft">
          {isDegenerate
            ? 'θ = 45°: the two arcs coincide — same flat & high path'
            : 'Same speed, same range — orange is flat & fast, gold is high & slow'}
        </p>
      </div>

      <div className="space-y-3 p-3">
        <Slider label="Angle θ" value={angle} min={10} max={80} unit="°" onChange={(n) => { setAngle(n); reset() }} />
        <Slider label="Launch speed" value={v} min={10} max={30} unit=" m/s" onChange={(n) => { setV(n); reset() }} />
        <div className="flex gap-2">
          <button type="button" onClick={fire} disabled={phase === 'running'} className="btn-primary flex-1 py-2.5">
            {phase === 'done' ? 'Fire again' : 'Fire'}
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded-xl border border-line bg-surface px-4 py-2.5 font-semibold text-ink transition hover:border-brand/50"
          >
            Reset
          </button>
        </div>
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
