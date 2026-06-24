import { useEffect, useRef } from 'react'
import type { SimConfig } from '../types/content'
import { computeKinematics, trajectoryPoints } from '../lib/physics'

interface Props {
  angleDeg: number
  speed: number
  gravity: number
  target?: SimConfig['target']
  wall?: SimConfig['wall']
  ghost?: SimConfig['ghost']
  /** Bump this number to launch a new shot. */
  fireSignal: number
  className?: string
}

// Light-theme palette tuned to read as an inked field notebook.
const COLORS = {
  skyTop: '#fffdf7',
  skyBottom: '#f1e8d6',
  grid: 'rgba(33,28,22,0.06)',
  gridStrong: 'rgba(33,28,22,0.12)',
  gridLabel: 'rgba(33,28,22,0.42)',
  groundFill: '#e7d6b3',
  groundLine: '#bd9e6a',
  arcPreview: 'rgba(217,96,12,0.45)',
  arcFlown: '#d9600c',
  ball: '#b94a08',
  apex: 'rgba(176,125,24,0.9)',
  ghost: 'rgba(108,99,84,0.45)',
  target: '#1f8a4c',
  targetRing: 'rgba(31,138,76,0.55)',
  wall: '#8a6f47',
  wallTop: '#6f5733',
  cannon: '#2f2a22',
}

