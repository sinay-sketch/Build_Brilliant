import { useEffect, useRef, useState } from 'react'

interface Props {
  v1?: number
  v2?: number
}

const T_MAX = 5
const PLAYBACK = 0.9
const SPEED_MAX = 12

const COLORS = {
  bg: '#fffdf7',
  lane: '#f3ead7',
  laneEdge: '#e2d4b4',
  center: '#bd9e6a',
  tick: 'rgba(33,28,22,0.14)',
  text: '#9b9281',
  a: '#d9600c',
  aTrail: 'rgba(217,96,12,0.22)',
  b: '#1f8a4c',
  bTrail: 'rgba(31,138,76,0.22)',
}

type Dir = 1 | -1

const clampSpeed = (v: number) => Math.max(0, Math.min(SPEED_MAX, Math.round(v)))
const dirWord = (speed: number, dir: Dir) => (speed === 0 ? 'at rest' : dir === 1 ? 'East' : 'West')
const dirArrow = (dir: Dir) => (dir === 1 ? '→' : '←')
const signed = (v: number) => (v > 0 ? `+${v}` : `${v}`)

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
 * Speed vs. velocity, made literal. Each car has a SPEED (its own magnitude
 * slider) and a DIRECTION (East/West toggle) — the two halves of velocity kept
 * as deliberately separate controls. Give two cars the same speed but opposite
 * directions and watch them finish at opposite places: same speed, different
 * velocity. Live panels call out whether the speeds match and whether the
 * velocities match, so the distinction the lesson is teaching is on screen.
 */
