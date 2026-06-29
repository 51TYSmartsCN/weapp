import { Router, Request, Response } from 'express'
import { pool } from '../db'
import { ok, fail, unauthorized } from '../utils'
import { authMiddleware, AuthRequest } from '../auth'

const router = Router()

/** 格式化相对时间（简化版） */
function formatRelativeTime(date: Date | string | null): string {
  if (!date) return '刚刚'
  const d = new Date(date)
  const diff = Date.now() - d.getTime()
  if (diff < 60 * 1000) return '刚刚'
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 7 * 24 * 60 * 60 * 1000) return `${Math.floor(diff / 86400000)}天前`
  return d.toLocaleDateString('zh-CN')
}

/** 将 user_courses JOIN courses 行转换为 camelCase */
function mapUserCourse(r: any) {
  return {
    id: r.id,
    userId: r.user_id,
    courseId: r.course_id,
    courseTitle: r.course_title,
    status: r.status,
    progress: r.progress,
    completedLessons: r.completed_lessons,
    totalLessons: r.total_lessons,
    lastStudyAt: r.last_study_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

/** GET /api/user - 当前用户信息 */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId!
    const [userRows] = await pool.query('SELECT * FROM users WHERE id = ?', [
      userId,
    ])
    const userList = userRows as any[]
    // token 指向的用户不存在（多见于数据库重建后本地 token 仍为旧 userId）
    // 视为登录态失效：返回 401 触发前端清 token + 跳登录页，重新登录即重建用户记录
    if (userList.length === 0) return unauthorized(res, '登录信息已失效，请重新登录')
    const u = userList[0]

    // continueCourse: 最近学习的课程
    const [ccRows] = await pool.query(
      `SELECT uc.progress, uc.completed_lessons, uc.total_lessons, uc.last_study_at, c.title
       FROM user_courses uc
       JOIN courses c ON c.id = uc.course_id
       WHERE uc.user_id = ?
       ORDER BY uc.last_study_at DESC
       LIMIT 1`,
      [userId]
    )
    const ccList = ccRows as any[]
    const continueCourse =
      ccList.length > 0
        ? {
            title: ccList[0].title,
            progress: ccList[0].progress,
            completed: ccList[0].completed_lessons,
            total: ccList[0].total_lessons,
            lastStudy: formatRelativeTime(ccList[0].last_study_at),
          }
        : null

    ok(res, {
      id: u.id,
      name: u.name,
      avatar: u.avatar,
      vip: u.vip === 1,
      vipExpireAt: u.vip_expire_at,
      boughtCourses: u.bought_courses,
      finishedLessons: u.finished_lessons,
      studyHours: u.study_hours,
      continueCourse,
      hasProfile: !!u.name && u.name !== '微信用户' && !!u.avatar && u.avatar !== 'U',
    })
  } catch (err) {
    console.error('[user] info error:', err)
    fail(res, 500, '获取用户信息失败')
  }
})

/** GET /api/user/learning/summary - 学习中心汇总 */
router.get(
  '/learning/summary',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthRequest).userId!

      // continueCourse
      const [ccRows] = await pool.query(
        `SELECT uc.course_id, uc.progress, uc.completed_lessons, uc.total_lessons, uc.last_study_at, c.title
         FROM user_courses uc
         JOIN courses c ON c.id = uc.course_id
         WHERE uc.user_id = ?
         ORDER BY uc.last_study_at DESC
         LIMIT 1`,
        [userId]
      )
      const ccList = ccRows as any[]
      const continueCourse =
        ccList.length > 0
          ? {
              courseId: ccList[0].course_id,
              title: ccList[0].title,
              progress: ccList[0].progress,
              completed: ccList[0].completed_lessons,
              total: ccList[0].total_lessons,
              lastStudy: formatRelativeTime(ccList[0].last_study_at),
            }
          : null

      // myCourses
      const [mcRows] = await pool.query(
        `SELECT uc.*, c.title AS course_title
         FROM user_courses uc
         JOIN courses c ON c.id = uc.course_id
         WHERE uc.user_id = ?
         ORDER BY uc.last_study_at DESC`,
        [userId]
      )
      const myCourses = (mcRows as any[]).map(mapUserCourse)

      // stats
      const [userRows] = await pool.query(
        'SELECT bought_courses, finished_lessons, study_hours FROM users WHERE id = ?',
        [userId]
      )
      const u = (userRows as any[])[0] || {}
      const stats = {
        boughtCourses: u.bought_courses ?? 0,
        finishedLessons: u.finished_lessons ?? 0,
        studyHours: u.study_hours ?? 0,
      }

      ok(res, { continueCourse, myCourses, stats })
    } catch (err) {
      console.error('[user] summary error:', err)
      fail(res, 500, '获取学习中心数据失败')
    }
  }
)

/** GET /api/user/courses - 我的课程列表 */
router.get('/courses', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId!
    const [rows] = await pool.query(
      `SELECT uc.*, c.title AS course_title
       FROM user_courses uc
       JOIN courses c ON c.id = uc.course_id
       WHERE uc.user_id = ?
       ORDER BY uc.last_study_at DESC`,
      [userId]
    )
    ok(res, (rows as any[]).map(mapUserCourse))
  } catch (err) {
    console.error('[user] courses error:', err)
    fail(res, 500, '获取我的课程失败')
  }
})

export default router
