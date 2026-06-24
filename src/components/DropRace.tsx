import { useEffect, useRef, useState } from 'react'

interface Props {
  speed?: number
}

const H = 20 // drop height (m)
const G = 9.8
const T_FALL = Math.sqrt((2 * H) / G)
const PLAYBACK = 0.8 // slow motion factor for visibility

const COLORS = {
  skyTop: '#fffdf7',
  skyBottom: '#f1e8d6',
  ground: '#bd9e6a',
  groundFill: '#e7d6b3',
  dropped: '#2f2a22',
  thrown: '#d9600c',
  level: 'rgba(176,125,24,0.85)',
  strobe: 'rgba(33,28,22,0.18)',
}

/**
 * Releases a dropped ball and a horizontally-thrown ball at the same instant.
 * A single horizontal line stays glued to BOTH at every moment, making the
 * "they fall identically" idea something the learner watches happen.
 */
export default function DropRace({ speed = 16 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [spd, setSpd] = useState(speed)
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle')
  const startRef = useRef<number | null>(null)
  const params = useRef({ spd, phase })
  params.current = { spd, phase }

  const release = () => {
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

      const range = p.spd * T_FALL
      const worldW = Math.max(range * 1.12, 26)
      const worldH = H * 1.12

      const padL = 26
      const padR = 16
      const padT = 14
      const padB = 22
      const scale = Math.min((W - padL - padR) / worldW, (Hpx - padT - padB) / worldH)
      const originX = padL
      const originY = Hpx - padB
      const sx = (x: number) => originX + x * scale
      const sy = (y: number) => originY - y * scale

      // sky
      const sky = ctx.createLinearGradient(0, 0, 0, originY)
      sky.addColorStop(0, COLORS.skyTop)
      sky.addColorStop(1, COLORS.skyBottom)
      ctx.fillStyle = sky
      ctx.fillRect(0, 0, W, Hpx)

      // ground
      ctx.fillStyle = COLORS.groundFill
      ctx.fillRect(originX, originY, W - padR - originX, padB)
      ctx.strokeStyle = COLORS.ground
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(originX, originY)
      ctx.lineTo(W - padR, originY)
      ctx.stroke()

      // time
      let t = 0
      if (startRef.current != null) t = Math.min(((now - startRef.current) / 1000) * PLAYBACK, T_FALL)
      if (startRef.current != null && t >= T_FALL && p.phase === 'running') {
        // mark done (next tick React state flips; keep drawing final frame)
        queueMicrotask(() => setPhase('done'))
      }

      const yNow = Math.max(0, H - 0.5 * G * t * t)
      const xThrown = p.spd * t

      // platform/ledge the balls start on
      ctx.fillStyle = COLORS.dropped
      ctx.fillRect(originX - 6, sy(H) - 3, 18, 6)

      // strobe trail: positions every 0.25s up to now
      if (startRef.current != null) {
        for (let ti = 0.25; ti < t; ti += 0.25) {
          const yy = H - 0.5 * G * ti * ti
          if (yy < 0) break
          const xx = p.spd * ti
          // faint connector showing equal height
          ctx.strokeStyle = COLORS.strobe
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(sx(0), sy(yy))
          ctx.lineTo(sx(xx), sy(yy))
          ctx.stroke()
          ctx.fillStyle = COLORS.strobe
          ctx.beginPath()
          ctx.arc(sx(0), sy(yy), 2.5, 0, Math.PI * 2)
          ctx.fill()
          ctx.beginPath()
          ctx.arc(sx(xx), sy(yy), 2.5, 0, Math.PI * 2)
          ctx.fill()
        }

        // the live equal-height line through both balls
        ctx.strokeStyle = COLORS.level
        ctx.lineWidth = 1.5
        ctx.setLineDash([5, 4])
        ctx.beginPath()
        ctx.moveTo(sx(0), sy(yNow))
        ctx.lineTo(W - padR, sy(yNow))
        ctx.stroke()
        ctx.setLineDash([])
      }

      // dropped ball (x = 0)
      drawBall(ctx, sx(0), sy(yNow), COLORS.dropped)
      // thrown ball
      drawBall(ctx, sx(xThrown), sy(yNow), COLORS.thrown)

      // labels
      ctx.font = '10px Inter, sans-serif'
      ctx.fillStyle = COLORS.dropped
      ctx.textAlign = 'left'
      ctx.fillText('Dropped', sx(0) + 9, sy(H) - 8)
      ctx.fillStyle = COLORS.thrown
      ctx.fillText('Thrown →', sx(0) + 9, sy(H) + 6)

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
        {phase === 'idle' && <span className="text-ink-soft">Press release and watch their heights.</span>}
        {phase === 'running' && <span className="font-medium text-gold">Same height the whole way down ↔</span>}
        {phase === 'done' && <span className="font-semibold text-success-strong">They landed at the same instant ✓</span>}
      </div>

      <div className="space-y-3 p-3">
        <Slider label="Throw speed" value={spd} min={6} max={28} unit="m/s" onChange={(v) => { setSpd(v); reset() }} />
        <div className="flex gap-2">
          <button type="button" onClick={release} disabled={phase === 'running'} className="btn-primary flex-1 py-2.5">
            {phase === 'done' ? 'Replay' : 'Release both'}
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

function drawBall(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.fillStyle = color
  ctx.shadowColor = 'rgba(33,28,22,0.25)'
  ctx.shadowBlur = 6
  ctx.beginPath()
  ctx.arc(x, y, 7, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0
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
