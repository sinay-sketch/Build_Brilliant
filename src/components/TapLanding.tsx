import { useEffect, useRef, useState } from 'react'
import type { SimConfig } from '../types/content'
import { computeKinematics } from '../lib/physics'

interface Props {
  sim: SimConfig
  tolerance: number
  /** Flip to true to fire the real shot and reveal the landing. */
  revealed: boolean
  correct?: boolean
  onGuessChange: (meters: number) => void
  heightClass?: string
}

const COLORS = {
  skyTop: '#fffdf7',
  skyBottom: '#f1e8d6',
  grid: 'rgba(33,28,22,0.06)',
  gridLabel: 'rgba(33,28,22,0.42)',
  groundFill: '#e7d6b3',
  groundLine: '#bd9e6a',
  cannon: '#2f2a22',
  guess: '#b07d18',
  arcFlown: '#d9600c',
  ball: '#b94a08',
  hit: '#1f8a4c',
  miss: '#c23728',
}

export default function TapLanding({
  sim,
  tolerance,
  revealed,
  correct,
  onGuessChange,
  heightClass = 'h-64',
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // Stable world width from the max possible range (45°), so the marker range
  // never hints at the true answer.
  const maxRange = (sim.speed * sim.speed) / sim.gravity
  const worldW = Math.max(maxRange * 1.12, 30)

  const [guess, setGuess] = useState(worldW * 0.45)
  const layout = useRef({ originX: 0, scale: 1 })
  const flightStart = useRef<number | null>(null)
  const wasRevealed = useRef(false)
  // Latest values for the rAF loop without restarting it.
  const draw = useRef({ sim, revealed, guess, correct, worldW })
  draw.current = { sim, revealed, guess, correct, worldW }

  useEffect(() => {
    onGuessChange(guess)
  }, [guess, onGuessChange])

  useEffect(() => {
    if (revealed && !wasRevealed.current) {
      wasRevealed.current = true
      flightStart.current = performance.now()
    }
    if (!revealed) {
      wasRevealed.current = false
      flightStart.current = null
    }
  }, [revealed])

  const pointerToMeters = (clientX: number) => {
    const canvas = canvasRef.current
    if (!canvas) return guess
    const rect = canvas.getBoundingClientRect()
    const { originX, scale } = layout.current
    const m = (clientX - rect.left - originX) / scale
    return Math.max(0, Math.min(draw.current.worldW, m))
  }

  const handlePointer = (e: React.PointerEvent) => {
    if (draw.current.revealed) return
    setGuess(pointerToMeters(e.clientX))
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

    const render = (now: number) => {
      const d = draw.current
      const k = computeKinematics(d.sim.angleDeg, d.sim.speed, d.sim.gravity)
      const rect = canvas.getBoundingClientRect()
      const W = rect.width
      const Hpx = rect.height
      const worldH = Math.max(k.maxHeight * 1.3, 24)

      const padL = 30
      const padR = 16
      const padT = 14
      const padB = 24
      const scale = Math.min((W - padL - padR) / d.worldW, (Hpx - padT - padB) / worldH)
      const originX = padL
      const originY = Hpx - padB
      layout.current = { originX, scale }
      const sx = (x: number) => originX + x * scale
      const sy = (y: number) => originY - y * scale

      const sky = ctx.createLinearGradient(0, 0, 0, originY)
      sky.addColorStop(0, COLORS.skyTop)
      sky.addColorStop(1, COLORS.skyBottom)
      ctx.fillStyle = sky
      ctx.fillRect(0, 0, W, Hpx)

      // ruler grid
      ctx.font = '10px Inter, sans-serif'
      ctx.fillStyle = COLORS.gridLabel
      ctx.textAlign = 'center'
      ctx.lineWidth = 1
      for (let x = 0; x <= d.worldW; x += 10) {
        ctx.strokeStyle = COLORS.grid
        ctx.beginPath()
        ctx.moveTo(sx(x), padT)
        ctx.lineTo(sx(x), originY)
        ctx.stroke()
        if (x > 0) ctx.fillText(`${x}`, sx(x), originY + 14)
      }

      // ground
      ctx.fillStyle = COLORS.groundFill
      ctx.fillRect(originX, originY, W - padR - originX, padB)
      ctx.strokeStyle = COLORS.groundLine
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(originX, originY)
      ctx.lineTo(W - padR, originY)
      ctx.stroke()

      // guess flag
      const gx = sx(d.guess)
      ctx.strokeStyle = COLORS.guess
      ctx.fillStyle = COLORS.guess
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(gx, originY)
      ctx.lineTo(gx, originY - 34)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(gx, originY - 34)
      ctx.lineTo(gx + 16, originY - 29)
      ctx.lineTo(gx, originY - 24)
      ctx.closePath()
      ctx.fill()
      ctx.textAlign = 'center'
      ctx.fillText(`${d.guess.toFixed(0)} m`, gx, originY - 40)

      // cannon
      ctx.save()
      ctx.translate(originX, originY)
      ctx.rotate((-d.sim.angleDeg * Math.PI) / 180)
      ctx.fillStyle = COLORS.cannon
      ctx.fillRect(0, -5, 26, 10)
      ctx.restore()
      ctx.fillStyle = COLORS.cannon
      ctx.beginPath()
      ctx.arc(originX, originY, 8, 0, Math.PI * 2)
      ctx.fill()

      // revealed: animate the real shot + mark the true landing
      if (d.revealed && flightStart.current != null) {
        const t = (now - flightStart.current) / 1000
        const tt = Math.min(t, k.timeOfFlight)
        ctx.strokeStyle = COLORS.arcFlown
        ctx.lineWidth = 3
        ctx.beginPath()
        const steps = 60
        for (let i = 0; i <= steps; i++) {
          const ti = (tt * i) / steps
          const x = k.vx * ti
          const y = Math.max(0, k.vy * ti - 0.5 * d.sim.gravity * ti * ti)
          i === 0 ? ctx.moveTo(sx(x), sy(y)) : ctx.lineTo(sx(x), sy(y))
        }
        ctx.stroke()

        const bx = k.vx * tt
        const by = Math.max(0, k.vy * tt - 0.5 * d.sim.gravity * tt * tt)
        ctx.fillStyle = COLORS.ball
        ctx.beginPath()
        ctx.arc(sx(bx), sy(by), 6, 0, Math.PI * 2)
        ctx.fill()

        if (t >= k.timeOfFlight) {
          const lx = sx(k.range)
          const col = d.correct ? COLORS.hit : COLORS.miss
          ctx.strokeStyle = col
          ctx.lineWidth = 2.5
          ctx.beginPath()
          ctx.moveTo(lx - 6, originY - 6)
          ctx.lineTo(lx + 6, originY + 6)
          ctx.moveTo(lx + 6, originY - 6)
          ctx.lineTo(lx - 6, originY + 6)
          ctx.stroke()
          ctx.fillStyle = col
          ctx.textAlign = 'center'
          ctx.fillText(`${k.range.toFixed(0)} m`, lx, originY - 12)
        }
      }

      raf = requestAnimationFrame(render)
    }
    raf = requestAnimationFrame(render)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className={`${heightClass} w-full touch-none`}>
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointer}
          onPointerMove={(e) => {
            if (e.buttons === 1) handlePointer(e)
          }}
          style={{ width: '100%', height: '100%', display: 'block', cursor: revealed ? 'default' : 'ew-resize' }}
        />
      </div>
      <p className="border-t border-line bg-surface-2 px-3 py-2 text-center text-xs text-ink-soft">
        {revealed
          ? 'See where it actually landed.'
          : `Tap or drag on the ground to predict the landing (within ${tolerance} m).`}
      </p>
    </div>
  )
}
