// Pure, deterministic projectile math. No AI, no network. Used both to animate
// the canvas and to check sim-challenge answers (so checks match what is drawn).

const DEG2RAD = Math.PI / 180

export interface Kinematics {
  vx: number
  vy: number
  /** Horizontal distance when it returns to launch height (meters). */
  range: number
  /** Peak height above launch (meters). */
  maxHeight: number
  /** Total time in the air (seconds). */
  timeOfFlight: number
}

export function computeKinematics(angleDeg: number, speed: number, gravity: number): Kinematics {
  const a = angleDeg * DEG2RAD
  const vx = speed * Math.cos(a)
  const vy = speed * Math.sin(a)
  const timeOfFlight = vy > 0 ? (2 * vy) / gravity : 0
  const range = vx * timeOfFlight
  const maxHeight = (vy * vy) / (2 * gravity)
  return { vx, vy, range, maxHeight, timeOfFlight }
}

/** Height of the projectile when it has travelled horizontal distance x. */
export function heightAtX(angleDeg: number, speed: number, gravity: number, x: number): number {
  const a = angleDeg * DEG2RAD
  const vx = speed * Math.cos(a)
  if (vx <= 0) return Number.NEGATIVE_INFINITY
  const t = x / vx
  const vy = speed * Math.sin(a)
  return vy * t - 0.5 * gravity * t * t
}

/** Sample points along the arc (until it lands) for rendering. */
export function trajectoryPoints(
  angleDeg: number,
  speed: number,
  gravity: number,
  samples = 120,
): Array<{ x: number; y: number }> {
  const { vx, vy, timeOfFlight } = computeKinematics(angleDeg, speed, gravity)
  const pts: Array<{ x: number; y: number }> = []
  const tEnd = timeOfFlight || 0
  for (let i = 0; i <= samples; i++) {
    const t = (tEnd * i) / samples
    pts.push({ x: vx * t, y: Math.max(0, vy * t - 0.5 * gravity * t * t) })
  }
  return pts
}

export interface GoalResult {
  success: boolean
  /** Where the projectile landed (meters), for feedback text. */
  landingDistance: number
}

export function evaluateHitTarget(
  angleDeg: number,
  speed: number,
  gravity: number,
  target: { distance: number; radius: number },
): GoalResult {
  const { range } = computeKinematics(angleDeg, speed, gravity)
  return {
    success: Math.abs(range - target.distance) <= target.radius,
    landingDistance: range,
  }
}

export function evaluateClearWall(
  angleDeg: number,
  speed: number,
  gravity: number,
  wall: { distance: number; height: number; width: number },
): GoalResult {
  const { range } = computeKinematics(angleDeg, speed, gravity)
  const near = heightAtX(angleDeg, speed, gravity, wall.distance)
  const far = heightAtX(angleDeg, speed, gravity, wall.distance + wall.width)
  // Concave-down arc: if both edges clear the wall top, the whole span does.
  const clears = near > wall.height && far > wall.height && range > wall.distance + wall.width
  return { success: clears, landingDistance: range }
}
