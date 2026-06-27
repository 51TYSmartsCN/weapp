import { myCourses, user } from '../data'
import type { LearningSummary, UserCourse } from '../types'
import type { RequestOptions } from './config'
import { shouldUseLocal } from './config'
import { request } from './request'

/** 获取学习中心汇总信息 */
export async function getLearningSummary(options?: RequestOptions): Promise<LearningSummary> {
  if (shouldUseLocal(options)) {
    // 本地 mock 数据中 continueCourse 一定存在
    const cc = user.continueCourse!
    return {
      continueCourse: {
        courseId: 1,
        title: cc.title,
        progress: cc.progress,
        completed: cc.completed,
        total: cc.total,
        lastStudy: cc.lastStudy,
      },
      myCourses,
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
  if (shouldUseLocal(options)) return myCourses
  // TODO: return Taro.request({ url: '/api/user/courses' })
  return request<UserCourse[]>({ url: '/api/user/courses', method: 'GET' })
}
