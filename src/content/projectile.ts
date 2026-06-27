import type { Lesson } from '../types/content'

// Every explanation, hint, and feedback string below is hand-written.
// No AI generated any of this content (Phase 1 hard rule). g = 9.8 m/s^2.

export const projectileLesson: Lesson = {
  id: 'projectile-motion',
  courseId: 'kinematics',
  order: 3,
  title: 'Projectile Motion',
  concept: 'Horizontal and vertical motion are independent; gravity only pulls down.',
  estMinutes: 25,
  prerequisites: [],
  playable: true,
  intro: {
    hook: 'Throw a ball and it traces a smooth arc every single time. What decides where it lands — and why is the path always the same shape?',
    objectives: [
      'Split any launch velocity into a sideways part and an upward part',
      'Explain why horizontal and vertical motion are independent',
      'Use the formulas for time aloft, peak height, and range',
      'Aim a launch to hit a target and clear an obstacle',
    ],
    whyItMatters:
      'This one idea powers basketball shots, water fountains, video-game ballistics, and spacecraft trajectories. Master it here on a simple arc and you own the reasoning everywhere it appears.',
  },
  bigIdea:
    'Every projectile is two simple motions at once: steady sideways travel, and gravity-driven up-and-down. They share only a clock, never interfering — and that is the whole secret of the arc.',
  steps: [
    // ---------------- PREDICT ----------------
    {
      id: 'hook',
      type: 'predict',
      phase: 'predict',
      concept: 'gravity-independence',
      prompt:
        'You fire one ball straight sideways and drop another from the same height at the exact same instant. Which one hits the ground first?',
      choices: [
        { id: 'thrown', label: 'The one fired sideways' },
        { id: 'dropped', label: 'The one dropped straight down' },
        { id: 'same', label: 'They land at the same time' },
      ],
      correctId: 'same',
      perChoiceFeedback: {
        thrown:
          'Tempting, but no. Moving sideways does not change how fast something falls. Keep this surprise in mind, we will prove it.',
        dropped:
          'It feels like the dropped one should win, but it does not. Sideways speed has no effect on falling. Hold that thought.',
        same: 'Exactly, and it feels wrong at first. Sideways motion and falling are completely separate.',
      },
      explanation:
        'Gravity pulls straight down on both balls equally. The sideways ball is also moving forward, but that horizontal motion does nothing to its fall. Both hit the ground at the same instant.',
      takeaway: 'Going sideways never changes how fast you fall.',
    },

    // ---------------- EXPLORE ----------------
    {
      id: 'drop-race',
      type: 'interactive',
      phase: 'explore',
      widget: 'drop-race',
      title: 'Prove it yourself',
      body: 'Release a dropped ball and a thrown ball at the same moment. Watch the dashed line: it touches both balls at every instant. Change the throw speed and release again — does the line ever tilt?',
      keyPoints: [
        'The line stays perfectly horizontal — equal height the whole way down.',
        'Throw speed only changes how far sideways the orange ball goes.',
        'They always land together, no matter the speed.',
      ],
    },
    {
      id: 'free-play',
      type: 'concept',
      phase: 'explore',
      title: 'Now play with a real launch',
      body: 'Back to the cannon. No rules yet — drag the sliders, tap Fire, and watch the live Range, Peak, and Air-time readouts respond. What shape is the path always? What happens to where it lands as you change the angle?',
      keyPoints: [
        'The path is always a parabola — a symmetric arc.',
        'Angle changes the shape; speed scales the whole arc bigger.',
        'Watch Range and Peak height respond as you drag.',
      ],
      visual: { angleDeg: 40, speed: 18, gravity: 9.8, editable: ['angle', 'speed'] },
    },
    {
      id: 'vector-explore',
      type: 'interactive',
      phase: 'explore',
      widget: 'vector-components',
      title: 'One speed, two parts',
      body: 'A single launch velocity secretly carries two passengers: a sideways part and an upward part. Drag the angle and speed and watch the black arrow split into an orange (sideways) and a green (upward) arrow. Notice how a steeper angle trades sideways for upward.',
      keyPoints: [
        'Low angle → mostly sideways speed, little upward speed.',
        'Steep angle → mostly upward speed, little sideways speed.',
        'At 45° the two parts are exactly equal.',
      ],
    },
    {
      id: 'predict-angle',
      type: 'predict',
      phase: 'explore',
      concept: 'angle-range',
      prompt:
        'Keep the speed fixed. Starting from a low 30 degrees and raising the angle toward 45 degrees, the ball will land...',
      choices: [
        { id: 'farther', label: 'Farther away' },
        { id: 'shorter', label: 'Shorter, closer to you' },
        { id: 'same', label: 'At the same spot' },
      ],
      correctId: 'farther',
      perChoiceFeedback: {
        farther: 'Right. Going from 30 toward 45 degrees pushes the landing point farther out.',
        shorter:
          'Try it on the simulator above. Between 30 and 45 degrees the ball actually goes farther, not shorter.',
        same: 'Not quite, the distance does change. Move the angle slider and watch the landing point shift.',
      },
      explanation:
        'A higher angle gives the ball more time in the air, which lets its forward speed carry it farther, at least up until 45 degrees.',
      takeaway: 'From 30° up to 45°, more angle means more range.',
      visual: { angleDeg: 30, speed: 20, gravity: 9.8, editable: ['angle'] },
    },
    {
      id: 'dial-best-angle',
      type: 'slider-estimate',
      phase: 'explore',
      concept: 'angle-range',
      prompt:
        'Speed is fixed. Drag the angle slider to send the ball as far as possible — watch the Range readout climb and then peak. Set it at the farthest-reaching angle.',
      sim: { angleDeg: 25, speed: 20, gravity: 9.8, editable: ['angle'] },
      judge: 'angle',
      answer: 45,
      tolerance: 6,
      hints: [
        'Keep nudging until the Range number stops growing.',
        'It peaks somewhere in the middle of the range, not at the extremes.',
      ],
      explanation:
        'Range is largest at 45°. Below it you lose air time; above it you lose forward speed. The Range readout peaks right around there.',
      takeaway: 'You discovered it by feel: 45° throws farthest.',
    },

    // ---------------- BUILD (basics + formulas) ----------------
    {
      id: 'reveal',
      type: 'concept',
      phase: 'build',
      concept: 'gravity-independence',
      title: 'Two motions, one clock',
      body: 'Here is the whole framework. Split every shot into two motions that run at the same time but never affect each other. The only thing they share is the clock.',
      keyPoints: [
        'Horizontal: constant velocity, never speeds up or slows down (no air resistance).',
        'Vertical: gravity removes 9.8 m/s of upward speed every second, then adds it back on the way down.',
        'Same clock: whatever time the fall takes, that is how long the sideways travel gets.',
      ],
      visual: { angleDeg: 50, speed: 20, gravity: 9.8, editable: ['angle', 'speed'] },
    },
    {
      id: 'components-formula',
      type: 'concept',
      phase: 'build',
      concept: 'components',
      title: 'The two starting speeds',
      body: 'To put numbers on the two motions, split the launch speed v at angle θ using trigonometry. This is the foundation everything else is built on.',
      formula: {
        expr: 'v_x = v · cos θ\nv_y = v · sin θ',
        terms: [
          { symbol: 'v', meaning: 'launch speed (m/s)' },
          { symbol: 'θ', meaning: 'launch angle from the ground' },
          { symbol: 'v_x', meaning: 'sideways speed (stays constant)' },
          { symbol: 'v_y', meaning: 'starting upward speed' },
        ],
      },
      keyPoints: [
        'cos shrinks as the angle grows → less sideways speed when steeper.',
        'sin grows as the angle grows → more upward speed when steeper.',
      ],
    },
    {
      id: 'vx-numeric',
      type: 'numeric',
      phase: 'practice',
      concept: 'components',
      prompt: 'Launch speed v = 20 m/s at θ = 30°. What is the sideways speed v_x? (v_x = v·cos θ)',
      answer: 17.3,
      unit: 'm/s',
      tolerance: 0.6,
      min: 0,
      max: 20,
      hints: ['cos 30° ≈ 0.866.', 'Multiply 20 by 0.866.'],
      explanation: 'v_x = 20 · cos 30° = 20 · 0.866 ≈ 17.3 m/s. This sideways speed never changes during the flight.',
      solution: ['Write v_x = v · cos θ.', 'cos 30° ≈ 0.866.', 'v_x = 20 · 0.866.', '≈ 17.3 m/s.'],
      takeaway: 'v_x stays constant for the entire flight.',
    },
    {
      id: 'vy-numeric',
      type: 'numeric',
      phase: 'practice',
      concept: 'components',
      prompt: 'Same launch: v = 20 m/s at θ = 30°. What is the starting upward speed v_y? (v_y = v·sin θ)',
      answer: 10,
      unit: 'm/s',
      tolerance: 0.5,
      min: 0,
      max: 20,
      hints: ['sin 30° = 0.5 exactly.', 'Half of 20.'],
      explanation: 'v_y = 20 · sin 30° = 20 · 0.5 = 10 m/s. Gravity will eat this upward speed at 9.8 m/s each second.',
      solution: ['Write v_y = v · sin θ.', 'sin 30° = 0.5.', 'v_y = 20 · 0.5.', '= 10 m/s.'],
      takeaway: 'v_y is the only part gravity fights.',
    },
    {
      id: 'time-formula',
      type: 'concept',
      phase: 'build',
      concept: 'trajectory-shape',
      title: 'How long is it in the air?',
      body: 'Gravity removes the upward speed on the way up, then gives it back on the way down — symmetric. The total time aloft depends only on the upward part v_y, never on the sideways part.',
      formula: {
        expr: 't = 2·v_y / g',
        terms: [
          { symbol: 't', meaning: 'total time in the air (s)' },
          { symbol: 'v_y', meaning: 'starting upward speed (m/s)' },
          { symbol: 'g', meaning: 'gravity, 9.8 m/s²' },
        ],
      },
      keyPoints: [
        'Time up = time down, so total time is twice the rise time.',
        'Sideways speed has zero effect on how long it stays up.',
      ],
    },
    {
      id: 'time-numeric',
      type: 'numeric',
      phase: 'practice',
      concept: 'trajectory-shape',
      prompt: 'With v_y = 10 m/s and g = 9.8, how many seconds does the ball stay in the air? (t = 2·v_y / g)',
      answer: 2.04,
      unit: 's',
      tolerance: 0.2,
      min: 0,
      max: 10,
      hints: ['Plug into t = 2·v_y / g.', 'That is 20 / 9.8.'],
      explanation: 't = 2 · 10 / 9.8 = 20 / 9.8 ≈ 2.04 s.',
      solution: ['Write t = 2·v_y / g.', 't = (2 · 10) / 9.8.', '= 20 / 9.8.', '≈ 2.04 s.'],
      takeaway: 'Air time comes only from the upward speed.',
    },
    {
      id: 'height-formula',
      type: 'concept',
      phase: 'build',
      concept: 'trajectory-shape',
      title: 'How high does it peak?',
      body: 'At the very top, all the upward speed has been cancelled by gravity. The peak height depends only on v_y.',
      formula: {
        expr: 'H = v_y² / (2g)',
        terms: [
          { symbol: 'H', meaning: 'peak height above launch (m)' },
          { symbol: 'v_y', meaning: 'starting upward speed (m/s)' },
          { symbol: 'g', meaning: 'gravity, 9.8 m/s²' },
        ],
      },
      keyPoints: ['Double the upward speed → four times the height (it is squared).'],
    },
    {
      id: 'read-height',
      type: 'numeric',
      phase: 'practice',
      concept: 'trajectory-shape',
      prompt:
        'Set the launch to 45° and 20 m/s (already set). Fire it, then read the grid: about how high does the ball reach at the top of its arc?',
      answer: 10.2,
      unit: 'm',
      tolerance: 2,
      min: 0,
      max: 30,
      hints: [
        'Compare the peak to the horizontal gridlines (every 5 m).',
        'Or compute it: v_y = 20·sin45° ≈ 14.1, then H = v_y²/(2g).',
      ],
      explanation:
        'At 45° and 20 m/s the upward speed is v_y = 20·sin45° ≈ 14.1 m/s. Peak height = 14.1² / (2·9.8) ≈ 10.2 m.',
      solution: [
        'v_y = 20 · sin 45° ≈ 14.1 m/s.',
        'H = v_y² / (2g) = (14.1)² / (2·9.8).',
        '= 199 / 19.6.',
        '≈ 10.2 m.',
      ],
      takeaway: 'Peak height comes only from the upward part of the speed.',
      visual: { angleDeg: 45, speed: 20, gravity: 9.8, editable: [] },
    },
    {
      id: 'best-angle',
      type: 'mcq',
      phase: 'build',
      concept: 'angle-range',
      prompt: 'For a fixed speed, which launch angle makes the ball travel the farthest?',
      choices: [
        { id: '15', label: '15 degrees (low and flat)' },
        { id: '45', label: '45 degrees' },
        { id: '75', label: '75 degrees (high and steep)' },
      ],
      correctId: '45',
      perChoiceFeedback: {
        '15': 'Too flat. It is fast forward but spends almost no time in the air, so it lands early.',
        '45': 'Correct. 45 degrees is the sweet spot between staying airborne and moving forward.',
        '75': 'Too steep. It stays up a long time but barely moves forward, so it lands close.',
      },
      explanation:
        '45 degrees balances the two competing needs: enough height to stay in the air, and enough forward speed to cover ground. That balance gives the maximum range.',
      takeaway: '45° is the maximum-range angle (ignoring air resistance).',
      visual: { angleDeg: 45, speed: 18, gravity: 9.8, editable: ['angle'] },
    },
    {
      id: 'range-formula-card',
      type: 'concept',
      phase: 'build',
      concept: 'range-reasoning',
      title: 'Putting it together: range',
      body: 'Range is just sideways speed times time aloft: R = v_x · t. Substitute v_x = v·cosθ and t = 2v·sinθ/g, and a trig identity folds it into one clean formula.',
      formula: {
        expr: 'R = v² · sin(2θ) / g',
        terms: [
          { symbol: 'R', meaning: 'horizontal range (m)' },
          { symbol: 'v', meaning: 'launch speed (m/s)' },
          { symbol: '2θ', meaning: 'twice the launch angle' },
          { symbol: 'g', meaning: 'gravity, 9.8 m/s²' },
        ],
      },
      keyPoints: [
        'sin(2θ) is biggest when 2θ = 90°, i.e. θ = 45° — that is why 45° wins.',
        'Double the speed → four times the range (v is squared).',
      ],
    },
    {
      id: 'complementary',
      type: 'predict',
      phase: 'build',
      concept: 'complementary-angles',
      prompt:
        'From R = v²·sin(2θ)/g: you hit 40 m using a 30° launch. Keeping the same speed, which OTHER angle also lands at about 40 m?',
      choices: [
        { id: '45', label: '45 degrees' },
        { id: '60', label: '60 degrees' },
        { id: '80', label: '80 degrees' },
      ],
      correctId: '60',
      perChoiceFeedback: {
        '45': '45 actually goes farther than 40 m at that speed. Look for the angle that mirrors 30.',
        '60': 'Yes. sin(2·30°) = sin60° and sin(2·60°) = sin120° are equal, so the ranges match.',
        '80': 'Too steep, that lands much shorter. Look for the angle that pairs with 30 to make 90.',
      },
      explanation:
        'Angles that add up to 90° (like 30 and 60) give sin(2θ) the same value, so they produce the same range. One is a flat fast shot, the other a high lob — same landing spot.',
      takeaway: 'Angles that sum to 90° share the same range.',
      visual: { angleDeg: 30, speed: 22, gravity: 9.8, editable: ['angle'], ghost: { angleDeg: 30, speed: 22 } },
    },

    // ---------------- PRACTICE ----------------
    {
      id: 'range-numeric-45',
      type: 'numeric',
      phase: 'practice',
      concept: 'range-reasoning',
      prompt: 'Use R = v²·sin(2θ)/g. For v = 25 m/s, θ = 45°, g = 9.8, what is the range R?',
      answer: 63.8,
      unit: 'm',
      tolerance: 2.5,
      min: 0,
      max: 120,
      hints: ['sin(2·45°) = sin90° = 1, so R = v²/g.', 'That is 25 · 25 / 9.8.'],
      explanation: 'At 45°, sin90° = 1, so R = v²/g = 625 / 9.8 ≈ 63.8 m.',
      solution: ['2θ = 90°, and sin90° = 1.', 'So R = v² / g.', 'R = 25² / 9.8 = 625 / 9.8.', '≈ 63.8 m.'],
      takeaway: 'At 45°, range simplifies to v² / g.',
    },
    {
      id: 'range-numeric-30',
      type: 'numeric',
      phase: 'practice',
      concept: 'range-reasoning',
      prompt: 'Now a non-45° case. For v = 20 m/s, θ = 30°, what is the range? (sin60° ≈ 0.866)',
      answer: 35.3,
      unit: 'm',
      tolerance: 2,
      min: 0,
      max: 100,
      hints: ['2θ = 60°, and sin60° ≈ 0.866.', 'R = 20² · 0.866 / 9.8 = 400 · 0.866 / 9.8.'],
      explanation: 'R = v²·sin(2θ)/g = 400 · sin60° / 9.8 = 400 · 0.866 / 9.8 ≈ 35.3 m.',
      solution: ['2θ = 60°, sin60° ≈ 0.866.', 'R = 400 · 0.866 / 9.8.', '= 346.4 / 9.8.', '≈ 35.3 m.'],
      takeaway: 'The full formula handles any angle, not just 45°.',
    },
    {
      id: 'predict-landing',
      type: 'tap-landing',
      phase: 'practice',
      concept: 'range-reasoning',
      prompt:
        'No arc shown this time. This shot launches at 35° and 22 m/s. Before firing, predict where it lands — tap or drag the marker on the ground, then fire to check.',
      sim: { angleDeg: 35, speed: 22, gravity: 9.8, editable: [] },
      tolerance: 5,
      explanation:
        'Range = sideways speed × time aloft. Here v_x = 22·cos35° ≈ 18.0 m/s and it stays airborne about 2.6 s, so it travels ≈ 46 m.',
      takeaway: 'Range is just sideways speed times how long it stays up.',
    },
    {
      id: 'hit-target',
      type: 'sim-challenge',
      phase: 'practice',
      concept: 'angle-range',
      prompt: 'Time to aim. Adjust the angle and speed to land the ball on the target 40 m away.',
      sim: {
        angleDeg: 30,
        speed: 18,
        gravity: 9.8,
        editable: ['angle', 'speed'],
        target: { distance: 40, radius: 2.5 },
      },
      goal: { kind: 'hitTarget' },
      hints: [
        'Remember 45 degrees gives you the most distance for a given speed.',
        'If you are landing short, add speed. If you overshoot, ease the speed back.',
        'Try 45 degrees and a speed near 20 m/s.',
      ],
      explanation:
        'Nice shot. Range depends on both angle and speed. Near 45 degrees, a speed around 20 m/s lands right at 40 m.',
      takeaway: 'To reach a target, trade off angle and speed together.',
    },
    {
      id: 'clear-wall',
      type: 'sim-challenge',
      phase: 'practice',
      concept: 'range-reasoning',
      prompt: 'Clear the 5 m wall standing 30 m away, and make sure the ball lands beyond it.',
      sim: {
        angleDeg: 35,
        speed: 18,
        gravity: 9.8,
        editable: ['angle', 'speed'],
        wall: { distance: 30, height: 5, width: 2 },
      },
      goal: { kind: 'clearWall' },
      hints: [
        'You need both height to clear the wall and enough distance to land past it.',
        'A steeper angle gains height; more speed gains distance. You likely need both.',
        'Try about 45 degrees with a speed near 22 to 24 m/s.',
      ],
      explanation:
        'To clear an obstacle you reason about height and distance together: enough upward motion to top the wall, enough forward motion to land beyond it.',
      takeaway: 'Clearing obstacles means managing height and distance at once.',
    },

    // ---------------- MASTER ----------------
    {
      id: 'recall',
      type: 'recall',
      phase: 'master',
      concept: 'gravity-independence',
      prompt:
        'From memory, no simulator: a ball rolls off a table while another is dropped from the same height at the same moment. Which hits the floor first?',
      choices: [
        { id: 'rolled', label: 'The one that rolled off (it was moving)' },
        { id: 'dropped', label: 'The dropped one' },
        { id: 'same', label: 'They hit at the same time' },
      ],
      correctId: 'same',
      explanation:
        'Same time. You proved it with the drop race: horizontal motion is independent of vertical motion, so both fall identically.',
      takeaway: 'Horizontal motion never changes the fall — the core idea, locked in.',
    },
    {
      id: 'synthesis',
      type: 'mcq',
      phase: 'master',
      concept: 'complementary-angles',
      prompt:
        'A player kicks a ball at 25° and it lands 30 m away. With the exact same speed, which angle would also land it about 30 m away?',
      choices: [
        { id: '40', label: '40 degrees' },
        { id: '65', label: '65 degrees' },
        { id: '90', label: '90 degrees (straight up)' },
      ],
      correctId: '65',
      perChoiceFeedback: {
        '40': 'Close idea, but the pair must add to 90°. 25 + 40 = 65, not 90.',
        '65': 'Exactly — 25° and 65° add to 90°, so they share the same range.',
        '90': 'Straight up has zero range; it comes right back down to the start.',
      },
      explanation:
        'Complementary angles (summing to 90°) give equal range. 25° pairs with 65°. The 65° kick is a higher, slower-looking lob that lands in the same spot.',
      takeaway: 'Spotting complementary angles lets you find a second solution instantly.',
    },
  ],
}
