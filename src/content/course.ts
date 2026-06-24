import type { Course, Lesson, LessonMeta } from '../types/content'
import { isProblemStep } from '../types/content'
import { projectileLesson } from './projectile'

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
    estMinutes: 10,
    prerequisites: [],
    playable: false,
  },
  {
    id: 'free-fall',
    courseId: 'kinematics',
    order: 2,
    title: 'Free Fall & Gravity',
    concept: 'Everything falls at the same rate.',
    estMinutes: 12,
    prerequisites: ['position-velocity'],
    playable: false,
  },
  {
    id: 'projectile-motion',
    courseId: 'kinematics',
    order: 3,
    title: 'Projectile Motion',
    concept: 'Horizontal and vertical motion are independent.',
    estMinutes: 20,
    prerequisites: [],
    playable: true,
  },
  {
    id: 'range-vs-angle',
    courseId: 'kinematics',
    order: 4,
    title: 'Range vs. Angle',
    concept: 'Why 45 degrees wins, and complementary angles tie.',
    estMinutes: 12,
    prerequisites: ['projectile-motion'],
    playable: false,
  },
  {
    id: 'hit-the-target',
    courseId: 'kinematics',
    order: 5,
    title: 'Hit the Target',
    concept: 'Combine angle, speed, and gravity to aim.',
    estMinutes: 15,
    prerequisites: ['range-vs-angle'],
    playable: false,
  },
]

const fullLessons: Record<string, Lesson> = {
  [projectileLesson.id]: projectileLesson,
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
