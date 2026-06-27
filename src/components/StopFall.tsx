import { useEffect, useRef, useState } from 'react'

interface Props {
  targetDistance: number
  height: number
  gravity?: number
  /** Reports the distance fallen at the moment STOP was pressed. */
  onValue: (distance: number) => void
}

const PLAY = 0.5 // slow-motion so the fall is catchable

const COLORS = {
  skyTop: '#fffdf7',
  skyBottom: '#f1e8d6',
  ground: '#bd9e6a',
  groundFill: '#e7d6b3',
  ball: '#d9600c',
  target: '#1f8a4c',
  tower: '#cdbf9f',
}

/**
 * Reaction game: a ball accelerates downward; hit STOP when it has fallen the
 * target distance. There is no live distance readout — you judge by eye against
 * the target line, which trains intuition for how fast falling speeds up.
 */
export default function StopFall({ targetDistance, height, gravity = 9.8, onValue }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [phase, setPhase] = useState<'idle' | 'falling' | 'stopped'>('idle')
  const startRef = useRef<number | null>(null)
  const stoppedTRef = useRef<number | null>(null)
  const params = useRef({ phase })
  params.current = { phase }
  const tFall = Math.sqrt((2 * height) / gravity)

  const release = () => {
    stoppedTRef.current = null
    startRef.current = performance.now()
    setPhase('falling')
  }
  const stop = () => {
    if (params.current.phase !== 'falling' || startRef.current == null) return
    const tPhys = ((performance.now() - startRef.current) / 1000) * PLAY
    const tClamped = Math.min(tPhys, tFall)
    stoppedTRef.current = tClamped
    const d = 0.5 * gravity * tClamped * tClamped
    onValue(d)
    setPhase('stopped')
  }
  const reset = () => {
    startRef.current = null
    stoppedTRef.current = null
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
      const rect = canvas.getBoundingClientRect()
      const W = rect.width
      const Hpx = rect.height
      const padT = 14
      const padB = 20
      const sy = (d: number) => padT + (d / height) * (Hpx - padT - padB)
      const ballX = W * 0.5

      ctx.clearRect(0, 0, W, Hpx)
      const sky = ctx.createLinearGradient(0, 0, 0, Hpx)
      sky.addColorStop(0, COLORS.skyTop)
      sky.addColorStop(1, COLORS.skyBottom)
      ctx.fillStyle = sky
      ctx.fillRect(0, 0, W, Hpx)

      // tower
      ctx.fillStyle = COLORS.tower
      ctx.fillRect(ballX - 24, padT - 4, 9, Hpx - padT - padB + 4)

      // target line
      ctx.strokeStyle = COLORS.target
      ctx.lineWidth = 2
      ctx.setLineDash([6, 4])
      ctx.beginPath()
      ctx.moveTo(ballX - 40, sy(targetDistance))
      ctx.lineTo(W - 8, sy(targetDistance))
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = COLORS.target
      ctx.font = '10px Inter, sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(`target: ${targetDistance} m`, W - 8, sy(targetDistance) - 4)

      // ground
      ctx.fillStyle = COLORS.groundFill
      ctx.fillRect(0, Hpx - padB, W, padB)
      ctx.strokeStyle = COLORS.ground
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(0, Hpx - padB)
      ctx.lineTo(W, Hpx - padB)
      ctx.stroke()

      let tPhys = 0
      if (params.current.phase === 'falling' && startRef.current != null) {
        tPhys = Math.min(((now - startRef.current) / 1000) * PLAY, tFall)
        if (tPhys >= tFall) queueMicrotask(() => setPhase('stopped'))
      } else if (stoppedTRef.current != null) {
        tPhys = stoppedTRef.current
      }
      const d = Math.min(height, 0.5 * gravity * tPhys * tPhys)

      ctx.fillStyle = COLORS.ball
      ctx.shadowColor = 'rgba(33,28,22,0.25)'
      ctx.shadowBlur = 6
      ctx.beginPath()
      ctx.arc(ballX, sy(d), 9, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [height, gravity, targetDistance, tFall])

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="h-60 w-full">
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      </div>
      <div className="border-y border-line bg-surface-2 px-3 py-2 text-center text-sm">
        {phase === 'idle' && <span className="text-ink-soft">Release the ball, then hit Stop at the green line.</span>}
        {phase === 'falling' && <span className="font-medium text-streak">Now! Hit Stop at the target…</span>}
        {phase === 'stopped' && <span className="font-medium text-ink">Stopped — check your timing below.</span>}
      </div>
      <div className="flex gap-2 p-3">
        {phase === 'falling' ? (
          <button type="button" onClick={stop} className="btn-primary flex-1 py-2.5">
            Stop!
          </button>
        ) : (
          <button type="button" onClick={release} className="btn-primary flex-1 py-2.5">
            {phase === 'stopped' ? 'Drop again' : 'Release'}
          </button>
        )}
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
