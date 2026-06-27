# BrainLift: Build Brilliant (Physics, Learned by Doing)

## Owners

Sina (builder and sole author)

## Purpose

This BrainLift lays out how I think a physics app should actually teach, and makes that thinking legible enough that any AI I build with pushes toward it instead of sliding back to the usual "video plus quiz."

My core belief: people don't learn physics by being told physics. They learn it by predicting, being wrong, poking at a model, and only then getting handed the idea that explains what they just felt. Build Brilliant is that belief turned into a product. One subject (kinematics), gone deep, where every concept starts as a problem you can touch and get wrong, feedback is instant and specific, and AI is bolted on to amplify the teaching, never to be the source of truth.

### Who it's for (persona)

I designed the whole app for one specific learner, "Maya": a college student or a self-teaching adult brushing up on foundational physics in short, mobile sessions. She isn't failing physics, she just never got the intuition to click. She wants understanding, not a lecture; she's studying on her phone in 5 to 15 minute bursts between other things; and she stays motivated by visible progress and small wins. Every decision (mobile-first, short steps, predict-first, instant feedback, streaks) is made for Maya, not for a classroom or a kid.

### In Scope

- Pedagogy of learn-by-doing for a quantitative subject (physics/kinematics): predict-first, productive failure, interactive simulation, instant answer-specific feedback.
- Mastery, retrieval, and the habit loop: how mastery should be measured, why recall beats re-reading, why streaks and XP are scaffolding for the habit and not for the learning.
- AI architecture for a learning app: where an LLM belongs (language, hints, problem wording) and where it must never go (the numbers / ground truth), plus the "verify then generate" pattern I built around that.
- The AI-first build process itself (Cursor, Claude, OpenAI, Firebase).

### Out of Scope

- Multi-subject breadth. This is a depth-over-breadth thesis, not a tour of all of STEM.
- A full Phase 3 spaced-repetition / interleaving engine. I left hooks for it but didn't build the scheduler.
- Claiming clinical efficacy for my app. I'm standing on the research, not claiming I reran it in a trial.

## DOK 4: Spiky Points of View (SPOVs)

### SPOV 1: "Physics is hard" is mostly a teaching failure, not a fact about physics. Lead with a prediction the learner commits to before any explanation.

Every lesson opens with a `predict` step: you commit to a guess about a real scenario before the app explains anything. That ordering is the whole thesis. My claim is that most of what people call "physics is hard" is really "I was handed the answer to someone else's reasoning and asked to memorize it." If the learner is passive, the subject will always feel impossible. Drop them into the problem first, let them take a real swing and miss, and "this is incomprehensible" turns into "wait, I want to figure this out." The difficulty doesn't disappear, it just stops being someone else's and becomes theirs.

### SPOV 2: If your app feels easy and smooth, it's probably teaching nothing. Productive struggle is the product, and "feeling like you learned" is a liar.

This cuts against every instinct of consumer app design. A slick explanation creates a feeling of learning that's actively misleading: the smoother it goes down, the more convinced you are that you've got it, and the less you actually do. So I made Build Brilliant willing to feel harder than a video: you predict and you're often wrong, you drag a slider and miss, you stop a falling ball too late. The struggle is the mechanism, not a rough edge to sand off. The moment of being wrong isn't a failure state to minimize, it's the asset, because that's the moment the learner is actually thinking instead of nodding along.

### SPOV 3: An LLM has no business being the source of truth in a learning app. AI writes the words, a deterministic engine owns the numbers. Verify, then generate.

The popular move right now is "let the LLM tutor solve it." I think that's reckless. These models are built to sound confident, so they'll happily produce a clean, plausible, wrong answer rather than admit they're unsure, and in a learning app a confident wrong number is worse than no tutor at all, because it installs a misconception. So I built the opposite. In my practice generator the model only proposes a scenario (an angle, a speed, the question wording); the answer is computed by my own physics engine and re-checked against it before anything reaches the learner. A property test runs 4,000 generated problems and confirms every served answer is engine-correct. The AI never gets to be right or wrong about physics, it only gets to be fluent. Truth lives in code the model can't touch.

### SPOV 4: Mastery is earned over many reps, not declared after one. A bar that hits 100% on a single correct answer is a lie that sabotages the learner.

My first version literally did this: one right answer, 100% mastery. I tore it out, because it's dishonest and it kills the reason to keep practicing. Mastery should mean "you've shown this several times, not flukes," so I rebuilt it as accumulating evidence: each correct answer closes part of the remaining gap (about 34%, 56%, 71%, then 81% = "mastered" on the fourth clean rep), and a wrong answer roughly halves it. One correct answer reads about 34%, which is honest: "you've started." A bar that's allowed to lie to make you feel good is quietly telling you to stop practicing the moment you should keep going.

