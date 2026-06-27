import { useEffect, useRef, useState } from 'react'

interface Props {
  /** Distance of the trip in meters (the displacement Δx). */
  distance?: number
  /** Duration of the trip in seconds (Δt). */
  time?: number
}

const DIST_MIN = 20
const DIST_MAX = 200
const DIST_STEP = 10
const TIME_MIN = 5
const TIME_MAX = 40
const TIME_STEP = 5
const SPEEDUP = 8 // virtual seconds per real second of playback

const COLORS = {
  bg: '#fffdf7',
  road: '#e7d6b3',
  roadEdge: '#bd9e6a',
  tick: 'rgba(33,28,22,0.18)',
  text: '#6c6354',
  mute: '#9b9281',
  rider: '#d9600c',
  trail: 'rgba(217,96,12,0.28)',
  start: '#1f8a4c',
  flag: '#211c16',
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

/**
 * Average velocity = displacement ÷ time, made concrete. A rider covers a set
 * distance over a set time while a clock ticks, so the learner watches Δx and Δt
 * grow together. The formula v_avg = Δx ÷ Δt is shown but deliberately NOT
 * evaluated — the learner computes the result, so the game models the method
 * without giving the numeric answer away.
 */
export default function AvgVelocityTrip({ distance = 90, time = 15 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dist, setDist] = useState(() => clamp(Math.round(distance), DIST_MIN, DIST_MAX))
  const [time_, setTime] = useState(() => clamp(Math.round(time), TIME_MIN, TIME_MAX))
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle')
  const [readout, setReadout] = useState({ covered: 0, elapsed: 0 })
  const startRef = useRef<number | null>(null)
  const params = useRef({ dist, time: time_, phase })
  params.current = { dist, time: time_, phase }

  const go = () => {
    startRef.current = performance.now()
    setPhase('running')
  }
  const reset = () => {
    startRef.current = null
    setPhase('idle')
    setReadout({ covered: 0, elapsed: 0 })
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
      const padL = 28
      const padR = 30
      const roadY = H * 0.58
      const trackW = W - padL - padR
      const sx = (x: number) => padL + (x / p.dist) * trackW

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = COLORS.bg
      ctx.fillRect(0, 0, W, H)

      // ---- advance virtual time ----
      let t = 0
      if (startRef.current != null) t = Math.min(((now - startRef.current) / 1000) * SPEEDUP, p.time)
      if (startRef.current != null && t >= p.time && p.phase === 'running') {
        queueMicrotask(() => {
          setPhase('done')
          setReadout({ covered: p.dist, elapsed: p.time })
        })
      }
      const frac = p.time > 0 ? t / p.time : 0
      const covered = p.dist * frac

      // labels: TRIP + live clock
      ctx.fillStyle = COLORS.mute
      ctx.font = '700 9px Inter, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('THE TRIP', padL, 14)
      ctx.textAlign = 'right'
      ctx.fillStyle = COLORS.text
      ctx.font = '700 12px Inter, sans-serif'
      const shownT = startRef.current != null ? t : 0
      ctx.fillText(`⏱ ${shownT.toFixed(1)} s`, W - padR, 14)

      // road
      ctx.fillStyle = COLORS.road
      ctx.fillRect(padL, roadY - 13, trackW, 26)
      ctx.strokeStyle = COLORS.roadEdge
      ctx.lineWidth = 1.5
      ctx.strokeRect(padL, roadY - 13, trackW, 26)

      // distance ticks
      const step = p.dist <= 60 ? 10 : p.dist <= 120 ? 20 : 40
      ctx.font = '9px Inter, sans-serif'
      ctx.textAlign = 'center'
      for (let x = 0; x <= p.dist + 0.001; x += step) {
        ctx.strokeStyle = COLORS.tick
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(sx(x), roadY - 13)
        ctx.lineTo(sx(x), roadY + 13)
        ctx.stroke()
        ctx.fillStyle = COLORS.mute
        ctx.fillText(`${x}`, sx(x), roadY + 25)
      }

      // start flag
      ctx.strokeStyle = COLORS.start
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(sx(0), roadY - 13)
      ctx.lineTo(sx(0), roadY - 30)
      ctx.stroke()
      ctx.fillStyle = COLORS.start
      ctx.beginPath()
      ctx.moveTo(sx(0), roadY - 30)
      ctx.lineTo(sx(0) + 11, roadY - 26)
      ctx.lineTo(sx(0), roadY - 22)
      ctx.closePath()
      ctx.fill()

      // finish flag (checkered) at the target distance
      const fx = sx(p.dist)
      ctx.strokeStyle = COLORS.flag
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(fx, roadY - 13)
      ctx.lineTo(fx, roadY - 32)
      ctx.stroke()
      const cs = 4
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 3; c++) {
          ctx.fillStyle = (r + c) % 2 === 0 ? COLORS.flag : '#fff'
          ctx.fillRect(fx + c * cs, roadY - 32 + r * cs, cs, cs)
        }
      }

      // trail + rider
      ctx.strokeStyle = COLORS.trail
      ctx.lineWidth = 4
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(sx(0), roadY)
      ctx.lineTo(sx(covered), roadY)
      ctx.stroke()

      const rx = sx(covered)
      ctx.fillStyle = 'rgba(33,28,22,0.18)'
      ctx.beginPath()
      ctx.ellipse(rx, roadY + 9, 8, 2.5, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = COLORS.rider
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.arc(rx, roadY, 8, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()

      // live distance above the rider
      ctx.fillStyle = COLORS.rider
      ctx.font = '700 11px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`${Math.round(covered)} m`, rx, roadY - 16)

      if (p.phase === 'running') {
        queueMicrotask(() => setReadout({ covered, elapsed: t }))
      }

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  const live = phase !== 'idle'
  const shownDist = live ? readout.covered : dist
  const shownTime = live ? readout.elapsed : time_

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="h-44 w-full">
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      </div>

      <div className="grid grid-cols-2 divide-x divide-line border-y border-line bg-surface-2 text-center">
        <Stat value={`${Math.round(shownDist)} m`} label="Distance Δx" />
        <Stat value={`${shownTime.toFixed(1)} s`} label="Time Δt" />
      </div>

      <p className="border-b border-line bg-brand-tint/60 px-3 py-1.5 text-center text-xs text-ink-soft">
        <span className="font-mono">v_avg = Δx ÷ Δt</span>
        <span className="ml-2 text-ink-mute">(average velocity)</span>
      </p>

      <div className="space-y-3 p-3">
        <Slider label="Distance (Δx)" value={dist} min={DIST_MIN} max={DIST_MAX} step={DIST_STEP} unit=" m" onChange={(val) => { setDist(val); reset() }} />
        <Slider label="Time (Δt)" value={time_} min={TIME_MIN} max={TIME_MAX} step={TIME_STEP} unit=" s" onChange={(val) => { setTime(val); reset() }} />
        <div className="flex gap-2">
          <button type="button" onClick={go} disabled={phase === 'running'} className="btn-primary flex-1 py-2.5">
            {phase === 'done' ? 'Ride again' : 'Ride'}
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

function Stat({ value, label, highlight }: { value: string; label: string; highlight?: boolean }) {
  return (
    <div className="px-2 py-2">
      <p className={`font-display text-base font-semibold ${highlight ? 'text-brand' : 'text-ink'}`}>{value}</p>
      <p className="text-[10px] text-ink-soft">{label}</p>
    </div>
  )
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
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
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  )
}
