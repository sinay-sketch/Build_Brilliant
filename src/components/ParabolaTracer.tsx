import { useEffect, useRef, useState } from 'react'
import { computeKinematics, trajectoryPoints } from '../lib/physics'

interface Props {
  angleDeg?: number
  speed?: number
}

const G = 9.8
const PLAYBACK = 0.45 // slow the flight down so the components are watchable

const COLORS = {
  skyTop: '#fffdf7',
  skyBottom: '#f1e8d6',
  ground: '#bd9e6a',
  groundFill: '#e7d6b3',
  arc: '#d9600c',
  horizontal: '#d9600c',
  vertical: '#1f8a4c',
  resultant: '#211c16',
}

/**
 * Fire a projectile along its parabolic arc and watch the velocity split into
 * two independent parts: a constant horizontal arrow (orange, vx never changes)
 * and a changing vertical arrow (green, vy = v·sinθ − g·t). The vertical one
 * shrinks on the way up, flips at the peak and grows on the way down — while the
 * orange one stays exactly the same. That is projectile independence, made visible.
 */
export default function ParabolaTracer({ angleDeg = 45, speed = 20 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [angle, setAngle] = useState(angleDeg)
  const [spd, setSpd] = useState(speed)
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle')
  const [readout, setReadout] = useState({ vx: 0, vy: 0 })
  const startRef = useRef<number | null>(null)
  const params = useRef({ angle, spd, phase })
  params.current = { angle, spd, phase }

  const fire = () => {
    startRef.current = performance.now()
    setPhase('running')
  }
  const reset = () => {
    startRef.current = null
    setPhase('idle')
    setReadout({ vx: 0, vy: 0 })
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

    const arrow = (x: number, y: number, dx: number, dy: number, color: string, width = 2.5) => {
      const len = Math.hypot(dx, dy)
      if (len < 1) return
      const ang = Math.atan2(dy, dx)
      const head = 8
      ctx.strokeStyle = color
      ctx.fillStyle = color
      ctx.lineWidth = width
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x + dx, y + dy)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(x + dx, y + dy)
      ctx.lineTo(x + dx - head * Math.cos(ang - 0.4), y + dy - head * Math.sin(ang - 0.4))
      ctx.lineTo(x + dx - head * Math.cos(ang + 0.4), y + dy - head * Math.sin(ang + 0.4))
      ctx.closePath()
      ctx.fill()
    }

    const draw = (now: number) => {
      const p = params.current
      const rect = canvas.getBoundingClientRect()
      const W = rect.width
      const Hpx = rect.height
      const padL = 24
      const padR = 24
      const padT = 18
      const padB = 22

      const { vx, vy, range, maxHeight, timeOfFlight } = computeKinematics(p.angle, p.spd, G)
      const pts = trajectoryPoints(p.angle, p.spd, G)
      const spanX = Math.max(range, 1)
      const spanY = Math.max(maxHeight, 1)
      const sx = (x: number) => padL + (x / spanX) * (W - padL - padR)
      const sy = (y: number) => Hpx - padB - (y / spanY) * (Hpx - padT - padB)

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

      // cannon at the launch point
      ctx.save()
      ctx.translate(sx(0), sy(0))
      ctx.rotate(-p.angle * (Math.PI / 180))
      ctx.fillStyle = COLORS.resultant
      ctx.fillRect(-4, -6, 26, 12)
      ctx.restore()

      // full faint arc
      ctx.strokeStyle = COLORS.arc
      ctx.globalAlpha = 0.28
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

      let t = 0
      if (startRef.current != null) {
        t = Math.min(((now - startRef.current) / 1000) * PLAYBACK, timeOfFlight)
        if (t >= timeOfFlight && p.phase === 'running') {
          queueMicrotask(() => setPhase('done'))
        }
      }

      // ball position from kinematics
      const bx = vx * t
      const by = Math.max(0, vy * t - 0.5 * G * t * t)
      const ballX = sx(bx)
      const ballY = sy(by)

      // velocity components at the ball
      const curVy = vy - G * t
      const AR = 4 // px per (m/s)
      // constant horizontal arrow (orange)
      arrow(ballX, ballY, vx * AR, 0, COLORS.horizontal)
      // changing vertical arrow (green): screen y is inverted, so up is negative
      arrow(ballX, ballY, 0, -curVy * AR, COLORS.vertical)
      // resultant velocity (ink)
      arrow(ballX, ballY, vx * AR, -curVy * AR, COLORS.resultant, 1.5)

      // the ball
      ctx.fillStyle = COLORS.arc
      ctx.shadowColor = 'rgba(33,28,22,0.25)'
      ctx.shadowBlur = 6
      ctx.beginPath()
      ctx.arc(ballX, ballY, 7, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0

      if (startRef.current != null) {
        queueMicrotask(() => setReadout({ vx, vy: curVy }))
      }

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="h-56 w-full">
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      </div>

      <div className="border-y border-line bg-surface-2 px-3 py-2 text-center text-sm">
        <span style={{ color: COLORS.horizontal }} className="font-semibold">vₓ {readout.vx.toFixed(1)} m/s</span>
        <span className="mx-2 text-ink-soft">(constant)</span>
        <span style={{ color: COLORS.vertical }} className="font-semibold">v_y {readout.vy.toFixed(1)} m/s</span>
        <span className="mx-2 text-ink-soft">(changes with gravity)</span>
      </div>

      <div className="space-y-3 p-3">
        <Slider label="Angle" value={angle} min={10} max={80} unit="°" onChange={(v) => { setAngle(v); reset() }} />
        <Slider label="Launch speed" value={spd} min={8} max={30} unit="m/s" onChange={(v) => { setSpd(v); reset() }} />
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
