import { UserCourseStatus } from '../types'
import type { UserCourse } from '../types'

/** 当前用户的"我的课程"列表（覆盖已购未学 / 学习中 / 已完成三种状态） */
export const myCourses: UserCourse[] = [
  {
    id: 1,
    userId: 1,
    courseId: 1,
    status: UserCourseStatus.Learning,
    progress: 65,
    completedLessons: 8,
    totalLessons: 12,
    lastStudyAt: '2026-06-25T15:30:00.000Z',
    createdAt: '2026-04-25T10:00:00.000Z',
    updatedAt: '2026-06-25T15:30:00.000Z',
  },
  {
    id: 2,
    userId: 1,
    courseId: 3,
    status: UserCourseStatus.Finished,
    progress: 100,
    completedLessons: 10,
    totalLessons: 10,
    lastStudyAt: '2026-06-10T20:00:00.000Z',
    createdAt: '2026-04-25T10:05:00.000Z',
    updatedAt: '2026-06-10T20:00:00.000Z',
  },
  {
    id: 3,
    userId: 1,
    courseId: 4,
    status: UserCourseStatus.Purchased,
    progress: 0,
    completedLessons: 0,
    totalLessons: 8,
    createdAt: '2026-04-25T10:10:00.000Z',
    updatedAt: '2026-04-25T10:10:00.000Z',
  },
  {
    id: 4,
    userId: 1,
    courseId: 5,
    status: UserCourseStatus.Learning,
    progress: 30,
    completedLessons: 2,
    totalLessons: 7,
    lastStudyAt: '2026-06-24T19:30:00.000Z',
    createdAt: '2026-04-25T10:15:00.000Z',
    updatedAt: '2026-06-24T19:30:00.000Z',
  },
]
