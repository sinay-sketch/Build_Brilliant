import { useEffect, useRef, useState } from 'react'

interface Props {
  velocity?: number
}

const T_MAX = 5 // seconds shown on the graph
const PLAYBACK = 0.9

const COLORS = {
  grid: 'rgba(33,28,22,0.08)',
  axis: '#bd9e6a',
  line: '#d9600c',
  lineFaint: 'rgba(217,96,12,0.25)',
  dot: '#211c16',
  text: '#6c6354',
}

/**
 * Position-vs-time grapher. The learner sets a constant velocity and watches a
 * dot trace a straight line whose SLOPE is the velocity: steeper = faster,
 * downhill = moving backward. Makes "velocity is the slope of position-time"
 * something you see, not memorize.
 */
export default function MotionGraph({ velocity = 4 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [v, setV] = useState(velocity)
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle')
  const startRef = useRef<number | null>(null)
  const params = useRef({ v, phase })
  params.current = { v, phase }

  const play = () => {
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
      const padL = 34
      const padR = 14
      const padT = 14
      const padB = 24

      // FIXED scale (m): the same for every velocity, so a steeper slope always
      // means a larger velocity. Covers the full slider range (-6..12 over 5 s).
      const POS_MIN = -30
      const POS_MAX = 60
      const span = POS_MAX - POS_MIN
      const xEnd = p.v * T_MAX

      const sx = (t: number) => padL + (t / T_MAX) * (W - padL - padR)
      const sy = (x: number) => padT + (1 - (x - POS_MIN) / span) * (Hpx - padT - padB)

      ctx.clearRect(0, 0, W, Hpx)
      ctx.fillStyle = '#fffdf7'
      ctx.fillRect(0, 0, W, Hpx)

      // horizontal gridlines with position labels (fixed scale)
      ctx.font = '9px Inter, sans-serif'
      for (let x = POS_MIN; x <= POS_MAX; x += 15) {
        ctx.strokeStyle = x === 0 ? COLORS.axis : COLORS.grid
        ctx.lineWidth = x === 0 ? 1.5 : 1
        ctx.beginPath()
        ctx.moveTo(padL, sy(x))
        ctx.lineTo(W - padR, sy(x))
        ctx.stroke()
        ctx.fillStyle = COLORS.text
        ctx.textAlign = 'right'
        ctx.fillText(x === POS_MAX ? `${x} m` : `${x}`, padL - 4, sy(x) + 3)
      }

      // vertical gridlines (time)
      ctx.strokeStyle = COLORS.grid
      ctx.lineWidth = 1
      ctx.textAlign = 'center'
      for (let t = 0; t <= T_MAX; t++) {
        ctx.beginPath()
        ctx.moveTo(sx(t), padT)
        ctx.lineTo(sx(t), Hpx - padB)
        ctx.stroke()
        ctx.fillStyle = COLORS.text
        ctx.fillText(`${t}s`, sx(t), Hpx - padB + 13)
      }

      // full faint line for the chosen velocity
      ctx.strokeStyle = COLORS.lineFaint
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(sx(0), sy(0))
      ctx.lineTo(sx(T_MAX), sy(xEnd))
      ctx.stroke()

      // time
      let t = 0
      if (startRef.current != null) t = Math.min(((now - startRef.current) / 1000) * PLAYBACK, T_MAX)
      if (startRef.current != null && t >= T_MAX && p.phase === 'running') {
        queueMicrotask(() => setPhase('done'))
      }

      // traced portion
      const xNow = p.v * t
      ctx.strokeStyle = COLORS.line
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(sx(0), sy(0))
      ctx.lineTo(sx(t), sy(xNow))
      ctx.stroke()

      // moving dot
      ctx.fillStyle = COLORS.dot
      ctx.beginPath()
      ctx.arc(sx(t), sy(xNow), 5, 0, Math.PI * 2)
      ctx.fill()

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  const slopeWord = v > 0 ? 'rising (moving forward)' : v < 0 ? 'falling (moving backward)' : 'flat (at rest)'

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="h-52 w-full">
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      </div>

      <div className="border-y border-line bg-surface-2 px-3 py-2 text-center text-sm">
        <span className="text-ink-soft">Slope of the line = velocity = </span>
        <span className="font-mono font-semibold text-brand">{v} m/s</span>
        <span className="text-ink-soft"> — the line is {slopeWord}.</span>
      </div>

      <div className="space-y-3 p-3">
        <Slider label="Velocity" value={v} min={-6} max={12} unit=" m/s" onChange={(val) => { setV(val); reset() }} />
        <div className="flex gap-2">
          <button type="button" onClick={play} disabled={phase === 'running'} className="btn-primary flex-1 py-2.5">
            {phase === 'done' ? 'Replay' : 'Play'}
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
          {value}
          {unit}
        </span>
      </div>
      <input type="range" min={min} max={max} step={1} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  )
}
