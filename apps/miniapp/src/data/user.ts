import type { User } from '../types'

export const user: User = {
  name: '李晓明',
  avatar: 'http://localhost:4000/images/avatars/default.png',
  vip: true,
  boughtCourses: 3,
  finishedLessons: 12,
  studyHours: 86,
  hasProfile: true,
  continueCourse: {
    title: 'GEO 实战入门：从零掌握 AI 搜索优化',
    progress: 65,
    completed: 8,
    total: 12,
    lastStudy: '昨天'
  }
}
