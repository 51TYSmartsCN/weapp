import type { StudyRecord } from '../types'

/** 学习记录（最近几天的课时观看记录） */
export const studyRecords: StudyRecord[] = [
  {
    id: 1,
    userId: 1,
    courseId: 1,
    lessonId: 3,
    duration: 1800,
    studiedAt: '2026-06-25T15:30:00.000Z',
  },
  {
    id: 2,
    userId: 1,
    courseId: 5,
    lessonId: 2,
    duration: 1320,
    studiedAt: '2026-06-24T19:30:00.000Z',
  },
  {
    id: 3,
    userId: 1,
    courseId: 1,
    lessonId: 1,
    duration: 900,
    studiedAt: '2026-06-23T20:00:00.000Z',
  },
  {
    id: 4,
    userId: 1,
    courseId: 3,
    lessonId: 6,
    duration: 1500,
    studiedAt: '2026-06-22T21:00:00.000Z',
  },
  {
    id: 5,
    userId: 1,
    courseId: 4,
    lessonId: 4,
    duration: 1800,
    studiedAt: '2026-06-21T14:00:00.000Z',
  },
]
