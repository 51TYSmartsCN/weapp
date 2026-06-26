import { user } from '../data'
import type { LearningSummary, UserCourse } from '../types'
import type { RequestOptions } from './config'
import { shouldUseLocal } from './config'
import { request } from './request'

/** 获取学习中心汇总信息 */
export async function getLearningSummary(options?: RequestOptions): Promise<LearningSummary> {
  if (shouldUseLocal(options)) {
    const now = new Date().toISOString()
    return {
      continueCourse: {
        courseId: 1,
        title: user.continueCourse.title,
        progress: user.continueCourse.progress,
        completed: user.continueCourse.completed,
        total: user.continueCourse.total,
        lastStudy: user.continueCourse.lastStudy,
      },
      myCourses: [
        {
          id: 1,
          userId: 0,
          courseId: 1,
          status: 1,
          progress: user.continueCourse.progress,
          completedLessons: user.continueCourse.completed,
          totalLessons: user.continueCourse.total,
          lastStudyAt: now,
          createdAt: now,
          updatedAt: now,
        },
      ],
      stats: {
        boughtCourses: user.boughtCourses,
        finishedLessons: user.finishedLessons,
        studyHours: user.studyHours,
      },
    }
  }
  // TODO: return Taro.request({ url: '/api/user/learning/summary' })
  return request<LearningSummary>({ url: '/api/user/learning/summary', method: 'GET' })
}

/** 获取当前用户的"我的课程"列表 */
export async function getMyCourses(options?: RequestOptions): Promise<UserCourse[]> {
  if (shouldUseLocal(options)) return []
  // TODO: return Taro.request({ url: '/api/user/courses' })
  return request<UserCourse[]>({ url: '/api/user/courses', method: 'GET' })
}
