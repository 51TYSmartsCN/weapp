import type { User } from '../types'

export const user: User = {
  name: '李晓明',
  avatar: '李',
  vip: true,
  boughtCourses: 3,
  finishedLessons: 12,
  studyHours: 86,
  continueCourse: {
    title: 'GEO 实战入门',
    progress: 65,
    completed: 8,
    total: 12,
    lastStudy: '昨天'
  }
}
