import type { Lesson } from '../types/content'

// Hand-authored lesson. Every explanation, hint, and feedback string is written
// by a human; checking is deterministic. This is the foundation lesson: motion
// ideas are built from the ground up — position first, then displacement, then
// speed vs. velocity, then average velocity, and finally velocity as the slope
// of a position-time graph. No cannon / projectile content appears here.

export const positionVelocityLesson: Lesson = {
  id: 'position-velocity',
  courseId: 'kinematics',
  order: 1,
  title: 'Position & Velocity',
  concept: 'Where something is, how far it moved, and how fast — with direction.',
  // ~20 graded/teaching steps for a no-prerequisite foundation lesson.
  // course.ts lessonMetas (line ~34) is kept in sync at estMinutes: 16.
  estMinutes: 16,
  prerequisites: [],
  playable: true,
  intro: {
    hook: 'Two runners both clock "8 meters per second." One is pulling away from you to the east; the other is sprinting straight back to the west. Their speedometers agree — so are they really moving the same way?',
    objectives: [
      'Anchor position with an origin and a + / − direction',
      'Separate distance travelled from displacement',
      'Tell the difference between speed and velocity',
      'Compute average velocity as displacement over time',
      'Read velocity as the slope of a position-time graph',
    ],
    whyItMatters:
      'Position and velocity are the vocabulary of all motion. Get them precise here and every later lesson — free fall, projectiles, aiming — clicks into place.',
  },
  bigIdea:
    'Velocity is displacement over time WITH a direction. On a position-time graph it is simply the slope: steeper means faster, downhill means going backward.',
  steps: [
    // ======================= PREDICT =======================
    {
      // S12: Q1 pays off the intro hook — the SAME two runners, both at 8 m/s.
      // The two-runners game shows each runner's velocity but omits the
      // "different velocity" verdict line, so it doesn't give the answer away.
      id: 'pv-hook',
      type: 'predict',
      phase: 'predict',
      concept: 'speed-vs-velocity',
      prompt:
        'Back to our two runners: both clock 8 m/s. One sprints away to the east, the other heads straight back to the west. Do they have the same velocity?',
      choices: [
        { id: 'yes', label: 'Yes — both read 8 m/s' },
        { id: 'no', label: 'No — they move in opposite directions' },
        { id: 'depends', label: 'Only if they started at the same place' },
      ],
      correctId: 'no',
      perChoiceFeedback: {
        yes: 'Same speed, yes — but velocity also carries direction, and theirs are opposite.',
        no: 'Exactly. Velocity = speed + direction. Opposite directions mean different velocities.',
        depends: 'Starting point does not matter; the directions are opposite, so the velocities differ.',
      },
      explanation:
        'Speed is just "how fast" (a number). Velocity is "how fast, and which way." Same speed, opposite directions = different velocities. We will make this precise in a moment.',
      takeaway: 'Velocity carries a direction; speed does not.',
      game: { kind: 'two-runners', config: { v1: 8, v2: -8 } },
    },
    {
      // Second predict-first hook, seeding displacement before it is defined.
      id: 'pv-predict-displacement',
      type: 'predict',
      phase: 'predict',
      concept: 'displacement',
      prompt:
        'You walk 4 m east, then turn around and walk 4 m back west. How far are you from where you started?',
      choices: [
        { id: '8', label: '8 m — that is how far I walked' },
        { id: '0', label: '0 m — I am back where I began' },
        { id: '4', label: '4 m — halfway counts' },
      ],
      correctId: '0',
      perChoiceFeedback: {
        '8': '8 m is the ground you covered (distance). But where you ENDED is what we are asking.',
        '0': 'Right — you returned to the start, so your net change in position is zero.',
        '4': 'You walked the full 4 m back, so you are not halfway — you are all the way home.',
      },
      explanation:
        'You covered 8 m of ground, but you ended exactly where you began — so your change in position is 0. That gap between "ground covered" and "where you ended" is the heart of this lesson.',
      takeaway: 'Where you END can differ wildly from how far you walked.',
      game: { kind: 'scenario-line', config: { legs: [4, -4] } },
    },

    // ======================= EXPLORE =======================
    {
      // S3: ANCHOR POSITION — the definition the lesson title promises.
      id: 'pv-position-concept',
      type: 'concept',
      phase: 'explore',
      concept: 'displacement',
      title: 'Position: pick an origin, pick a direction',
      body: 'Before "how fast" comes "where." To describe position we lay down a number line: choose a starting point called the origin (0), then pick which way counts as positive. Here, east is + and west is −. Now every spot has a signed number — +5 m is 5 m east of the origin, −3 m is 3 m west of it.',
      keyPoints: [
        'Origin: the agreed zero point you measure everything from.',
        'Direction: one way is + (we use east), the other is − (west).',
        'Position is a signed number: it says how far AND which side of the origin.',
      ],
    },

    // ======================= BUILD =======================
    // ---- displacement vs distance ----
    {
      id: 'pv-displacement-concept',
      type: 'concept',
      phase: 'build',
      concept: 'displacement',
      title: 'Distance vs. displacement',
      body: 'Walk 3 m east, then 1 m back west. Your feet covered 4 m of ground (distance), but you only ended up 2 m east of where you started (displacement). Distance is the total path; displacement is just the signed gap from start to finish.',
      keyPoints: [
        'Distance: total ground covered — always adds up, never negative.',
        'Displacement: final position − start position — can be negative or zero.',
        'A round trip racks up distance but has ZERO displacement.',
      ],
    },
    {
      id: 'pv-displacement-mcq',
      type: 'mcq',
      phase: 'build',
      concept: 'displacement',
      prompt: 'You walk 5 m east, then 2 m west. What is your displacement from the start?',
      choices: [
        { id: '7', label: '7 m' },
        { id: '3e', label: '3 m east' },
        { id: '3w', label: '3 m west' },
      ],
      correctId: '3e',
      perChoiceFeedback: {
        '7': '7 m is the total distance walked, not the displacement.',
        '3e': 'Right: 5 east − 2 west = 3 m east from where you began.',
        '3w': 'Check the direction — you went farther east than west, so you end up east.',
      },
      explanation:
        'Displacement = 5 m east − 2 m west = 3 m east. Distance walked was 7 m, but net position changed by only 3 m east.',
      takeaway: 'Displacement is net change in position, not total ground covered.',
      game: { kind: 'scenario-line', config: { legs: [5, -2] } },
    },
    {
      // S6 + S7 + S9: the old mis-tagged "7 m/s × 5 s = 35 m" numeric becomes a
      // GRADED do-it-yourself drag, correctly framed as position = v·t.
      id: 'pv-plot-position',
      type: 'plot-position',
      phase: 'build',
      concept: 'displacement',
      prompt:
        'An object starts at the origin and moves east at a steady 7 m/s. Drag the marker to where it is after 5 seconds.',
      velocity: 7,
      time: 5,
      tolerance: 1.5,
      hints: [
        'At a constant velocity, position = velocity × time.',
        'That is 7 m/s × 5 s. Drag the marker there.',
      ],
      explanation:
        'At a steady velocity, position = velocity × time = 7 × 5 = 35 m east of the origin.',
      takeaway: 'At constant velocity, position = v · t.',
    },

    // ---- speed vs velocity ----
    {
      id: 'pv-speed-velocity-concept',
      type: 'concept',
      phase: 'build',
      concept: 'speed-vs-velocity',
      title: 'Speed vs. velocity',
      body: 'These two words are casual twins in everyday talk, but physics keeps them apart. Speed is a plain number; velocity also points somewhere — and now that we have a signed number line, "which way" just means the + or − direction we chose.',
      keyPoints: [
        'Speed: how fast, a single positive number (a "scalar").',
        'Velocity: how fast AND in what direction (a "vector").',
        'A sign (+/−) is the simplest way to show direction along a line.',
      ],
    },
    {
      id: 'pv-speed-velocity-mcq',
      type: 'mcq',
      phase: 'build',
      concept: 'speed-vs-velocity',
      prompt: 'Which statement gives a velocity, not just a speed?',
      choices: [
        { id: 'a', label: '"The train moved at 30 m/s."' },
        { id: 'b', label: '"The train moved at 30 m/s, heading east."' },
        { id: 'c', label: '"The train travelled 30 meters."' },
      ],
      correctId: 'b',
      perChoiceFeedback: {
        a: 'That is a speed — a number with no direction.',
        b: 'Yes — it has both a size (30 m/s) and a direction (east). That is a velocity.',
        c: 'That is a distance, not a rate at all.',
      },
      explanation: 'A velocity must state a direction. "30 m/s east" qualifies; "30 m/s" alone is only speed.',
      takeaway: 'No direction stated → it is speed, not velocity.',
      game: { kind: 'none' },
    },

    // ---- average velocity ----
    {
      id: 'pv-avg-velocity-concept',
      type: 'concept',
      phase: 'build',
      concept: 'avg-velocity',
      title: 'Average velocity',
      body: 'Average velocity packs the whole trip into one number: how much your position changed, divided by how long it took. It leans on everything so far — displacement supplies the top, and its sign supplies the direction.',
      formula: {
        expr: 'v_avg = Δx / Δt',
        terms: [
          { symbol: 'v_avg', meaning: 'average velocity (m/s)' },
          { symbol: 'Δx', meaning: 'displacement (final − start position)' },
          { symbol: 'Δt', meaning: 'time taken (s)' },
        ],
      },
      keyPoints: [
        'Use displacement, not distance — direction matters.',
        'If you end where you started, Δx = 0, so average velocity = 0.',
      ],
    },

    // ======================= PRACTICE =======================
    // ---- average velocity practice (built-then-practiced, contiguous) ----
    {
      // S4: the ONE allowed straight plug-in for average velocity. Comes
      // immediately after the avg-velocity concept so it is practiced at once.
      id: 'pv-avg-numeric-1',
      type: 'numeric',
      phase: 'practice',
      concept: 'avg-velocity',
      prompt: 'A cyclist rides 100 m straight down a path in 20 s. What is the average velocity?',
      answer: 5,
      unit: 'm/s',
      tolerance: 0.2,
      min: 0,
      max: 50,
      hints: ['Use v_avg = Δx / Δt.', 'That is 100 ÷ 20.'],
      explanation: 'v_avg = Δx / Δt = 100 m / 20 s = 5 m/s.',
      solution: ['Write v_avg = Δx / Δt.', 'Substitute: v_avg = 100 / 20.', '= 5 m/s.'],
      takeaway: 'Average velocity = displacement ÷ time.',
      // Different numbers (90 m / 15 s = 6 m/s) so it models the method, never
      // the answer (5). avg-velocity-trip is an exempt game (no value readout).
      game: { kind: 'avg-velocity-trip', config: { distance: 90, time: 15 } },
    },
    {
      // S8 (part 1) + S4: genuinely-different second numeric — average SPEED of a
      // there-and-back trip (uses total DISTANCE). Sets up the velocity contrast.
      id: 'pv-avg-speed-numeric',
      type: 'numeric',
      phase: 'practice',
      concept: 'avg-velocity',
      prompt:
        'You walk 30 m east, then 10 m back west, and the whole trip takes 8 s. What is your average SPEED?',
      answer: 5,
      unit: 'm/s',
      tolerance: 0.2,
      min: 0,
      max: 30,
      hints: [
        'Average speed uses total DISTANCE, not displacement.',
        'Total distance = 30 + 10 = 40 m. Then divide by 8 s.',
      ],
      explanation:
        'Average speed = total distance ÷ time = (30 + 10) / 8 = 40 / 8 = 5 m/s. (Your displacement was only 20 m east — hold that thought for the next question.)',
      solution: [
        'Average speed uses total distance covered, ignoring direction.',
        'Distance = 30 + 10 = 40 m.',
        'Average speed = 40 / 8 = 5 m/s.',
      ],
      takeaway: 'Average speed adds up all the ground covered, ignoring direction.',
      // Was scenario-line, whose always-on readout exposed the 40 m total
      // distance (the pivotal intermediate) and the 20 m displacement. Swapped to
      // the exempt avg-velocity-trip with unrelated numbers (80 m / 10 s = 8 m/s):
      // models distance ÷ time without revealing the answer (5) or the 40 m total.
      game: { kind: 'none' },
    },
    {
      // S8 (part 2): the key discrimination — round-trip, average velocity = 0.
      id: 'pv-roundtrip-predict',
      type: 'predict',
      phase: 'practice',
      concept: 'avg-velocity',
      prompt:
        'A runner does one full lap of a 400 m track and stops exactly where they started, taking 80 s. What is their average VELOCITY?',
      choices: [
        { id: '5', label: '5 m/s' },
        { id: '0', label: '0 m/s' },
        { id: '400', label: '400 m/s' },
      ],
      correctId: '0',
      perChoiceFeedback: {
        '5': 'That is the average SPEED (400 m of distance ÷ 80 s). Velocity uses displacement.',
        '0': 'Exactly. They finished where they started, so displacement is 0 — and 0 ÷ 80 = 0.',
        '400': 'That mixes up the numbers; check the units and the formula (displacement ÷ time).',
      },
      explanation:
        'Displacement for a full lap is 0 (start = finish), so average velocity = 0 / 80 = 0 m/s. Average SPEED, by contrast, is 400 / 80 = 5 m/s — the same trip, two very different numbers.',
      takeaway: 'Round trip: average velocity is zero, even though you moved.',
      game: { kind: 'round-trip', config: { speed: 8 } },
    },
    {
      // Brief consolidation of the discrimination just practiced.
      id: 'pv-avg-zero-concept',
      type: 'concept',
      phase: 'practice',
      concept: 'avg-velocity',
      title: 'Why average velocity can be zero',
      body: 'On a round trip you clearly moved — yet your average velocity is zero. That is the whole point of displacement: it cares only about start and end, not the path between. Average speed stays positive; average velocity can vanish. Direction is exactly what makes the two differ.',
      keyPoints: [
        'Average speed uses distance — positive whenever you moved.',
        'Average velocity uses displacement — zero for a round trip.',
        'Same trip, different answers: that gap IS the speed-vs-velocity idea.',
      ],
    },
    {
      // S11: multi-step capstone — find displacement first, THEN average velocity.
      id: 'pv-capstone-multistep',
      type: 'numeric',
      phase: 'practice',
      concept: 'avg-velocity',
      prompt:
        'You walk 8 m east, then 3 m back west, taking 5 s in total. What is your average velocity? (Use displacement, and give the size in m/s — east is positive.)',
      answer: 1,
      unit: 'm/s',
      tolerance: 0.1,
      min: 0,
      max: 20,
      hints: [
        'First find displacement: 8 m east − 3 m west.',
        'Displacement = 5 m east. Then divide by the 5 s.',
      ],
      explanation:
        'Step 1: displacement = 8 − 3 = 5 m east. Step 2: v_avg = Δx / Δt = 5 / 5 = 1 m/s east. (Average speed would have used 8 + 3 = 11 m of distance instead.)',
      solution: [
        'Find displacement first: 8 m east − 3 m west = 5 m east.',
        'Average velocity = displacement / time = 5 / 5.',
        '= 1 m/s east.',
      ],
      takeaway: 'Multi-step trips: collapse the legs into displacement first, then divide by time.',
      // Was scenario-line, whose always-on readout pre-computed the 5 m
      // displacement (the step's core result) — making the rest trivial. Swapped
      // to the exempt avg-velocity-trip with unrelated numbers (100 m / 25 s =
      // 4 m/s): models displacement ÷ time without revealing the 5 m intermediate
      // or the 1 m/s answer.
      game: { kind: 'scenario-line', config: { legs: [8, -3] } },
    },

    // ---- velocity as the slope of a graph (the LAST concept, taught as one
    // contiguous graph block: the position-time sandbox, then the slope rule,
    // then the slope prediction and the graded graph read). Placed AFTER all
    // average-velocity practice so slope stays last, per the intro/bigIdea
    // ordering. Phases held at 'practice' to keep the arc non-decreasing. ----
    {
      // S5: ungraded position-time sandbox, relocated to sit immediately before
      // the slope teaching so ALL graph instruction is one contiguous run.
      id: 'pv-graph-explore',
      type: 'interactive',
      phase: 'practice',
      widget: 'motion-graph',
      config: { velocity: 4 },
      title: 'Watch position change over time',
      body: 'This is a position-time graph: time runs sideways, position runs up. Set a velocity and press Play to watch a dot trace the line. Try a big velocity and a small one, and notice how fast position climbs from the origin.',
      keyPoints: [
        'A bigger velocity makes position climb faster — a steeper line.',
        'A small velocity makes a gentle line.',
        'Constant velocity always makes a straight line.',
      ],
    },
    {
      id: 'pv-slope-concept',
      type: 'concept',
      phase: 'practice',
      concept: 'velocity-graph',
      title: 'Reading velocity off a graph',
      body: 'You just watched position climb on the graph. Now name what that climb IS: on a position-time graph the velocity is literally the slope of the line — how much position rises for each second of run. It is the same Δx / Δt, read straight off the picture.',
      formula: {
        expr: 'v = (x₂ − x₁) / (t₂ − t₁)',
        terms: [
          { symbol: 'v', meaning: 'velocity (slope of the line)' },
          { symbol: 'x₂ − x₁', meaning: 'change in position (rise)' },
          { symbol: 't₂ − t₁', meaning: 'change in time (run)' },
        ],
      },
      keyPoints: [
        'A straight line = constant velocity.',
        'A flat line = not moving.',
        'A downhill line = negative velocity (moving backward).',
      ],
    },
    {
      id: 'pv-graph-predict-slope',
      type: 'predict',
      phase: 'practice',
      concept: 'velocity-graph',
      prompt: 'On a position-time graph, a steeper upward line means the object is...',
      choices: [
        { id: 'faster', label: 'Moving faster' },
        { id: 'slower', label: 'Moving slower' },
        { id: 'still', label: 'Standing still' },
      ],
      correctId: 'faster',
      perChoiceFeedback: {
        faster: 'Right — more position covered per second is a steeper slope.',
        slower: 'A steeper line covers ground faster, not slower.',
        still: 'Standing still is a flat line. Steeper means more motion, not less.',
      },
      explanation:
        'Slope = rise over run = change in position over change in time = velocity. Steeper slope, larger velocity.',
      takeaway: 'Steeper position-time line = faster.',
      game: { kind: 'motion-graph', config: { velocity: 6 } },
    },
    {
      // S2: the graded graph read, contiguous with the graph teaching above.
      id: 'pv-graph-numeric',
      type: 'numeric',
      phase: 'practice',
      concept: 'velocity-graph',
      prompt:
        'On a position-time graph, an object goes in a straight line from 0 m to 40 m over 5 seconds. What is its velocity?',
      answer: 8,
      unit: 'm/s',
      tolerance: 0.3,
      min: 0,
      max: 50,
      hints: ['Velocity is the slope: rise ÷ run.', 'Rise = 40 m, run = 5 s, so 40 ÷ 5.'],
      explanation: 'v = (40 − 0) / (5 − 0) = 40 / 5 = 8 m/s.',
      solution: ['Velocity is the slope: rise / run.', 'Substitute: v = 40 / 5.', '= 8 m/s.'],
      takeaway: 'Velocity from a graph = rise ÷ run.',
      // Numeric → MotionGraph auto-enters quiz mode (hides the readout), so safe.
      game: { kind: 'motion-graph', config: { velocity: 8 } },
    },

    // ======================= MASTER =======================
    {
      id: 'pv-recall-velocity',
      type: 'recall',
      phase: 'master',
      concept: 'speed-vs-velocity',
      prompt: 'From memory: what does velocity have that speed does not?',
      choices: [
        { id: 'size', label: 'A bigger number' },
        { id: 'dir', label: 'A direction' },
        { id: 'unit', label: 'Different units' },
      ],
      correctId: 'dir',
      explanation: 'Velocity is speed plus a direction. Same units (m/s), but velocity points somewhere.',
      takeaway: 'Velocity = speed + direction.',
      game: { kind: 'none' },
    },
    {
      // S10: displacement retrieval — previously absent from Master.
      id: 'pv-recall-displacement',
      type: 'recall',
      phase: 'master',
      concept: 'displacement',
      prompt: 'From memory: displacement is best described as...',
      choices: [
        { id: 'ground', label: 'The total ground you covered' },
        { id: 'net', label: 'The net change in position (final − start)' },
        { id: 'pos', label: 'Always a positive number' },
      ],
      correctId: 'net',
      explanation:
        'Displacement is the net change in position — final minus start, with a sign. Total ground covered is distance; displacement can be negative or zero.',
      takeaway: 'Displacement = final position − start position.',
      game: { kind: 'none' },
    },
    {
      id: 'pv-recall-avg',
      type: 'recall',
      phase: 'master',
      concept: 'avg-velocity',
      prompt: 'From memory: average velocity equals which of these?',
      choices: [
        { id: 'dist', label: 'Total distance ÷ time' },
        { id: 'disp', label: 'Displacement ÷ time' },
        { id: 'speed', label: 'Top speed ÷ 2' },
      ],
      correctId: 'disp',
      explanation: 'Average velocity = displacement ÷ time. Using distance instead would give average speed.',
      takeaway: 'It is displacement over time — direction included.',
      game: { kind: 'none' },
    },
    {
      // Cold graph synthesis to retrieve the slope idea with no aids (S2, S15).
      id: 'pv-master-graph',
      type: 'mcq',
      phase: 'master',
      concept: 'velocity-graph',
      prompt: 'A position-time graph shows a perfectly flat horizontal line for 10 seconds. What is happening?',
      choices: [
        { id: 'fast', label: 'The object is moving very fast' },
        { id: 'rest', label: 'The object is at rest' },
        { id: 'back', label: 'The object is moving backward' },
      ],
      correctId: 'rest',
      perChoiceFeedback: {
        fast: 'Fast would be a steep line. Flat means the position is not changing.',
        rest: 'Right — no change in position means zero slope, zero velocity: at rest.',
        back: 'Backward would slope downhill. Flat is no motion at all.',
      },
      explanation: 'A flat position-time line has zero slope, so the velocity is zero — the object is standing still.',
      takeaway: 'Flat line = zero velocity = at rest.',
      game: { kind: 'motion-graph', config: { velocity: 0 } },
    },
  ],
}
