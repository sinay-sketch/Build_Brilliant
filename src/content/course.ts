import type { Course, Lesson, LessonMeta } from '../types/content'
import { isProblemStep } from '../types/content'
import { projectileLesson } from './projectile'
import { freeFallLesson } from './freeFall'
import { rangeVsAngleLesson } from './rangeVsAngle'
import { positionVelocityLesson } from './positionVelocity'
import { hitTheTargetLesson } from './hitTheTarget'

export const kinematicsCourse: Course = {
  id: 'kinematics',
  subject: 'physics',
  title: 'Kinematics',
  description:
    'The motion of objects, built by doing. You will set things moving, predict what happens, and watch the math fall out of the experiment.',
  lessonOrder: [
    'position-velocity',
    'free-fall',
    'projectile-motion',
    'range-vs-angle',
    'hit-the-target',
  ],
}

// Depth over breadth: one lesson is fully built and polished for the MVP. The
// rest of the path is real and visible, marked "coming soon", so the course
// feels like a journey with a sensible next step.
export const lessonMetas: LessonMeta[] = [
  {
    id: 'position-velocity',
    courseId: 'kinematics',
    order: 1,
    title: 'Position & Velocity',
    concept: 'Where something is and how fast it moves.',
    estMinutes: 16,
    prerequisites: [],
    playable: true,
  },
  {
    id: 'free-fall',
    courseId: 'kinematics',
    order: 2,
    title: 'Free Fall & Gravity',
    concept: 'Everything falls at the same rate.',
    estMinutes: 18,
    prerequisites: ['position-velocity'],
    playable: true,
  },
  {
    id: 'projectile-motion',
    courseId: 'kinematics',
    order: 3,
    title: 'Projectile Motion',
    concept: 'Horizontal and vertical motion are independent.',
    estMinutes: 25,
    prerequisites: [],
    playable: true,
  },
  {
    id: 'range-vs-angle',
    courseId: 'kinematics',
    order: 4,
    title: 'Range vs. Angle',
    concept: 'Why 45 degrees wins, and complementary angles tie.',
    estMinutes: 20,
    prerequisites: ['projectile-motion'],
    playable: true,
  },
  {
    id: 'hit-the-target',
    courseId: 'kinematics',
    order: 5,
    title: 'Hit the Target',
    concept: 'Combine angle, speed, and gravity to aim.',
    estMinutes: 22,
    prerequisites: ['range-vs-angle'],
    playable: true,
  },
]

const fullLessons: Record<string, Lesson> = {
  [positionVelocityLesson.id]: positionVelocityLesson,
  [freeFallLesson.id]: freeFallLesson,
  [projectileLesson.id]: projectileLesson,
  [rangeVsAngleLesson.id]: rangeVsAngleLesson,
  [hitTheTargetLesson.id]: hitTheTargetLesson,
}

export function getLesson(id: string): Lesson | undefined {
  return fullLessons[id]
}

export function getLessonMeta(id: string): LessonMeta | undefined {
  return lessonMetas.find((l) => l.id === id)
}

/** Number of gradeable problems in a lesson (for progress display). */
export function countProblems(lesson: Lesson): number {
  return lesson.steps.filter(isProblemStep).length
}