export default function ProjectileCanvas({
  angleDeg,
  speed,
  gravity,
  target,
  wall,
  ghost,
  fireSignal,
  className,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const flightStart = useRef<number | null>(null)
  const lastFireSignal = useRef(fireSignal)

  // Keep the latest props available to the rAF loop without restarting it.
  const params = useRef({ angleDeg, speed, gravity, target, wall, ghost })
  params.current = { angleDeg, speed, gravity, target, wall, ghost }

  useEffect(() => {
    if (fireSignal !== lastFireSignal.current) {
      lastFireSignal.current = fireSignal
      flightStart.current = performance.now()
    }
  }, [fireSignal])

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

      const k = computeKinematics(p.angleDeg, p.speed, p.gravity)

      // World bounds: fit the arc plus any target/wall, with stable minimums.
      let worldW = Math.max(k.range * 1.15, 70)
      let worldH = Math.max(k.maxHeight * 1.3, 35)
      if (p.target) worldW = Math.max(worldW, p.target.distance * 1.25)
      if (p.wall) {
        worldW = Math.max(worldW, (p.wall.distance + p.wall.width) * 1.25)
        worldH = Math.max(worldH, p.wall.height * 1.6)
      }

      const padL = 34
      const padR = 14
      const padT = 16
      const padB = 26
      const usableW = W - padL - padR
      const usableH = H - padT - padB
      const scale = Math.min(usableW / worldW, usableH / worldH)
      const originX = padL
      const originY = H - padB

      const sx = (x: number) => originX + x * scale
      const sy = (y: number) => originY - y * scale

      // Sky
      const sky = ctx.createLinearGradient(0, 0, 0, originY)
      sky.addColorStop(0, COLORS.skyTop)
      sky.addColorStop(1, COLORS.skyBottom)
      ctx.fillStyle = sky
      ctx.fillRect(0, 0, W, H)

      // Grid + labels
      ctx.lineWidth = 1
      ctx.font = '10px Inter, sans-serif'
      ctx.fillStyle = COLORS.gridLabel
      ctx.textAlign = 'center'
      for (let x = 0; x <= worldW; x += 10) {
        ctx.strokeStyle = x % 20 === 0 ? COLORS.gridStrong : COLORS.grid
        ctx.beginPath()
        ctx.moveTo(sx(x), padT)
        ctx.lineTo(sx(x), originY)
        ctx.stroke()
        if (x > 0) ctx.fillText(`${x}`, sx(x), originY + 14)
      }
      ctx.textAlign = 'right'
      for (let y = 0; y <= worldH; y += 5) {
        ctx.strokeStyle = y % 10 === 0 ? COLORS.gridStrong : COLORS.grid
        ctx.beginPath()
        ctx.moveTo(originX, sy(y))
        ctx.lineTo(W - padR, sy(y))
        ctx.stroke()
        if (y > 0) ctx.fillText(`${y}`, originX - 5, sy(y) + 3)
      }

      // Ground
      ctx.fillStyle = COLORS.groundFill
      ctx.fillRect(originX, originY, W - padR - originX, padB)
      ctx.strokeStyle = COLORS.groundLine
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(originX, originY)
      ctx.lineTo(W - padR, originY)
      ctx.stroke()

      // Ghost reference arc
      if (p.ghost) {
        const gp = trajectoryPoints(p.ghost.angleDeg, p.ghost.speed, p.gravity)
        ctx.strokeStyle = COLORS.ghost
        ctx.setLineDash([4, 4])
        ctx.lineWidth = 2
        ctx.beginPath()
        gp.forEach((pt, i) => (i === 0 ? ctx.moveTo(sx(pt.x), sy(pt.y)) : ctx.lineTo(sx(pt.x), sy(pt.y))))
        ctx.stroke()
        ctx.setLineDash([])
      }

      // Wall
      if (p.wall) {
        const wx = sx(p.wall.distance)
        const wTop = sy(p.wall.height)
        const wW = Math.max(4, p.wall.width * scale)
        ctx.fillStyle = COLORS.wall
        ctx.fillRect(wx, wTop, wW, originY - wTop)
        ctx.fillStyle = COLORS.wallTop
        ctx.fillRect(wx, wTop, wW, 3)
      }

      // Target
      if (p.target) {
        const tx = sx(p.target.distance)
        ctx.strokeStyle = COLORS.targetRing
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(tx, originY, Math.max(8, p.target.radius * scale), Math.PI, 0)
        ctx.stroke()
        ctx.fillStyle = COLORS.target
        ctx.beginPath()
        ctx.arc(tx, originY, 6, 0, Math.PI * 2)
        ctx.fill()
      }

      // Preview trajectory for current settings
      const pts = trajectoryPoints(p.angleDeg, p.speed, p.gravity)
      ctx.strokeStyle = COLORS.arcPreview
      ctx.setLineDash([5, 5])
      ctx.lineWidth = 2
      ctx.beginPath()
      pts.forEach((pt, i) => (i === 0 ? ctx.moveTo(sx(pt.x), sy(pt.y)) : ctx.lineTo(sx(pt.x), sy(pt.y))))
      ctx.stroke()
      ctx.setLineDash([])

      // Apex marker for the previewed arc
      if (k.maxHeight > 0.5) {
        ctx.strokeStyle = COLORS.apex
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.arc(sx(k.range / 2), sy(k.maxHeight), 3.5, 0, Math.PI * 2)
        ctx.stroke()
      }

      // Cannon
      ctx.save()
      ctx.translate(originX, originY)
      ctx.rotate((-p.angleDeg * Math.PI) / 180)
      ctx.fillStyle = COLORS.cannon
      ctx.fillRect(0, -5, 26, 10)
      ctx.restore()
      ctx.fillStyle = COLORS.cannon
      ctx.beginPath()
      ctx.arc(originX, originY, 8, 0, Math.PI * 2)
      ctx.fill()

      // Flying ball + solid flown arc
      if (flightStart.current != null) {
        const t = (now - flightStart.current) / 1000
        const landed = t >= k.timeOfFlight
        const tt = Math.min(t, k.timeOfFlight)
        const bx = k.vx * tt
        const by = Math.max(0, k.vy * tt - 0.5 * p.gravity * tt * tt)

        ctx.strokeStyle = COLORS.arcFlown
        ctx.lineWidth = 3
        ctx.beginPath()
        const steps = 60
        for (let i = 0; i <= steps; i++) {
          const ti = (tt * i) / steps
          const x = k.vx * ti
          const y = Math.max(0, k.vy * ti - 0.5 * p.gravity * ti * ti)
          i === 0 ? ctx.moveTo(sx(x), sy(y)) : ctx.lineTo(sx(x), sy(y))
        }
        ctx.stroke()

        ctx.fillStyle = COLORS.ball
        ctx.shadowColor = 'rgba(185,74,8,0.5)'
        ctx.shadowBlur = 12
        ctx.beginPath()
        ctx.arc(sx(bx), sy(by), 7, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0

        // Landing marker once it touches down
        if (landed) {
          ctx.strokeStyle = COLORS.arcFlown
          ctx.lineWidth = 2
          const lx = sx(k.range)
          ctx.beginPath()
          ctx.moveTo(lx - 5, originY - 5)
          ctx.lineTo(lx + 5, originY + 5)
          ctx.moveTo(lx + 5, originY - 5)
          ctx.lineTo(lx - 5, originY + 5)
          ctx.stroke()
          flightStart.current = null
        }
      }

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className={className} style={{ width: '100%', height: '100%', display: 'block' }} />
}
