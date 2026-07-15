import type { Follow } from '../types'
import { instructors } from './instructors'

export const follows: Follow[] = [
  {
    id: 1,
    userId: 1,
    instructorId: 1,
    createdAt: '2026-06-18T09:30:00.000Z',
    instructor: instructors[0],
  },
  {
    id: 2,
    userId: 1,
    instructorId: 2,
    createdAt: '2026-06-20T18:00:00.000Z',
    instructor: instructors[1],
  },
]
