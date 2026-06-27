import { useEffect, useRef, useState } from 'react'
import { dropFallTime } from '../lib/checker'

interface Props {
  targetTime: number
  gravity?: number
  startHeight?: number
  /** Reports the current drop height so the parent can grade on Check. */
  onValue: (height: number) => void
  revealed?: boolean
  correct?: boolean
}

const MIN_H = 5
const MAX_H = 125
const PLAY = 0.5 // slow-motion factor for the drop animation

/**
 * Graded drop game: set the release height so the fall lasts the target time.
 * The fall-time readout (t = sqrt(2h/g)) updates live as you slide, and the
 * Drop button plays an accelerating fall so the timing is something you feel.
 */
export default function DropTarget({ targetTime, gravity = 9.8, startHeight, onValue, revealed, correct }: Props) {
  const [height, setHeight] = useState(startHeight ?? 20)
  const [dropping, setDropping] = useState(false)
  const resetTimer = useRef<number | null>(null)

  useEffect(() => {
    onValue(height)
  }, [height, onValue])

  useEffect(() => () => {
    if (resetTimer.current) window.clearTimeout(resetTimer.current)
  }, [])

  // Used only to time the drop animation — never shown, so the fall time isn't
  // given away. The learner must judge the fall by eye against the target.
  const t = dropFallTime(height, gravity)
  // Visual: taller drop releases higher up. Map height to a top offset (%).
  const releaseTopPct = 6 + (1 - (height - MIN_H) / (MAX_H - MIN_H)) * 64 // 6%..70%
  const groundTopPct = 78

  const drop = () => {
    setDropping(false)
    // next frame, start the transition
    window.requestAnimationFrame(() => setDropping(true))
    if (resetTimer.current) window.clearTimeout(resetTimer.current)
    resetTimer.current = window.setTimeout(() => setDropping(false), t * PLAY * 1000 + 600)
  }

  const ballTop = dropping ? groundTopPct : releaseTopPct

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="relative h-56 bg-gradient-to-b from-[#fffdf7] to-[#f1e8d6]">
        {/* tower */}
        <div className="absolute left-[calc(50%-26px)] w-2.5 rounded bg-[#cdbf9f]" style={{ top: '6%', bottom: '22%' }} />
        {/* release marker */}
        <div
          className="absolute left-[calc(50%-30px)] h-0.5 w-10 bg-[#bd9e6a]"
          style={{ top: `${releaseTopPct}%` }}
        />
        {/* ground */}
        <div className="absolute inset-x-0 bottom-0 h-[22%] border-t-2 border-[#bd9e6a] bg-[#e7d6b3]" />
        {/* ball */}
        <div
          className="absolute left-1/2 h-4 w-4 -translate-x-1/2 rounded-full bg-brand shadow-md"
          style={{
            top: `${ballTop}%`,
            transition: dropping ? `top ${(t * PLAY).toFixed(2)}s cubic-bezier(0.55,0,1,0.45)` : 'none',
          }}
        />
      </div>

      <div className="border-y border-line bg-surface-2 px-3 py-2 text-center text-sm">
        <span className="text-ink-soft">Target fall time: </span>
        <span className="font-display text-base font-semibold text-brand">{targetTime.toFixed(1)} s</span>
        <span className="text-ink-soft"> — drop and judge it by eye.</span>
      </div>

      <div className="space-y-3 p-3">
        <div>
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="font-medium text-ink-soft">Drop height</span>
            <span className="font-mono font-semibold text-brand">{height} m</span>
          </div>
          <input
            type="range"
            min={MIN_H}
            max={MAX_H}
            step={1}
            value={height}
            disabled={revealed && correct}
            onChange={(e) => setHeight(Number(e.target.value))}
          />
        </div>
        <button type="button" onClick={drop} className="btn-primary w-full py-2.5">
          Drop & watch
        </button>
      </div>
    </div>
  )
}