### SPOV 5: A hint that hands over the answer isn't help, it's theft of the learning. Help has to protect the retrieval event.

My tutor is a chat you can argue with and push for the answer, and it will refuse to give it, by design, on the server. That refusal is the feature. The thing that actually makes physics stick is pulling the answer out of your own head, not reading it off someone else's. A tutor that short-circuits that with "the answer is 40 m" feels helpful in the moment and destroys the exact effort that would have made it stick. So my tutor is Socratic by contract: it's forbidden to state the final number or name the right choice, and it nudges toward the method, never the result. Real help makes you do the thinking, it doesn't do it for you.

### SPOV 6: An interactive element you can't be wrong in is a screensaver. Every simulation has to be gradable or generative, not decorative.

A simulation you can only watch or wiggle is a toy with a play button. In a learn-by-doing app the interaction itself has to carry a consequence, a way to be wrong, or it's teaching nothing. So across all five lessons the interactions are graded, not animations: dial the angle to hit a target, drag the velocity until the line passes through a point, stop the falling ball on a marked line, set a drop height so the fall lasts a target time. The interaction has to be the question, not the decoration around it. If you can't fail it, it isn't teaching.

## Experts

### Carl Wieman
- **Who:** Nobel laureate (Physics, 2001), Stanford professor, founder of PhET Interactive Simulations.
- **Focus:** Interactive simulations for science learning, and what makes a sim instructional rather than just fun.
- **Why Follow:** PhET is the closest prior art to what I'm building, and his research is the backbone of SPOV 6: sims work with a goal and guidance, which is why every one of my interactions is graded.
- **Where:** https://phet.colorado.edu

### Manu Kapur
- **Who:** Professor of Learning Sciences at ETH Zürich.
- **Focus:** "Productive Failure," having learners attempt and fail at novel problems before instruction.
- **Why Follow:** The empirical base for SPOV 1 and 2. My predict, explore, build, practice, master arc is basically a consumerized productive-failure design.
- **Where:** https://www.manukapur.com/productive-failure/

### Louis Deslauriers
- **Who:** Director of Science Teaching and Learning, Harvard.
- **Focus:** Actual learning vs the feeling of learning under active vs passive instruction.
- **Why Follow:** His 2019 PNAS study is the key paper for SPOV 2 and gave me the nerve to ship something that sometimes feels harder than a polished video.
- **Where:** https://www.pnas.org/doi/10.1073/pnas.1821936116

### Scott Freeman
- **Who:** Teaching professor (emeritus), Biology, University of Washington.
- **Focus:** The 2014 PNAS meta-analysis that made active learning the evidence-based default in STEM.
- **Why Follow:** The "lecturing makes you 1.5x more likely to fail" result is the headline behind SPOV 1.
- **Where:** https://www.pnas.org/doi/10.1073/pnas.1319030111

### Henry Roediger III and Jeffrey Karpicke
- **Who:** Cognitive psychologists (Washington University in St. Louis and Purdue).
- **Focus:** The testing effect / retrieval practice: recalling beats re-studying for long-term retention.
- **Why Follow:** Foundation for SPOV 5, my no-aids recall steps, and the tutor's refusal to hand over answers.
- **Where:** https://doi.org/10.1111/j.1467-9280.2006.01693.x

### Benjamin Bloom (foundational)
- **Who:** Educational psychologist, University of Chicago; originator of mastery learning and the "2 sigma problem" (1984).
- **Focus:** Mastery learning and one-to-one tutoring as the gold standard, and approximating it at scale.
- **Why Follow:** The basis for SPOV 4 and the whole framing of an AI tutor as a scalable run at Bloom's challenge, read with the honest caveat that much of the effect is the feedback loop, not tutoring mystique.
- **Where:** https://doi.org/10.3102/0013189X013006004

## DOK 3: Insights

### From Active Learning and Interactive Engagement
- Doing beats watching by a margin big enough to be a mandate, not a preference: a passive app isn't a slightly worse active one, it's a categorically worse product.
- The gain shows up most on concept inventories, so I optimize for conceptual "click" moments (predict, then see why) over rote drill.
- A simulation isn't automatically educational. Sims help with a goal and guidance, so I refused to ship "play with the cannon" without a target to hit.

### From Productive Failure and the Predict-First Arc
- The order is the intervention. Problem-first beats instruction-first on transfer, so "predict before reveal" is a hard rule of my content model, not a per-lesson choice.
- Being wrong is generative, so my feedback for a wrong answer honors the guess ("tempting, but...") instead of just flashing a red X.

