import { useEffect, useRef, useState } from 'react'

interface Props {
  v1?: number
  v2?: number
}

const T_MAX = 5
const PLAYBACK = 0.9

const COLORS = {
  sky: '#fffdf7',
  road: '#e7d6b3',
  roadEdge: '#bd9e6a',
  tick: 'rgba(33,28,22,0.18)',
  text: '#6c6354',
  runnerA: '#d9600c',
  runnerB: '#1f8a4c',
  trailA: 'rgba(217,96,12,0.25)',
  trailB: 'rgba(31,138,76,0.25)',
}

/**
 * Two runners on parallel tracks. Give each a velocity (positive = right,
 * negative = left) and press Go. With equal speeds but opposite signs the dots
 * cover the same distance yet end at opposite displacements — the difference
 * between speed and velocity, made literal.
 */
export default function TwoRunners({ v1 = 6, v2 = -4 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [vA, setVA] = useState(v1)
  const [vB, setVB] = useState(v2)
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle')
  const [pos, setPos] = useState({ a: 0, b: 0 })
  const startRef = useRef<number | null>(null)
  const params = useRef({ vA, vB, phase })
  params.current = { vA, vB, phase }

  const go = () => {
    startRef.current = performance.now()
    setPhase('running')
  }
  const reset = () => {
    startRef.current = null
    setPhase('idle')
    setPos({ a: 0, b: 0 })
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
      const rowA = Hpx * 0.36
      const rowB = Hpx * 0.7

      // Shared world scale covering both runners in both directions.
      const reach = Math.max(Math.abs(p.vA) * T_MAX, Math.abs(p.vB) * T_MAX, 10)
      const xMin = Math.min(0, -reach * 1.05)
      const xMax = Math.max(0, reach * 1.05)
      const span = xMax - xMin || 1
      const sx = (x: number) => padX + ((x - xMin) / span) * (W - 2 * padX)

      ctx.clearRect(0, 0, W, Hpx)
      ctx.fillStyle = COLORS.sky
      ctx.fillRect(0, 0, W, Hpx)

      let t = 0
      if (startRef.current != null) t = Math.min(((now - startRef.current) / 1000) * PLAYBACK, T_MAX)
      if (startRef.current != null && t >= T_MAX && p.phase === 'running') {
        queueMicrotask(() => setPhase('done'))
      }
      const xA = p.vA * t
      const xB = p.vB * t

      const drawRow = (rowY: number, x: number, road: string, trail: string, runner: string) => {
        ctx.fillStyle = COLORS.road
        ctx.fillRect(padX, rowY - 11, W - 2 * padX, 22)
        ctx.strokeStyle = road
        ctx.lineWidth = 1.5
        ctx.strokeRect(padX, rowY - 11, W - 2 * padX, 22)

        const step = span > 80 ? 20 : 10
        ctx.fillStyle = COLORS.text
        ctx.font = '9px Inter, sans-serif'
        ctx.textAlign = 'center'
        for (let xt = Math.ceil(xMin / step) * step; xt <= xMax; xt += step) {
          ctx.strokeStyle = COLORS.tick
          ctx.beginPath()
          ctx.moveTo(sx(xt), rowY - 11)
          ctx.lineTo(sx(xt), rowY + 11)
          ctx.stroke()
          ctx.fillText(`${xt}`, sx(xt), rowY + 22)
        }

        ctx.strokeStyle = trail
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(sx(0), rowY)
        ctx.lineTo(sx(x), rowY)
        ctx.stroke()

        ctx.fillStyle = runner
        ctx.shadowColor = 'rgba(33,28,22,0.25)'
        ctx.shadowBlur = 6
        ctx.beginPath()
        ctx.arc(sx(x), rowY, 8, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
      }

      drawRow(rowA, xA, COLORS.roadEdge, COLORS.trailA, COLORS.runnerA)
      drawRow(rowB, xB, COLORS.roadEdge, COLORS.trailB, COLORS.runnerB)

      if (startRef.current != null) {
        queueMicrotask(() => setPos({ a: xA, b: xB }))
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
      <div className="h-52 w-full">
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      </div>

      <div className="border-y border-line bg-surface-2 px-3 py-2 text-center text-sm">
        <span className="font-semibold text-brand">A: {Math.round(pos.a)} m</span>
        <span className="text-ink-soft"> · </span>
        <span className="font-semibold" style={{ color: COLORS.runnerB }}>B: {Math.round(pos.b)} m</span>
      </div>

      <div className="space-y-3 p-3">
        <div>
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="font-medium text-brand">Runner A</span>
            <span className="font-mono font-semibold text-brand">{vA} m/s</span>
          </div>
          <input type="range" min={-6} max={12} step={1} value={vA} onChange={(e) => { setVA(Number(e.target.value)); reset() }} />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="font-medium" style={{ color: COLORS.runnerB }}>Runner B</span>
            <span className="font-mono font-semibold" style={{ color: COLORS.runnerB }}>{vB} m/s</span>
          </div>
          <input type="range" min={-6} max={12} step={1} value={vB} onChange={(e) => { setVB(Number(e.target.value)); reset() }} />
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
