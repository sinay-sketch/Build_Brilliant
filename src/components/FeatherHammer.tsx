import { useEffect, useRef, useState } from 'react'

const H = 30 // drop height (m)
const G = 9.8
const PLAYBACK = 0.5 // slow motion so the race is watchable
const V_TERM = 1.4 // feather's slow terminal drift in air (m/s)

const COLORS = {
  skyTop: '#fffdf7',
  skyBottom: '#f1e8d6',
  ground: '#bd9e6a',
  groundFill: '#e7d6b3',
  hammer: '#211c16',
  feather: '#d9600c',
  tower: '#cdbf9f',
}

/**
 * A feather and a hammer dropped from the same height. In a vacuum (Air: Off)
 * gravity is the only force, so both land together. Turn Air: On and drag holds
 * the feather to a slow terminal drift while the hammer plummets — proving it
 * was air resistance, never gravity, that ever separated them.
 */
export default function FeatherHammer() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [air, setAir] = useState(false)
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle')
  const startRef = useRef<number | null>(null)
  const params = useRef({ air, phase })
  params.current = { air, phase }

  const drop = () => {
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
      const padT = 16
      const padB = 22
      const sy = (d: number) => padT + (d / H) * (Hpx - padT - padB)
      const hammerX = W * 0.38
      const featherX = W * 0.62

      // fall times for each object under the current air setting
      const tHammer = Math.sqrt((2 * H) / G)
      const tFeather = p.air ? H / V_TERM : tHammer
      const tEnd = Math.max(tHammer, tFeather)

      ctx.clearRect(0, 0, W, Hpx)
      const sky = ctx.createLinearGradient(0, 0, 0, Hpx)
      sky.addColorStop(0, COLORS.skyTop)
      sky.addColorStop(1, COLORS.skyBottom)
      ctx.fillStyle = sky
      ctx.fillRect(0, 0, W, Hpx)

      // ledges the objects start on
      ctx.fillStyle = COLORS.tower
      ctx.fillRect(hammerX - 16, padT - 6, 32, 6)
      ctx.fillRect(featherX - 16, padT - 6, 32, 6)

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
      if (startRef.current != null) t = Math.min(((now - startRef.current) / 1000) * PLAYBACK, tEnd)
      if (startRef.current != null && t >= tEnd && p.phase === 'running') {
        queueMicrotask(() => setPhase('done'))
      }

      // hammer always falls under gravity; feather drifts at terminal v in air
      const dHammer = Math.min(H, 0.5 * G * Math.min(t, tHammer) ** 2)
      const dFeather = p.air
        ? Math.min(H, V_TERM * t)
        : Math.min(H, 0.5 * G * Math.min(t, tFeather) ** 2)

      // hammer
      ctx.fillStyle = COLORS.hammer
      ctx.shadowColor = 'rgba(33,28,22,0.25)'
      ctx.shadowBlur = 6
      ctx.beginPath()
      ctx.arc(hammerX, sy(dHammer), 11, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0

      // feather (smaller)
      ctx.fillStyle = COLORS.feather
      ctx.shadowColor = 'rgba(33,28,22,0.2)'
      ctx.shadowBlur = 5
      ctx.beginPath()
      ctx.arc(featherX, sy(dFeather), 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0

      // labels
      ctx.font = '10px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillStyle = COLORS.hammer
      ctx.fillText('Hammer', hammerX, padT - 10)
      ctx.fillStyle = COLORS.feather
      ctx.fillText('Feather', featherX, padT - 10)

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
        {phase === 'idle' && <span className="text-ink-soft">Same height, same gravity. Does air change the race?</span>}
        {phase === 'running' && (
          <span className="font-medium text-gold">{air ? 'Air drags the feather back ↓' : 'Vacuum — no air to slow anything ↓'}</span>
        )}
        {phase === 'done' && (
          <span className="font-semibold text-success-strong">
            {air ? 'With air, the hammer wins — drag held the feather' : 'In a vacuum they land together ✓'}
          </span>
        )}
      </div>

      <div className="space-y-3 p-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-ink-soft">Air:</span>
          {[
            { label: 'Off', on: false },
            { label: 'On', on: true },
          ].map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => { setAir(opt.on); reset() }}
              className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition ${
                opt.on === air ? 'border-brand bg-brand-tint text-brand-strong' : 'border-line bg-surface text-ink-soft hover:border-brand/40'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={drop} disabled={phase === 'running'} className="btn-primary flex-1 py-2.5">
            {phase === 'done' ? 'Drop again' : 'Drop both'}
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