### From the Feeling-of-Learning Trap
- Learner satisfaction and learner learning can point in opposite directions. Most apps resolve that toward the dopamine; I resolve it toward the learning and manage the feeling with instant feedback and visible progress instead.
- Novices are bad at judging their own learning, so I give them objective signals (answer-specific feedback, an honest mastery meter) to recalibrate.

### From Retrieval and Mastery
- A test is a learning event, not just a measurement, which is why my recall steps strip away the visual aids.
- Mastery must decay and be earned. A one-shot 100% is dishonest and demotivating, so I shipped an evidence-based mastery curve.

### From AI Reliability and Grounding
- LLMs are optimized to be confident test-takers, so they'd rather guess than say "I'm not sure." A confident wrong number is worse than no tutor at all.
- "Verify then generate" is the safe pattern: let the model draft, let a deterministic checker decide. My physics engine is that checker, and it's the same engine that draws the canvas, so what's verified is exactly what's shown.

## DOK 2: Knowledge Tree

### Category 1: Active Learning and Interactive Engagement

**Freeman et al. (2014), "Active learning increases student performance in science, engineering, and mathematics," PNAS.**
- **DOK 1 (facts):** 225 studies. Active learning raised exam/concept-inventory scores about 0.47 SD; odds of failing were 1.95x higher under lecturing (roughly 1.5x more likely to fail). Held across STEM disciplines and class sizes.
- **DOK 2 (summary):** The empirical floor under the app. Moves "learn by doing" from a philosophy to the default, and makes passive instruction the thing that needs justifying.
- **Link:** https://www.pnas.org/doi/10.1073/pnas.1319030111

**Hake (1998), "Interactive-engagement versus traditional methods...," American Journal of Physics.**
- **DOK 1 (facts):** 62 intro-physics courses, N = 6,542, measured with the Force Concept Inventory. Interactive courses averaged a normalized gain of 0.48 vs 0.23 for traditional, nearly double.
- **DOK 2 (summary):** Physics-specific, large-N evidence that interactive engagement roughly doubles conceptual gain. Validates building a physics app around manipulation and prediction.
- **Link:** https://doi.org/10.1119/1.18809

**Wieman and PhET Interactive Simulations (CU Boulder, founded 2002).**
- **DOK 1 (facts):** 125+ free research-based sims, refined through student think-aloud interviews; sims improve conceptual understanding when paired with guidance.
- **DOK 2 (summary):** The prior art for touchable physics and the source of my "interaction must have a goal" rule.
- **Link:** https://phet.colorado.edu

### Category 2: Productive Failure / Problem-First Sequencing

**Kapur (2014), "Productive Failure in Learning Math," Cognitive Science.**
- **DOK 1 (facts):** Students who attempted novel problems before instruction reached similar procedural knowledge but significantly better transfer than students taught first; the generation phase activates prior knowledge.
- **DOK 2 (summary):** The science behind my predict, explore, build, practice, master arc: fail first, then consolidate.
- **Link:** https://www.manukapur.com/productive-failure/

### Category 3: The Feeling-of-Learning Trap

**Deslauriers et al. (2019), "Measuring actual learning versus feeling of learning...," PNAS.**
- **DOK 1 (facts):** Randomized, controlled comparison in intro physics. Active-learning students learned more but reported lower feelings of learning than students in a polished passive lecture.
- **DOK 2 (summary):** Permission to ship something that sometimes feels harder than a video, and a warning not to optimize for in-the-moment comfort.
- **Link:** https://www.pnas.org/doi/10.1073/pnas.1821936116

### Category 4: Retrieval Practice and Mastery Learning

**Roediger and Karpicke (2006), "Test-Enhanced Learning," Psychological Science.**
- **DOK 1 (facts):** Repeated testing beat repeated studying for retention on delayed tests, even though restudying raised confidence and immediate recall. "Testing is a powerful means of improving learning, not just assessing it."
- **DOK 2 (summary):** Justifies my no-aids recall steps and the tutor's refusal to hand over answers, both of which protect the retrieval event.
- **Link:** https://doi.org/10.1111/j.1467-9280.2006.01693.x

**Bloom (1984), "The 2 Sigma Problem," Educational Researcher.**
- **DOK 1 (facts):** One-to-one tutoring with mastery learning produced about 2 SD gains; mastery learning alone (testing plus feedback) about 1 SD. Later analysis credits roughly half of "2 sigma" to the testing/feedback loop and narrow tests.
- **DOK 2 (summary):** Frames the app as a scalable run at Bloom's challenge and keeps me honest: mastery is a demonstrated threshold, and the replicable lever is the feedback/retrieval loop.
- **Link:** https://doi.org/10.3102/0013189X013006004

### Category 5: AI Reliability and the Case for Grounding

