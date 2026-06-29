import { useEffect, useRef, useState } from 'react'

interface Props {
  speed?: number
}

const TWO_PI = Math.PI * 2
const RATE = 0.3 // radians of lap per (m/s · s) — tunes how fast a lap plays

const COLORS = {
  bg: '#fffdf7',
  track: '#e7d6b3',
  trackEdge: '#bd9e6a',
  trail: 'rgba(217,96,12,0.45)',
  runner: '#d9600c',
  text: '#6c6354',
  start: '#1f8a4c',
}

/**
 * A runner laps a circular track and ends exactly where they started. However
 * fast they go, one full lap returns them to the start line — so the
 * displacement is zero and the average velocity over the lap is zero, even
 * though they ran the whole way around. No numeric readouts: the lesson here is
 * the return-to-start, seen rather than tallied.
 */
export default function RoundTrip({ speed = 8 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [s, setS] = useState(speed)
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle')
  const startRef = useRef<number | null>(null)
  const params = useRef({ s, phase })
  params.current = { s, phase }

  const go = () => {
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
      const H = rect.height
      const cx = W / 2
      const cy = H * 0.5
      const r = Math.min(W * 0.3, H * 0.34)

      // point on the circle: start at the top (12 o'clock), going clockwise
      const pt = (a: number) => ({ x: cx + r * Math.sin(a), y: cy - r * Math.cos(a) })

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = COLORS.bg
      ctx.fillRect(0, 0, W, H)

      // track band + edges
      ctx.lineWidth = 16
      ctx.strokeStyle = COLORS.track
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, TWO_PI)
      ctx.stroke()
      ctx.lineWidth = 1.5
      ctx.strokeStyle = COLORS.trackEdge
      ctx.beginPath()
      ctx.arc(cx, cy, r + 8, 0, TWO_PI)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(cx, cy, r - 8, 0, TWO_PI)
      ctx.stroke()

      // advance one lap based on speed
      let t = 0
      if (startRef.current != null) t = (now - startRef.current) / 1000
      let theta = startRef.current != null ? p.s * t * RATE : 0
      if (theta >= TWO_PI) {
        theta = TWO_PI
        if (p.phase === 'running') queueMicrotask(() => setPhase('done'))
      }

      // traversed trail along the arc
      if (theta > 0.001) {
        ctx.strokeStyle = COLORS.trail
        ctx.lineWidth = 14
        ctx.lineCap = 'round'
        ctx.beginPath()
        const steps = Math.max(2, Math.ceil(theta / 0.12))
        for (let i = 0; i <= steps; i++) {
          const q = pt((theta * i) / steps)
          if (i === 0) ctx.moveTo(q.x, q.y)
          else ctx.lineTo(q.x, q.y)
        }
        ctx.stroke()
      }

      // start / finish line at the top
      const top = pt(0)
      ctx.strokeStyle = COLORS.start
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(top.x, top.y - 11)
      ctx.lineTo(top.x, top.y + 11)
      ctx.stroke()
      ctx.fillStyle = COLORS.start
      ctx.font = '700 9px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('START / FINISH', top.x, top.y - 16)

      // runner
      const runner = pt(theta)
      ctx.fillStyle = 'rgba(33,28,22,0.18)'
      ctx.beginPath()
      ctx.ellipse(runner.x, runner.y + 9, 7, 2.5, 0, 0, TWO_PI)
      ctx.fill()
      ctx.fillStyle = COLORS.runner
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.arc(runner.x, runner.y, 7, 0, TWO_PI)
      ctx.fill()
      ctx.stroke()

      // qualitative status (no numbers)
      ctx.fillStyle = COLORS.text
      ctx.font = '11px Inter, sans-serif'
      ctx.textAlign = 'center'
      const msg =
        p.phase === 'done'
          ? 'One full lap — finished right where it started.'
          : startRef.current != null
            ? 'Running the lap…'
            : 'Press Go to run one full lap.'
      ctx.fillText(msg, cx, H - 6)

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

      <div className="space-y-3 border-t border-line p-3">
        <div>
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="font-medium text-ink-soft">Speed</span>
            <span className="font-mono font-semibold text-brand">{s} m/s</span>
          </div>
          <input type="range" min={4} max={12} step={1} value={s} onChange={(e) => { setS(Number(e.target.value)); reset() }} />
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={go} disabled={phase === 'running'} className="btn-primary flex-1 py-2.5">
            {phase === 'done' ? 'Go again' : 'Go'}
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
