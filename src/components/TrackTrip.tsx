import { useEffect, useRef, useState } from 'react'

interface Props {
  velocity?: number
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
  trail: 'rgba(217,96,12,0.25)',
}

/**
 * A runner on a track. Set a velocity and press Go: the dot moves in real time
 * (left for negative velocity), with a live position readout. Same idea as the
 * position-time graph, shown as actual motion instead of a line, so the two
 * widgets feel different.
 */
export default function TrackTrip({ velocity = 5 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [v, setV] = useState(velocity)
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle')
  const [posReadout, setPosReadout] = useState(0)
  const startRef = useRef<number | null>(null)
  const params = useRef({ v, phase })
  params.current = { v, phase }

  const go = () => {
    startRef.current = performance.now()
    setPhase('running')
  }
  const reset = () => {
    startRef.current = null
    setPhase('idle')
    setPosReadout(0)
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

      // World extent: cover both directions so negative velocity is visible.
      const reach = Math.max(Math.abs(p.v) * T_MAX, 10)
      const xMin = Math.min(0, -reach * 0.15)
      const xMax = Math.max(reach * 1.05, 10)
      const span = xMax - xMin || 1
      const sx = (x: number) => padX + ((x - xMin) / span) * (W - 2 * padX)

      ctx.clearRect(0, 0, W, Hpx)
      ctx.fillStyle = COLORS.sky
      ctx.fillRect(0, 0, W, Hpx)

      // road
      ctx.fillStyle = COLORS.road
      ctx.fillRect(padX, roadY - 14, W - 2 * padX, 28)
      ctx.strokeStyle = COLORS.roadEdge
      ctx.lineWidth = 1.5
      ctx.strokeRect(padX, roadY - 14, W - 2 * padX, 28)

      // distance ticks every 10 m
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

      // start flag at x = 0
      ctx.strokeStyle = COLORS.roadEdge
      ctx.beginPath()
      ctx.moveTo(sx(0), roadY - 22)
      ctx.lineTo(sx(0), roadY - 14)
      ctx.stroke()

      let t = 0
      if (startRef.current != null) t = Math.min(((now - startRef.current) / 1000) * PLAYBACK, T_MAX)
      if (startRef.current != null && t >= T_MAX && p.phase === 'running') {
        queueMicrotask(() => setPhase('done'))
      }
      const x = p.v * t

      // trail
      ctx.strokeStyle = COLORS.trail
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(sx(0), roadY)
      ctx.lineTo(sx(x), roadY)
      ctx.stroke()

      // runner
      ctx.fillStyle = COLORS.runner
      ctx.shadowColor = 'rgba(33,28,22,0.25)'
      ctx.shadowBlur = 6
      ctx.beginPath()
      ctx.arc(sx(x), roadY, 8, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0

      if (startRef.current != null) {
        queueMicrotask(() => setPosReadout(x))
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
      <div className="h-44 w-full">
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      </div>

      <div className="border-y border-line bg-surface-2 px-3 py-2 text-center text-sm">
        <span className="text-ink-soft">Position: </span>
        <span className="font-mono font-semibold text-brand">{Math.round(posReadout)} m</span>
        <span className="text-ink-soft"> at {v} m/s</span>
      </div>

      <div className="space-y-3 p-3">
        <div>
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="font-medium text-ink-soft">Velocity</span>
            <span className="font-mono font-semibold text-brand">{v} m/s</span>
          </div>
          <input type="range" min={-6} max={12} step={1} value={v} onChange={(e) => { setV(Number(e.target.value)); reset() }} />
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
