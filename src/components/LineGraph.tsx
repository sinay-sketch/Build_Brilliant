interface Props {
  /** Total displacement (m) and time (s) the trip covers, drawn to scale. */
  distance?: number
  time?: number
}

const VB_W = 300
const VB_H = 190
const PAD_L = 40
const PAD_R = 14
const PAD_T = 14
const PAD_B = 34

/**
 * A static, labelled position-time graph drawn to the exact numbers in the
 * question (axes scaled to the trip's time and distance, with named axes). It
 * shows the scenario without a slider — the learner reads the line, not toys.
 */
export default function LineGraph({ distance = 100, time = 20 }: Props) {
  const tMax = Math.max(1, time)
  const xMax = Math.max(1, distance)
  const sx = (t: number) => PAD_L + (t / tMax) * (VB_W - PAD_L - PAD_R)
  const sy = (x: number) => PAD_T + (1 - x / xMax) * (VB_H - PAD_T - PAD_B)

  // 4 ticks on each axis.
  const tTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(f * tMax))
  const xTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(f * xMax))

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="bg-gradient-to-b from-[#fffdf7] to-[#f1e8d6]">
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="h-52 w-full" role="img" aria-label="Position versus time graph">
          {/* gridlines */}
          {xTicks.map((x) => (
            <g key={`y${x}`}>
              <line x1={PAD_L} y1={sy(x)} x2={VB_W - PAD_R} y2={sy(x)} stroke="rgba(33,28,22,0.07)" />
              <text x={PAD_L - 5} y={sy(x) + 3} fontSize="8" textAnchor="end" fill="var(--color-ink-mute)">{x}</text>
            </g>
          ))}
          {tTicks.map((t) => (
            <text key={`x${t}`} x={sx(t)} y={VB_H - PAD_B + 13} fontSize="8" textAnchor="middle" fill="var(--color-ink-mute)">{t}</text>
          ))}

          {/* axes */}
          <line x1={PAD_L} y1={VB_H - PAD_B} x2={VB_W - PAD_R} y2={VB_H - PAD_B} stroke="#bd9e6a" strokeWidth="1.5" />
          <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={VB_H - PAD_B} stroke="#bd9e6a" strokeWidth="1.5" />

          {/* axis labels */}
          <text x={(PAD_L + VB_W - PAD_R) / 2} y={VB_H - 4} fontSize="10" textAnchor="middle" fill="var(--color-ink-soft)" fontWeight="600">
            time (s)
          </text>
          <text x={12} y={(PAD_T + VB_H - PAD_B) / 2} fontSize="10" textAnchor="middle" fill="var(--color-ink-soft)" fontWeight="600" transform={`rotate(-90 12 ${(PAD_T + VB_H - PAD_B) / 2})`}>
            position (m)
          </text>

          {/* the trip line from origin to (time, distance) */}
          <line x1={sx(0)} y1={sy(0)} x2={sx(tMax)} y2={sy(xMax)} stroke="var(--color-brand)" strokeWidth="3" />
          <circle cx={sx(tMax)} cy={sy(xMax)} r="4.5" fill="var(--color-brand)" stroke="#fff" strokeWidth="1.5" />
        </svg>
      </div>

      <div className="border-t border-line bg-surface-2 px-3 py-2 text-center text-sm text-ink-soft">
        The trip covers <span className="font-semibold text-ink">{distance} m</span> in{' '}
        <span className="font-semibold text-ink">{time} s</span>.
      </div>
    </div>
  )
}
