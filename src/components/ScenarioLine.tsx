import { useEffect, useRef, useState } from 'react'

interface Props {
  /** Signed legs of the walk in meters: positive = east/right, negative = west/left. */
  legs?: number[]
  /** When false (a graded question not yet answered), hide the distance/displacement readout so the game doesn't reveal the answer. Defaults to revealed. */
  revealed?: boolean
}

const COLORS = {
  bg: '#fffdf7',
  track: '#e7d6b3',
  trackEdge: '#bd9e6a',
  tick: 'rgba(33,28,22,0.2)',
  text: '#6c6354',
  east: '#d9600c',
  west: '#1f8a4c',
  marker: '#211c16',
}

/**
 * A walk on a number line: the marker steps through the signed legs (east is
 * right/positive, west is left/negative), leaving a trail, while live readouts
 * show total distance travelled vs net displacement. Lets the learner picture a
 * "5 m east then 2 m west" scenario directly on a number line.
 */
export default function ScenarioLine({ legs = [5, -2], revealed = true }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle')
  const [readout, setReadout] = useState({ dist: 0, disp: 0 })
  const startRef = useRef<number | null>(null)
  const phaseRef = useRef(phase)
  phaseRef.current = phase

  // Cumulative positions at each leg boundary: [0, p1, p2, ...].
  const points = legs.reduce<number[]>((acc, leg) => [...acc, acc[acc.length - 1] + leg], [0])
  const totalDistance = legs.reduce((s, leg) => s + Math.abs(leg), 0)
  const finalDisp = points[points.length - 1]
  const SECONDS_PER_M = 0.18
  const totalTime = Math.max(0.6, totalDistance * SECONDS_PER_M)

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

    // Position along the walk at elapsed time t (seconds), interpolating legs.
    const posAt = (t: number) => {
      const frac = Math.min(1, t / totalTime)
      const target = frac * totalDistance
      let walked = 0
      for (let i = 0; i < legs.length; i++) {
        const len = Math.abs(legs[i])
        if (target <= walked + len) {
          const into = target - walked
          const dir = Math.sign(legs[i]) || 1
          return { x: points[i] + dir * into, dist: target }
        }
        walked += len
      }
      return { x: finalDisp, dist: totalDistance }
    }

    const draw = (now: number) => {
      const rect = canvas.getBoundingClientRect()
      const W = rect.width
      const Hpx = rect.height
      const padX = 26
      const lineY = Hpx * 0.5

      const lo = Math.min(0, ...points)
      const hi = Math.max(0, ...points)
      const pad = Math.max(2, (hi - lo) * 0.15)
      const xMin = lo - pad
      const xMax = hi + pad
      const span = xMax - xMin || 1
      const sx = (x: number) => padX + ((x - xMin) / span) * (W - 2 * padX)

      ctx.clearRect(0, 0, W, Hpx)
      ctx.fillStyle = COLORS.bg
      ctx.fillRect(0, 0, W, Hpx)

      // number line
      ctx.strokeStyle = COLORS.trackEdge
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(padX, lineY)
      ctx.lineTo(W - padX, lineY)
      ctx.stroke()

      // ticks every 1 m (or 5 m if wide)
      const stepM = span > 24 ? 5 : 1
      ctx.fillStyle = COLORS.text
      ctx.font = '9px Inter, sans-serif'
      ctx.textAlign = 'center'
      for (let x = Math.ceil(xMin / stepM) * stepM; x <= xMax; x += stepM) {
        ctx.strokeStyle = x === 0 ? COLORS.trackEdge : COLORS.tick
        ctx.beginPath()
        ctx.moveTo(sx(x), lineY - 6)
        ctx.lineTo(sx(x), lineY + 6)
        ctx.stroke()
        ctx.fillText(`${x}`, sx(x), lineY + 20)
      }
      ctx.fillStyle = COLORS.text
      ctx.fillText('start', sx(0), lineY - 12)

      let t = 0
      if (startRef.current != null) t = (now - startRef.current) / 1000
      if (startRef.current != null && t >= totalTime && phaseRef.current === 'running') {
        queueMicrotask(() => setPhase('done'))
      }
      const { x, dist } = posAt(t)

      // trail from 0 through the walked path
      ctx.strokeStyle = COLORS.east
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(sx(0), lineY)
      ctx.lineTo(sx(x), lineY)
      ctx.stroke()

      // marker
      ctx.fillStyle = COLORS.marker
      ctx.shadowColor = 'rgba(33,28,22,0.25)'
      ctx.shadowBlur = 6
      ctx.beginPath()
      ctx.arc(sx(x), lineY, 8, 0, Math.PI * 2)
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
  }, [legs, totalDistance, totalTime, finalDisp, points])

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="h-36 w-full">
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      </div>

      {revealed && (
        <div className="grid grid-cols-2 divide-x divide-line border-y border-line bg-surface-2 text-center">
          <div className="px-2 py-2">
            <p className="font-display text-base font-semibold text-ink">{Math.round(readout.dist)} m</p>
            <p className="text-[10px] text-ink-soft">Distance travelled</p>
          </div>
          <div className="px-2 py-2">
            <p className="font-display text-base font-semibold text-ink">{Math.round(readout.disp)} m</p>
            <p className="text-[10px] text-ink-soft">Displacement (from start)</p>
          </div>
        </div>
      )}

      <div className="flex gap-2 p-3">
        <button type="button" onClick={go} disabled={phase === 'running'} className="btn-primary flex-1 py-2.5">
          {phase === 'done' ? 'Walk again' : 'Walk it'}
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
  )
}