export default function TwoRunners({ v1 = 6, v2 = -6 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [speedA, setSpeedA] = useState(() => clampSpeed(Math.abs(v1)))
  const [speedB, setSpeedB] = useState(() => clampSpeed(Math.abs(v2)))
  const [dirA, setDirA] = useState<Dir>(v1 < 0 ? -1 : 1)
  const [dirB, setDirB] = useState<Dir>(v2 < 0 ? -1 : 1)
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle')
  const [, setTick] = useState(0)
  const startRef = useRef<number | null>(null)

  const velA = speedA * dirA
  const velB = speedB * dirB
  const sameSpeed = speedA === speedB
  const sameVelocity = velA === velB

  const params = useRef({ velA, velB, dirA, dirB, phase })
  params.current = { velA, velB, dirA, dirB, phase }

  const reset = () => {
    startRef.current = null
    setPhase('idle')
  }
  const go = () => {
    startRef.current = performance.now()
    setPhase('running')
  }
  const matchQuestion = () => {
    setSpeedA(10)
    setSpeedB(10)
    setDirA(1)
    setDirB(-1)
    reset()
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

    const drawCar = (cx: number, cy: number, dir: Dir, color: string) => {
      ctx.save()
      ctx.translate(cx, cy)
      ctx.scale(dir, 1) // flip so the car faces its travel direction
      // ground shadow
      ctx.fillStyle = 'rgba(33,28,22,0.16)'
      ctx.beginPath()
      ctx.ellipse(0, 9, 16, 3, 0, 0, Math.PI * 2)
      ctx.fill()
      // body + cabin
      ctx.fillStyle = color
      roundRect(ctx, -16, -6, 32, 12, 4)
      ctx.fill()
      roundRect(ctx, -7, -12, 14, 8, 3)
      ctx.fill()
      // window
      ctx.fillStyle = 'rgba(255,255,255,0.65)'
      roundRect(ctx, -4, -10, 9, 5, 2)
      ctx.fill()
      // wheels
      ctx.fillStyle = '#211c16'
      ctx.beginPath()
      ctx.arc(-9, 6, 3.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(9, 6, 3.5, 0, Math.PI * 2)
      ctx.fill()
      // headlight at the front
      ctx.fillStyle = '#fff3c4'
      ctx.beginPath()
      ctx.arc(15, 1, 1.8, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }

    const draw = (now: number) => {
      const p = params.current
      const rect = canvas.getBoundingClientRect()
      const W = rect.width
      const H = rect.height
      const padX = 30
      const rowA = H * 0.34
      const rowB = H * 0.72
      const laneH = 30

      // Symmetric world scale, so 0 sits at the center ("start").
      const reach = Math.max(Math.abs(p.velA), Math.abs(p.velB), 2) * T_MAX
      const xMax = reach * 1.12
      const xMin = -xMax
      const span = xMax - xMin || 1
      const sx = (x: number) => padX + ((x - xMin) / span) * (W - 2 * padX)

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = COLORS.bg
      ctx.fillRect(0, 0, W, H)

      let t = 0
      if (startRef.current != null) t = Math.min(((now - startRef.current) / 1000) * PLAYBACK, T_MAX)
      if (startRef.current != null && t >= T_MAX && p.phase === 'running') {
        queueMicrotask(() => setPhase('done'))
      }
      const xA = p.velA * t
      const xB = p.velB * t

      // lanes
      for (const rowY of [rowA, rowB]) {
        ctx.fillStyle = COLORS.lane
        roundRect(ctx, padX, rowY - laneH / 2, W - 2 * padX, laneH, 8)
        ctx.fill()
        ctx.strokeStyle = COLORS.laneEdge
        ctx.lineWidth = 1
        ctx.stroke()
      }

      // distance ticks + labels
      const step = reach > 40 ? 20 : 10
      ctx.fillStyle = COLORS.text
      ctx.font = '9px Inter, sans-serif'
      ctx.textAlign = 'center'
      for (let xt = Math.ceil(xMin / step) * step; xt <= xMax; xt += step) {
        const px = sx(xt)
        ctx.strokeStyle = COLORS.tick
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(px, rowA - laneH / 2)
        ctx.lineTo(px, rowB + laneH / 2)
        ctx.stroke()
        if (xt !== 0) ctx.fillText(`${xt}`, px, H - 3)
      }

      // center "start" line
      const cx0 = sx(0)
      ctx.strokeStyle = COLORS.center
      ctx.lineWidth = 1.5
      ctx.setLineDash([4, 3])
      ctx.beginPath()
      ctx.moveTo(cx0, rowA - laneH / 2 - 6)
      ctx.lineTo(cx0, rowB + laneH / 2 + 2)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = COLORS.center
      ctx.font = '700 9px Inter, sans-serif'
      ctx.fillText('START', cx0, rowA - laneH / 2 - 11)

      // trails
      const drawTrail = (rowY: number, x: number, color: string) => {
        ctx.strokeStyle = color
        ctx.lineWidth = 4
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(sx(0), rowY)
        ctx.lineTo(sx(x), rowY)
        ctx.stroke()
      }
      drawTrail(rowA, xA, COLORS.aTrail)
      drawTrail(rowB, xB, COLORS.bTrail)

      // cars (face chosen direction even when parked at speed 0)
      const faceA: Dir = p.velA !== 0 ? (p.velA < 0 ? -1 : 1) : p.dirA
      const faceB: Dir = p.velB !== 0 ? (p.velB < 0 ? -1 : 1) : p.dirB
      drawCar(sx(xA), rowA, faceA, COLORS.a)
      drawCar(sx(xB), rowB, faceB, COLORS.b)

      // live position above each car
      const drawPos = (rowY: number, x: number, color: string) => {
        ctx.fillStyle = color
        ctx.font = '700 11px Inter, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(`${x > 0 ? '+' : ''}${Math.round(x)} m`, sx(x), rowY - 16)
      }
      drawPos(rowA, xA, COLORS.a)
      drawPos(rowB, xB, COLORS.b)

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  // Force a re-render tick so the panels animate while a run is playing.
  useEffect(() => {
    if (phase !== 'running') return
    let raf = 0
    const loop = () => {
      setTick((n) => n + 1)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [phase])

  const insight =
    speedA === 0 && speedB === 0
      ? 'Both cars are at rest — velocity is 0 for each.'
      : sameSpeed && !sameVelocity
        ? 'Same speed, different velocity — direction is the only difference.'
        : !sameSpeed && !sameVelocity
          ? 'Different speeds, so different velocities too.'
          : 'Same speed and same direction — identical velocity.'

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="h-56 w-full">
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      </div>

      {/* Velocity readout — the heart of the question */}
      <div className="border-y border-line bg-surface-2 p-2.5">
        <ReadoutCard label="Velocity — speed + direction">
          <Row color={COLORS.a} name="Car A" value={`${signed(velA)} m/s ${speedA === 0 ? '' : dirArrow(dirA)}`} />
          <Row color={COLORS.b} name="Car B" value={`${signed(velB)} m/s ${speedB === 0 ? '' : dirArrow(dirB)}`} />
          <Verdict
            same={sameVelocity}
            text={`${signed(velA)} ${sameVelocity ? '=' : '≠'} ${signed(velB)} · ${sameVelocity ? 'same velocity' : 'different velocity'}`}
          />
        </ReadoutCard>
      </div>

      <p className="border-b border-line bg-brand-tint/60 px-3 py-2 text-center text-xs font-medium text-ink-soft">
        {insight}
      </p>

      {/* Controls: speed magnitude and direction kept separate on purpose */}
      <div className="space-y-3 p-3">
        <Lane name="Car A" color={COLORS.a} speed={speedA} dir={dirA} dirLabel={dirWord(speedA, dirA)} onSpeed={(v) => { setSpeedA(v); reset() }} onDir={(d) => { setDirA(d); reset() }} />
        <Lane name="Car B" color={COLORS.b} speed={speedB} dir={dirB} dirLabel={dirWord(speedB, dirB)} onSpeed={(v) => { setSpeedB(v); reset() }} onDir={(d) => { setDirB(d); reset() }} />

        <button
          type="button"
          onClick={matchQuestion}
          className="w-full rounded-xl border border-brand/40 bg-brand-tint py-2 text-sm font-semibold text-brand-strong transition hover:bg-brand-soft"
        >
          Match the question: same speed, opposite directions
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={go}
            disabled={phase === 'running' || (speedA === 0 && speedB === 0)}
            className="btn-primary flex-1 py-2.5"
          >
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

function ReadoutCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-2.5">
      <p className="eyebrow text-[0.6rem] text-ink-mute">{label}</p>
      <div className="mt-1.5 space-y-0.5">{children}</div>
    </div>
  )
}

function Row({ color, name, value }: { color: string; name: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="font-semibold" style={{ color }}>
        {name}
      </span>
      <span className="font-mono text-ink">{value}</span>
    </div>
  )
}

function Verdict({ same, text }: { same: boolean; text: string }) {
  return (
    <p
      className={`mt-1.5 rounded-lg px-2 py-1 text-center text-xs font-semibold ${
        same ? 'bg-paper-2 text-ink-soft' : 'bg-brand-tint text-brand-strong'
      }`}
    >
      {text}
    </p>
  )
}

function Lane({
  name,
  color,
  speed,
  dir,
  dirLabel,
  onSpeed,
  onDir,
}: {
  name: string
  color: string
  speed: number
  dir: Dir
  dirLabel: string
  onSpeed: (v: number) => void
  onDir: (d: Dir) => void
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm font-semibold" style={{ color }}>
          {name}
        </span>
        <div className="flex gap-1">
          <DirButton active={dir === -1} color={color} onClick={() => onDir(-1)}>
            ← West
          </DirButton>
          <DirButton active={dir === 1} color={color} onClick={() => onDir(1)}>
            East →
          </DirButton>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={SPEED_MAX}
          step={1}
          value={speed}
          onChange={(e) => onSpeed(Number(e.target.value))}
        />
        <span className="w-20 shrink-0 text-right font-mono text-xs font-semibold" style={{ color }}>
          {speed} m/s {dirLabel === 'at rest' ? '' : dir === 1 ? 'E' : 'W'}
        </span>
      </div>
    </div>
  )
}

function DirButton({
  active,
  color,
  onClick,
  children,
}: {
  active: boolean
  color: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border px-2 py-1 text-xs font-semibold transition"
      style={
        active
          ? { borderColor: color, backgroundColor: color, color: '#fff' }
          : { borderColor: 'var(--color-line)', color: 'var(--color-ink-soft)' }
      }
    >
      {children}
    </button>
  )
}
