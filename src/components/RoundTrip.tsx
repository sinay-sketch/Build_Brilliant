import { useEffect, useRef, useState } from 'react'

interface Props {
  speed?: number
}

const T_MAX = 5
const PLAYBACK = 0.9

const COLORS = {
  sky: '#fffdf7',
  road: '#e7d6b3',
  roadEdge: '#bd9e6a',
  tick: 'rgba(33,28,22,0.18)',
  text: '#6c6354',
  runner: '#d9600c',
  trailOut: 'rgba(217,96,12,0.25)',
  trailBack: 'rgba(31,138,76,0.3)',
}

/**
 * A runner goes out and comes back. It sprints right for half the trip then
 * retraces its steps left at the same speed. The two readouts diverge: distance
 * traveled keeps climbing, but displacement swings back to ~0 — so the average
 * velocity over the whole round trip is essentially nothing.
 */
export default function RoundTrip({ speed = 8 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [s, setS] = useState(speed)
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle')
  const [readout, setReadout] = useState({ dist: 0, disp: 0 })
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
    setReadout({ dist: 0, disp: 0 })
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
      const padX = 24
      const roadY = Hpx * 0.55

      const half = T_MAX / 2
      const turn = p.s * half // farthest point reached
      const xMax = Math.max(turn * 1.1, 10)
      const xMin = Math.min(0, -turn * 0.1)
      const span = xMax - xMin || 1
      const sx = (x: number) => padX + ((x - xMin) / span) * (W - 2 * padX)

      ctx.clearRect(0, 0, W, Hpx)
      ctx.fillStyle = COLORS.sky
      ctx.fillRect(0, 0, W, Hpx)

      ctx.fillStyle = COLORS.road
      ctx.fillRect(padX, roadY - 14, W - 2 * padX, 28)
      ctx.strokeStyle = COLORS.roadEdge
      ctx.lineWidth = 1.5
      ctx.strokeRect(padX, roadY - 14, W - 2 * padX, 28)

      ctx.fillStyle = COLORS.text
      ctx.font = '9px Inter, sans-serif'
      ctx.textAlign = 'center'
      const step = span > 80 ? 20 : 10
      for (let x = Math.ceil(xMin / step) * step; x <= xMax; x += step) {
        ctx.strokeStyle = COLORS.tick
        ctx.beginPath()
        ctx.moveTo(sx(x), roadY - 14)
        ctx.lineTo(sx(x), roadY + 14)
        ctx.stroke()
        ctx.fillText(`${x}`, sx(x), roadY + 26)
      }

      // turnaround marker
      ctx.strokeStyle = COLORS.roadEdge
      ctx.beginPath()
      ctx.moveTo(sx(turn), roadY - 22)
      ctx.lineTo(sx(turn), roadY - 14)
      ctx.stroke()

      let t = 0
      if (startRef.current != null) t = Math.min(((now - startRef.current) / 1000) * PLAYBACK, T_MAX)
      if (startRef.current != null && t >= T_MAX && p.phase === 'running') {
        queueMicrotask(() => setPhase('done'))
      }

      const goingBack = t > half
      const x = goingBack ? turn - p.s * (t - half) : p.s * t
      const dist = p.s * t

      // outbound trail (orange) then inbound trail (green) overlaid
      ctx.strokeStyle = COLORS.trailOut
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(sx(0), roadY)
      ctx.lineTo(sx(goingBack ? turn : x), roadY)
      ctx.stroke()
      if (goingBack) {
        ctx.strokeStyle = COLORS.trailBack
        ctx.beginPath()
        ctx.moveTo(sx(turn), roadY - 5)
        ctx.lineTo(sx(x), roadY - 5)
        ctx.stroke()
      }

      // direction arrow above runner
      if (startRef.current != null && p.phase === 'running') {
        const dir = goingBack ? -1 : 1
        const ax = sx(x)
        ctx.fillStyle = goingBack ? '#1f8a4c' : COLORS.runner
        ctx.beginPath()
        ctx.moveTo(ax + dir * 14, roadY - 22)
        ctx.lineTo(ax + dir * 4, roadY - 27)
        ctx.lineTo(ax + dir * 4, roadY - 17)
        ctx.closePath()
        ctx.fill()
      }

      ctx.fillStyle = COLORS.runner
      ctx.shadowColor = 'rgba(33,28,22,0.25)'
      ctx.shadowBlur = 6
      ctx.beginPath()
      ctx.arc(sx(x), roadY, 8, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0

      if (startRef.current != null) {
        queueMicrotask(() => setReadout({ dist, disp: x }))
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
      <div className="h-48 w-full">
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      </div>

      <div className="grid grid-cols-2 divide-x divide-line border-y border-line bg-surface-2 text-center">
        <div className="px-2 py-2">
          <p className="font-display text-base font-semibold text-brand">{Math.round(readout.dist)} m</p>
          <p className="text-[10px] leading-tight text-ink-soft">Distance traveled</p>
        </div>
        <div className="px-2 py-2">
          <p className="font-display text-base font-semibold text-ink">{Math.round(readout.disp)} m</p>
          <p className="text-[10px] leading-tight text-ink-soft">Displacement</p>
        </div>
      </div>

      <div className="space-y-3 p-3">
        <div>
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="font-medium text-ink-soft">Speed</span>
            <span className="font-mono font-semibold text-brand">{s} m/s</span>
          </div>
          <input type="range" min={2} max={14} step={1} value={s} onChange={(e) => { setS(Number(e.target.value)); reset() }} />
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
