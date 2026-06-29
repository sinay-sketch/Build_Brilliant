import { useEffect, useRef, useState } from 'react'

interface Props {
  velocity?: number
  /**
   * Question mode: render a clean, static graph (line + rise/run triangle of the
   * given data) with NO velocity readout, slider, or buttons — so the game can't
   * reveal the answer when it accompanies a "read the velocity" question.
   */
  quiz?: boolean
  /** When false (a graded predict/mcq not yet answered), hide the velocity readout + controls so the game doesn't reveal the answer. Defaults to revealed. */
  revealed?: boolean
}

const T_MAX = 5 // seconds shown on the graph
const PLAYBACK = 0.9
const POS_MIN = -30 // fixed position scale (m) so a steeper slope always = faster
const POS_MAX = 60
const SPAN = POS_MAX - POS_MIN

const COLORS = {
  bg: '#fffdf7',
  grid: 'rgba(33,28,22,0.08)',
  axis: '#bd9e6a',
  line: '#d9600c',
  lineFaint: 'rgba(217,96,12,0.22)',
  dot: '#211c16',
  text: '#6c6354',
  mute: '#9b9281',
  lane: '#f3ead7',
  laneEdge: '#e2d4b4',
  runnerTrail: 'rgba(217,96,12,0.28)',
  triFill: 'rgba(176,125,24,0.12)',
  riseRun: '#b07d18',
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/**
 * Position-vs-time grapher with a synced real-space view. The top lane shows the
 * object actually moving; the graph below traces its position over time. A live
 * rise/run triangle is drawn on the line so "velocity = slope = Δx / Δt" is
 * something you watch form, not memorize. Steeper = faster, downhill = backward.
 */
export default function MotionGraph({ velocity = 4, quiz = false, revealed = true }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [v, setV] = useState(velocity)
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle')
  const [readout, setReadout] = useState({ t: 0, x: 0 })
  const startRef = useRef<number | null>(null)
  const params = useRef({ v, phase, quiz })
  params.current = { v, phase, quiz }

  const play = () => {
    startRef.current = performance.now()
    setPhase('running')
  }
  const reset = () => {
    startRef.current = null
    setPhase('idle')
    setReadout({ t: 0, x: 0 })
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
      const padL = 38
      const padR = 14

      // Two stacked regions: a real-space track on top, the graph below.
      const trackY = 34 // lane center
      const laneH = 18
      const graphTop = 70
      const graphBottom = H - 22

      const plotL = padL
      const plotR = W - padR
      const plotW = plotR - plotL

      const sx = (t: number) => plotL + (t / T_MAX) * plotW // graph: time across
      const sy = (x: number) => graphTop + (1 - (x - POS_MIN) / SPAN) * (graphBottom - graphTop)
      const tx = (x: number) => plotL + ((x - POS_MIN) / SPAN) * plotW // track: position across

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = COLORS.bg
      ctx.fillRect(0, 0, W, H)

      // ---- advance time ----
      let t = 0
      if (p.quiz) {
        t = T_MAX // quiz mode: show the full line + triangle statically
      } else if (startRef.current != null) {
        t = Math.min(((now - startRef.current) / 1000) * PLAYBACK, T_MAX)
        if (t >= T_MAX && p.phase === 'running') {
          queueMicrotask(() => {
            setPhase('done')
            setReadout({ t: T_MAX, x: p.v * T_MAX })
          })
        }
      }
      const xNow = p.v * t

      // ================= REAL-SPACE TRACK =================
      ctx.fillStyle = COLORS.mute
      ctx.font = '700 9px Inter, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('REAL MOTION', plotL, 14)

      ctx.fillStyle = COLORS.lane
      roundRect(ctx, plotL, trackY - laneH / 2, plotW, laneH, 7)
      ctx.fill()
      ctx.strokeStyle = COLORS.laneEdge
      ctx.lineWidth = 1
      ctx.stroke()

      // position ticks along the track
      ctx.font = '9px Inter, sans-serif'
      ctx.textAlign = 'center'
      for (let x = POS_MIN; x <= POS_MAX; x += 15) {
        const px = tx(x)
        ctx.strokeStyle = x === 0 ? COLORS.axis : COLORS.grid
        ctx.lineWidth = x === 0 ? 1.5 : 1
        ctx.beginPath()
        ctx.moveTo(px, trackY - laneH / 2)
        ctx.lineTo(px, trackY + laneH / 2)
        ctx.stroke()
        ctx.fillStyle = COLORS.mute
        ctx.fillText(`${x}`, px, trackY + laneH / 2 + 11)
      }

      // trail + moving object
      ctx.strokeStyle = COLORS.runnerTrail
      ctx.lineWidth = 4
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(tx(0), trackY)
      ctx.lineTo(tx(xNow), trackY)
      ctx.stroke()

      const mover = tx(xNow)
      ctx.fillStyle = 'rgba(33,28,22,0.18)'
      ctx.beginPath()
      ctx.ellipse(mover, trackY + 7, 8, 2.5, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = COLORS.line
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.arc(mover, trackY, 7, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      // direction arrow on the mover
      if (p.v !== 0) {
        const dir = p.v > 0 ? 1 : -1
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(mover - 3 * dir, trackY)
        ctx.lineTo(mover + 3 * dir, trackY)
        ctx.moveTo(mover + dir, trackY - 3)
        ctx.lineTo(mover + 3 * dir, trackY)
        ctx.lineTo(mover + dir, trackY + 3)
        ctx.stroke()
      }

      // ================= POSITION-TIME GRAPH =================
      // horizontal gridlines (position)
      ctx.font = '9px Inter, sans-serif'
      for (let x = POS_MIN; x <= POS_MAX; x += 15) {
        ctx.strokeStyle = x === 0 ? COLORS.axis : COLORS.grid
        ctx.lineWidth = x === 0 ? 1.5 : 1
        ctx.beginPath()
        ctx.moveTo(plotL, sy(x))
        ctx.lineTo(plotR, sy(x))
        ctx.stroke()
        ctx.fillStyle = COLORS.text
        ctx.textAlign = 'right'
        ctx.fillText(x === POS_MAX ? `${x} m` : `${x}`, plotL - 4, sy(x) + 3)
      }
      // vertical gridlines (time)
      ctx.strokeStyle = COLORS.grid
      ctx.lineWidth = 1
      ctx.textAlign = 'center'
      for (let tt = 0; tt <= T_MAX; tt++) {
        ctx.beginPath()
        ctx.moveTo(sx(tt), graphTop)
        ctx.lineTo(sx(tt), graphBottom)
        ctx.stroke()
        ctx.fillStyle = COLORS.text
        ctx.fillText(`${tt}s`, sx(tt), graphBottom + 13)
      }
      // y-axis title
      ctx.save()
      ctx.fillStyle = COLORS.text
      ctx.font = '9px Inter, sans-serif'
      ctx.translate(10, (graphTop + graphBottom) / 2)
      ctx.rotate(-Math.PI / 2)
      ctx.fillText('position (m)', 0, 0)
      ctx.restore()

      // faint full line previewing the chosen velocity
      ctx.strokeStyle = COLORS.lineFaint
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(sx(0), sy(0))
      ctx.lineTo(sx(T_MAX), sy(p.v * T_MAX))
      ctx.stroke()

      // ---- rise / run triangle (the slope made visible) ----
      // Skip it for a flat line (v = 0): there is no slope to show, and the
      // degenerate triangle's "Δx = 0m" label would sit under the line — exactly
      // the 20/20 "flat line" question.
      if (t > 0.12 && p.v !== 0) {
        const x0 = sx(0)
        const y0 = sy(0)
        const xT = sx(t)
        const yX = sy(xNow)
        // filled triangle
        ctx.fillStyle = COLORS.triFill
        ctx.beginPath()
        ctx.moveTo(x0, y0)
        ctx.lineTo(xT, y0)
        ctx.lineTo(xT, yX)
        ctx.closePath()
        ctx.fill()
        // run + rise legs
        ctx.strokeStyle = COLORS.riseRun
        ctx.lineWidth = 1.5
        ctx.setLineDash([4, 3])
        ctx.beginPath()
        ctx.moveTo(x0, y0)
        ctx.lineTo(xT, y0) // run
        ctx.lineTo(xT, yX) // rise
        ctx.stroke()
        ctx.setLineDash([])
        // leg labels
        ctx.fillStyle = COLORS.riseRun
        ctx.font = '700 9px Inter, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(`Δt = ${t.toFixed(1)}s`, (x0 + xT) / 2, y0 + 12)
        ctx.textAlign = 'right'
        ctx.fillText(`Δx = ${Math.round(xNow)}m`, xT - 5, (y0 + yX) / 2 + 3)
      }

      // traced (animated) portion of the line
      ctx.strokeStyle = COLORS.line
      ctx.lineWidth = 3
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(sx(0), sy(0))
      ctx.lineTo(sx(t), sy(xNow))
      ctx.stroke()

      // moving dot on the graph
      ctx.fillStyle = COLORS.dot
      ctx.beginPath()
      ctx.arc(sx(t), sy(xNow), 5, 0, Math.PI * 2)
      ctx.fill()

      if (p.phase === 'running') {
        queueMicrotask(() => setReadout({ t, x: xNow }))
      }

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
      <div className="h-72 w-full">
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      </div>

      {!quiz && revealed && (
        <>
          <div className="space-y-1 border-y border-line bg-surface-2 px-3 py-2 text-center text-sm">
            <p>
              <span className="text-ink-soft">Slope of the line = velocity = </span>
              <span className="font-mono font-semibold text-brand">{v} m/s</span>
              <span className="text-ink-soft"> — {slopeWord}.</span>
            </p>
            <p className="font-mono text-xs text-ink-mute">
              {readout.t < 0.1 ? (
                'rise ÷ run = Δx ÷ Δt — press Play to trace it'
              ) : (
                <>
                  rise ÷ run = <span className="text-gold">{Math.round(readout.x)} m</span> ÷{' '}
                  <span className="text-gold">{readout.t.toFixed(1)} s</span> ={' '}
                  <span className="font-semibold text-brand">{v} m/s</span>
                </>
              )}
            </p>
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
        </>
      )}
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
