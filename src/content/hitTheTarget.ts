import type { Lesson } from '../types/content'

// Hand-authored capstone lesson. Pulls together components, range, time aloft,
// and complementary angles into the single skill of AIMING. g = 9.8 m/s^2.

export const hitTheTargetLesson: Lesson = {
  id: 'hit-the-target',
  courseId: 'kinematics',
  order: 5,
  title: 'Hit the Target',
  concept: 'Combine angle, speed, and gravity to put a projectile exactly where you want.',
  estMinutes: 22,
  prerequisites: ['range-vs-angle'],
  playable: true,
  intro: {
    hook: 'You have one launcher, a target downrange, and a wall in the way. How do you choose the angle and speed to land the shot exactly on the mark?',
    objectives: [
      'Aim a launch to hit a target at a chosen distance',
      'Use the range formula to solve for a missing angle or speed',
      'Exploit complementary angles to find a second solution',
      'Clear an obstacle and still land on target',
    ],
    whyItMatters:
      'This is projectile motion as a tool: the same reasoning behind a perfect free throw, a water-balloon launch, or a spacecraft burn. It is the payoff for everything you have learned.',
  },
  bigIdea:
    'Aiming is bookkeeping: split the launch into sideways and upward parts, use time aloft and range to connect them, and pick the angle/speed pair that lands the shot.',
  steps: [
    // ---------------- PREDICT ----------------
    {
      id: 'ht-predict',
      type: 'predict',
      phase: 'predict',
      concept: 'angle-range',
      prompt:
        'Your launcher has a fixed, limited speed and the target is near the FARTHEST distance you can possibly reach. Which angle gives you the best shot at it?',
      choices: [
        { id: 'low', label: 'A low, flat angle (~20°)' },
        { id: '45', label: 'Around 45°' },
        { id: 'high', label: 'A steep angle (~70°)' },
      ],
      correctId: '45',
      perChoiceFeedback: {
        low: 'Too flat — it lands short of the maximum. You need the angle that maximizes range.',
        '45': 'Right. At your maximum reach, only ~45° gets there for a given speed.',
        high: 'Too steep — it lobs up and lands short. Maximum range lives at 45°.',
      },
      explanation:
        'Range peaks at 45° for a fixed speed. If the target sits near your maximum reach, 45° is the only angle that can get there.',
      takeaway: 'At the edge of your range, 45° is the answer.',
    },

    // ---------------- EXPLORE ----------------
    {
      id: 'ht-curve',
      type: 'interactive',
      phase: 'explore',
      widget: 'range-curve',
      config: { angleDeg: 30, speed: 22 },
      title: 'Every distance has two angles',
      body: 'Drag the angle and read the range. Notice the hollow marker: for almost any reachable distance there are TWO angles that land there — a flat one and a steep one — meeting only at the 45° peak.',
      keyPoints: [
        'The curve peaks at 45° (maximum range).',
        'Each height on the curve is hit by two angles that add to 90°.',
        'More speed lifts the whole curve — every distance gets easier.',
      ],
    },
    {
      id: 'ht-predict-complement',
      type: 'predict',
      phase: 'explore',
      concept: 'complementary-angles',
      prompt: 'You hit a target with a 35° launch. Keeping the same speed, what is the OTHER angle that also hits it?',
      choices: [
        { id: '45', label: '45°' },
        { id: '55', label: '55°' },
        { id: '70', label: '70°' },
      ],
      correctId: '55',
      perChoiceFeedback: {
        '45': '45° is the max-range angle, not the partner of 35°. Look for the complement.',
        '55': 'Yes — 35° and 55° add to 90°, so they share the same range.',
        '70': '70° overshoots the pairing. The complement of 35° makes 90°.',
      },
      explanation: 'Complementary angles (summing to 90°) give equal range. 35° pairs with 55°.',
      takeaway: 'The complement 90° − θ always hits the same spot.',
    },

    // ---------------- BUILD / PRACTICE: first aim ----------------
    {
      id: 'ht-aim-1',
      type: 'sim-challenge',
      phase: 'practice',
      concept: 'angle-range',
      prompt: 'Warm up: land the ball on the target 35 m away. Adjust angle and speed, then check your shot.',
      sim: {
        angleDeg: 30,
        speed: 16,
        gravity: 9.8,
        editable: ['angle', 'speed'],
        target: { distance: 35, radius: 2.5 },
      },
      goal: { kind: 'hitTarget' },
      hints: [
        'Near 45° needs the least speed for a given distance.',
        'Short? add speed. Long? ease off.',
        'Try ~45° and a speed near 19 m/s.',
      ],
      explanation: 'Many angle/speed pairs reach 35 m; near 45° you need the least speed (about 18–19 m/s).',
      takeaway: 'Aiming is choosing one of many angle/speed pairs that fit.',
    },
    {
      id: 'ht-range-concept',
      type: 'concept',
      phase: 'build',
      concept: 'range-reasoning',
      title: 'Solve for the shot',
      body: 'Instead of guessing, you can solve. The range formula links distance, speed, and angle directly — rearrange it to find whichever one you are missing.',
      formula: {
        expr: 'R = v² · sin(2θ) / g',
        terms: [
          { symbol: 'R', meaning: 'distance to the target (m)' },
          { symbol: 'v', meaning: 'launch speed (m/s)' },
          { symbol: '2θ', meaning: 'twice the launch angle' },
          { symbol: 'g', meaning: 'gravity, 9.8 m/s²' },
        ],
      },
      keyPoints: ['Know any three of R, v, θ, g → solve for the fourth.', 'At 45°, sin(2θ) = 1 and R = v²/g.'],
    },
    {
      id: 'ht-range-numeric',
      type: 'numeric',
      phase: 'practice',
      concept: 'range-reasoning',
      prompt: 'Your launcher fires at v = 22 m/s and θ = 40°. How far downrange does it land? (sin80° ≈ 0.985)',
      answer: 48.6,
      unit: 'm',
      tolerance: 2,
      min: 0,
      max: 120,
      hints: ['R = v²·sin(2θ)/g, and 2θ = 80°.', 'R = 22² · 0.985 / 9.8.'],
      explanation: 'R = 484 · sin80° / 9.8 = 484 · 0.985 / 9.8 ≈ 48.6 m.',
      solution: ['2θ = 80°, sin80° ≈ 0.985.', 'R = 484 · 0.985 / 9.8.', '= 476.6 / 9.8.', '≈ 48.6 m.'],
      takeaway: 'Plug into the range formula to predict where it lands.',
    },
    {
      id: 'ht-dial-speed',
      type: 'slider-estimate',
      phase: 'practice',
      concept: 'range-reasoning',
      prompt:
        'The angle is locked at 45°. Drag the SPEED slider so the ball lands right at the 40 m target — watch the Range readout home in.',
      sim: { angleDeg: 45, speed: 12, gravity: 9.8, editable: ['speed'], target: { distance: 40, radius: 2.5 } },
      judge: 'speed',
      answer: 19.8,
      tolerance: 1.5,
      hints: ['At 45°, R = v²/g, so v = √(R·g).', 'v = √(40 · 9.8) = √392.'],
      explanation: 'At 45°, R = v²/g, so v = √(R·g) = √(40·9.8) = √392 ≈ 19.8 m/s.',
      takeaway: 'Solve R = v²/g for speed when the angle is 45°.',
    },

    // ---------------- two trajectories ----------------
    {
      id: 'ht-two-paths',
      type: 'concept',
      phase: 'build',
      concept: 'complementary-angles',
      title: 'The flat shot and the lob',
      body: 'Because complementary angles share a range, most targets can be hit two ways: a fast, flat liner, or a high, slow lob. Same landing spot, very different flight.',
      keyPoints: [
        'Flat shot (small angle): fast, low, arrives quickly.',
        'Lob (large angle): high, slow, hangs in the air.',
        'They meet only at 45°, where there is just one answer.',
      ],
    },
    {
      id: 'ht-tap-landing',
      type: 'tap-landing',
      phase: 'practice',
      concept: 'range-reasoning',
      prompt:
        'No arc shown. This shot launches at 40° and 24 m/s. Predict where it lands — drag the marker on the ground, then fire to check.',
      sim: { angleDeg: 40, speed: 24, gravity: 9.8, editable: [] },
      tolerance: 5,
      explanation:
        'Range = v²·sin(2θ)/g = 576·sin80°/9.8 ≈ 58 m. The shot carries farther than it looks because of its high speed.',
      takeaway: 'Trust the formula to call the landing before you fire.',
    },
    {
      id: 'ht-aim-2',
      type: 'sim-challenge',
      phase: 'practice',
      concept: 'angle-range',
      prompt: 'Tougher: land on the target 60 m away. You will need a healthy combination of angle and speed.',
      sim: {
        angleDeg: 35,
        speed: 20,
        gravity: 9.8,
        editable: ['angle', 'speed'],
        target: { distance: 60, radius: 3 },
      },
      goal: { kind: 'hitTarget' },
      hints: [
        '60 m is far — lean toward 45° and add speed.',
        'At 45°, R = v²/g, so reaching 60 m needs about 24 m/s.',
        'Try 45° and a speed near 24–25 m/s.',
      ],
      explanation: 'At 45°, v = √(60·9.8) ≈ 24.2 m/s lands right on 60 m. Other angle/speed pairs work too.',
      takeaway: 'Farther targets push you toward 45° and more speed.',
    },

    // ---------------- time aloft + components ----------------
    {
      id: 'ht-time-numeric',
      type: 'numeric',
      phase: 'practice',
      concept: 'trajectory-shape',
      prompt: 'A shot leaves at v = 24 m/s, θ = 50°. How long is it in the air? (t = 2·v·sinθ/g, sin50° ≈ 0.766)',
      answer: 3.75,
      unit: 's',
      tolerance: 0.3,
      min: 0,
      max: 15,
      hints: ['First find v_y = v·sinθ.', 't = 2·v_y/g = 2·(24·0.766)/9.8.'],
      explanation: 'v_y = 24·sin50° ≈ 18.4 m/s, so t = 2·18.4/9.8 ≈ 3.75 s.',
      solution: ['v_y = 24 · 0.766 ≈ 18.4 m/s.', 't = 2·v_y/g = 36.8 / 9.8.', '≈ 3.75 s.'],
      takeaway: 'Time aloft comes only from the upward part v_y.',
    },
    {
      id: 'ht-vx-numeric',
      type: 'numeric',
      phase: 'practice',
      concept: 'components',
      prompt: 'A shot is fired at v = 25 m/s, θ = 37°. What is its sideways speed v_x? (cos37° ≈ 0.799)',
      answer: 20,
      unit: 'm/s',
      tolerance: 0.6,
      min: 0,
      max: 30,
      hints: ['v_x = v·cosθ.', '25 · 0.799.'],
      explanation: 'v_x = 25·cos37° ≈ 25·0.799 ≈ 20 m/s. This stays constant for the whole flight.',
      solution: ['v_x = v·cosθ = 25 · 0.799.', '≈ 20 m/s.'],
      takeaway: 'Sideways speed is constant — it carries the ball downrange.',
    },

    // ---------------- obstacle ----------------
    {
      id: 'ht-wall',
      type: 'sim-challenge',
      phase: 'practice',
      concept: 'range-reasoning',
      prompt: 'Final challenge: clear the 6 m wall 25 m away AND land beyond it. Manage height and distance together.',
      sim: {
        angleDeg: 35,
        speed: 18,
        gravity: 9.8,
        editable: ['angle', 'speed'],
        wall: { distance: 25, height: 6, width: 2 },
      },
      goal: { kind: 'clearWall' },
      hints: [
        'You need height to top the wall AND distance to land past it.',
        'A steeper angle buys height; more speed buys distance.',
        'Try about 50° with a speed near 22–24 m/s.',
      ],
      explanation:
        'Clearing an obstacle means reasoning about both motions at once: enough upward speed to top 6 m, enough total range to land past 27 m.',
      takeaway: 'Obstacles force you to manage height and distance together.',
    },

    // ---------------- MASTER ----------------
    {
      id: 'ht-recall-1',
      type: 'recall',
      phase: 'master',
      concept: 'range-reasoning',
      prompt: 'From memory: at a 45° launch, the range simplifies to which expression?',
      choices: [
        { id: 'v2g', label: 'v² / g' },
        { id: 'vg', label: 'v / g' },
        { id: '2vg', label: '2v / g' },
      ],
      correctId: 'v2g',
      explanation: 'At 45°, sin(2θ) = sin90° = 1, so R = v²·1/g = v²/g.',
      takeaway: 'At 45°, R = v²/g.',
    },
    {
      id: 'ht-recall-2',
      type: 'recall',
      phase: 'master',
      concept: 'complementary-angles',
      prompt: 'From memory: a 25° shot lands 50 m away. Which other angle lands at 50 m with the same speed?',
      choices: [
        { id: '55', label: '55°' },
        { id: '65', label: '65°' },
        { id: '75', label: '75°' },
      ],
      correctId: '65',
      explanation: '25° and 65° are complementary (sum to 90°), so they share the same range.',
      takeaway: 'Complement of θ = 90° − θ shares the range.',
    },
    {
      id: 'ht-synthesis',
      type: 'mcq',
      phase: 'master',
      concept: 'angle-range',
      prompt:
        'A target sits at exactly your launcher’s maximum range for its fixed speed. How many launch angles can hit it?',
      choices: [
        { id: 'one', label: 'Exactly one (45°)' },
        { id: 'two', label: 'Two complementary angles' },
        { id: 'none', label: 'None — it is impossible' },
      ],
      correctId: 'one',
      perChoiceFeedback: {
        one: 'Right — at maximum range the two solutions merge into the single 45° peak.',
        two: 'Two angles work for distances BELOW the max. At the very max they collapse into one.',
        none: 'It is reachable — but only just, at the single 45° peak.',
      },
      explanation:
        'For any distance below maximum, two complementary angles hit it. At the maximum range itself, those two solutions merge into the single 45° launch.',
      takeaway: 'At maximum range there is exactly one angle: 45°.',
    },
  ],
}
