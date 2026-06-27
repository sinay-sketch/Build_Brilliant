import { useEffect, useRef, useState } from 'react'

interface Props {
  height?: number
}

const PLAYBACK = 0.55 // slow it down so the speed-up is visible

const COLORS = {
  skyTop: '#fffdf7',
  skyBottom: '#f1e8d6',
  ground: '#bd9e6a',
  groundFill: '#e7d6b3',
  ball: '#d9600c',
  strobe: 'rgba(33,28,22,0.16)',
  tower: '#cdbf9f',
}

type Body = { name: string; g: number }
const BODIES: Body[] = [
  { name: 'Earth', g: 9.8 },
  { name: 'Moon', g: 1.62 },
]

/**
 * A drop tower: release a ball and watch the live readouts for time, speed
 * (v = g·t) and distance fallen (d = ½g·t²). Strobe marks every 0.2 s spread
 * further apart as it accelerates. Toggle Earth/Moon gravity to feel how g
 * changes everything. No cannon in sight.
 */
export default function DropTower({ height = 45 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [bodyIdx, setBodyIdx] = useState(0)
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle')
  const [readout, setReadout] = useState({ t: 0, v: 0, d: 0 })
  const startRef = useRef<number | null>(null)
  const H = height
  const params = useRef({ g: BODIES[bodyIdx].g, phase })
  params.current = { g: BODIES[bodyIdx].g, phase }

  const drop = () => {
    startRef.current = performance.now()
    setPhase('running')
  }
  const reset = () => {
    startRef.current = null
    setPhase('idle')
    setReadout({ t: 0, v: 0, d: 0 })
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
      const padT = 16
      const padB = 22
      const tFall = Math.sqrt((2 * H) / p.g)
      const sy = (d: number) => padT + (d / H) * (Hpx - padT - padB)
      const ballX = W * 0.5

      ctx.clearRect(0, 0, W, Hpx)
      const sky = ctx.createLinearGradient(0, 0, 0, Hpx)
      sky.addColorStop(0, COLORS.skyTop)
      sky.addColorStop(1, COLORS.skyBottom)
      ctx.fillStyle = sky
      ctx.fillRect(0, 0, W, Hpx)

      // tower on the left edge of the drop line
      ctx.fillStyle = COLORS.tower
      ctx.fillRect(ballX - 26, padT - 6, 10, Hpx - padT - padB + 6)

      // ground
      ctx.fillStyle = COLORS.groundFill
      ctx.fillRect(0, Hpx - padB, W, padB)
      ctx.strokeStyle = COLORS.ground
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(0, Hpx - padB)
      ctx.lineTo(W, Hpx - padB)
      ctx.stroke()

      let t = 0
      if (startRef.current != null) t = Math.min(((now - startRef.current) / 1000) * PLAYBACK, tFall)
      if (startRef.current != null && t >= tFall && p.phase === 'running') {
        queueMicrotask(() => setPhase('done'))
      }

      const d = Math.min(H, 0.5 * p.g * t * t)

      // strobe marks every 0.2 s (real time) — gaps grow as it speeds up
      if (startRef.current != null) {
        for (let ti = 0.2; ti < t; ti += 0.2) {
          const dd = 0.5 * p.g * ti * ti
          if (dd > H) break
          ctx.fillStyle = COLORS.strobe
          ctx.beginPath()
          ctx.arc(ballX, sy(dd), 4, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // the ball
      ctx.fillStyle = COLORS.ball
      ctx.shadowColor = 'rgba(33,28,22,0.25)'
      ctx.shadowBlur = 6
      ctx.beginPath()
      ctx.arc(ballX, sy(d), 9, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0

      if (startRef.current != null) {
        const v = p.g * t
        // throttle React updates a touch
        queueMicrotask(() => setReadout({ t, v, d }))
      }

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [H])

  const body = BODIES[bodyIdx]

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="h-56 w-full">
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      </div>

      <div className="grid grid-cols-3 divide-x divide-line border-y border-line bg-surface-2 text-center">
        <Readout label="Time" value={`${readout.t.toFixed(1)} s`} />
        <Readout label="Speed (v = g·t)" value={`${readout.v.toFixed(1)} m/s`} />
        <Readout label="Fallen (½g·t²)" value={`${readout.d.toFixed(1)} m`} />
      </div>

      <div className="space-y-3 p-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-ink-soft">Gravity:</span>
          {BODIES.map((b, i) => (
            <button
              key={b.name}
              type="button"
              onClick={() => { setBodyIdx(i); reset() }}
              className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition ${
                i === bodyIdx ? 'border-brand bg-brand-tint text-brand-strong' : 'border-line bg-surface text-ink-soft hover:border-brand/40'
              }`}
            >
              {b.name} ({b.g})
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={drop} disabled={phase === 'running'} className="btn-primary flex-1 py-2.5">
            {phase === 'done' ? 'Drop again' : `Drop on ${body.name}`}
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

function Readout({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-2 py-2">
      <p className="font-display text-base font-semibold text-ink">{value}</p>
      <p className="text-[10px] leading-tight text-ink-soft">{label}</p>
    </div>
  )
}