**Kalai et al. (2025), "Why Language Models Hallucinate" (arXiv); related Nature (2026).**
- **DOK 1 (facts):** Accuracy-based evaluation rewards confident guessing and penalizes "I don't know," so models are trained to guess rather than abstain.
- **DOK 2 (summary):** The core reason I refused to let the LLM own correctness; the truth has to live somewhere the model can't reach.
- **Link:** https://arxiv.org/abs/2509.04664

**Daheim et al. (2024), "Stepwise Verification and Remediation of Student Reasoning Errors with LLM Tutors," EMNLP (ETH).**
- **DOK 1 (facts):** Splitting a tutor into a verifier (find the error) and a separate generator (respond) yields more targeted, less hallucinated feedback than generating directly.
- **DOK 2 (summary):** Direct validation of my pipeline: the model proposes, the engine verifies, only verified content reaches the learner.
- **Link:** https://aclanthology.org/2024.emnlp-main.478.pdf

**"Beyond Final Answers: Evaluating Large Language Models for Math Tutoring" (2025, arXiv).**
- **DOK 1 (facts):** LLMs produce plausible-but-wrong math often enough (about 10% even at strong performance) that naive tutor deployment "may do more harm than good."
- **DOK 2 (summary):** The risk quantified. A 1-in-10 confident error rate is unacceptable for a tool whose job is to be trusted on correctness.
- **Link:** https://arxiv.org/abs/2503.16460

## Appendix: AI-First Build Process

### Tools and workflow
I built the whole thing agentically in Cursor, driving Claude as the coding agent, with GPT-4o-mini (OpenAI) as the runtime tutor/generator behind a Firebase Cloud Functions proxy (so the key never touches the browser), on React 19, Vite, TypeScript, Tailwind v4, and Firebase (Auth, Firestore, Hosting). My loop: write a strong spec in plan mode, let the agent implement against a todo list, review and run type-check / lint / build plus a physics property test, then iterate from screenshots of the live app. I kept the AI on a tight leash around the two things I refused to delegate: physics correctness and pedagogy.

### Prompts that actually moved the build
1. "Plan before code." I had the agent produce a full Phase 2 PRD in plan mode before writing a line, which front-loaded the hard decisions.
2. "Implement the plan, and don't stop until every to-do is done." An explicit ordered todo list kept a big multi-feature build coherent instead of half-finished.
3. The grounding rule (my favorite): "The model may only propose the scenario; the answer must be computed by the physics engine and re-verified before it's shown. The AI never states a number." That one instruction is the whole safety architecture.
4. The tutor's contract: "Be Socratic. Never reveal the final answer or name the correct choice, even if asked directly. If pushed, explain the method or ask a guiding question." Enforced server-side.
5. Screenshot-driven iteration: "The mastery bar hits 100% after one answer / the graph rescales so steeper velocities look flatter / the fall-time readout gives away the answer. Fix the underlying model, not the pixels." Treating each visual bug as a model bug is what made the fixes principled.

### Phase decisions
- Shipped in Phase 2: a Socratic tutor that won't give the answer, an engine-verified practice generator, an adaptive coach grounded in real mastery, and new graded interactive question types across every lesson.
- Deliberately skipped: an open-ended chatbot, AI grading or letting the model override the checker, and runtime AI-generated full lessons. Each one hands correctness or pedagogy to a system that's incentivized to guess.
- Held for Phase 3: a real spaced-repetition / interleaving scheduler (the data hooks are in place).

### Code analysis (AI vs hand-written)
Rough split: about 85 to 90% of the code was AI-generated through Cursor/Claude (components, Firebase wiring, the Cloud Functions proxy, build/test scaffolding). The 10 to 15% I owned by hand is the part that matters most: the physics formulas and their verification, the mastery model, the content model's shape, the tutor's guardrails, and all of the lesson content (every prediction, hint, and explanation was human-directed and reviewed). The line maps exactly to SPOV 3: AI wrote the scaffolding and language, I wrote and verified the truth and the teaching.

### Key learnings
- The most important decision in an AI learning app is where you don't let the AI go. Drawing the "AI for language, engine for truth" line up front made every downstream feature safer and simpler.
- "Feels good" is a trap metric. The version that tests better often feels worse, and you need the conviction to ship it anyway and manage the feeling with feedback.
- Honesty is a feature. A mastery bar that won't lie and a tutor that won't hand over answers are less satisfying in the moment and more effective, and people can feel the integrity.
- Agentic AI is great at breadth and dangerous at depth-of-truth. It built five lessons and eight interaction types fast, but it would happily have shipped a confidently wrong physics answer if I'd let it. The leverage is in relentlessly reviewing the 10% that's load-bearing.
