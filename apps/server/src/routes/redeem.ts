import { Router, Request, Response } from 'express'
import { pool } from '../db'
import { ok, fail } from '../utils'
import { authMiddleware, AuthRequest } from '../auth'

const router = Router()

/**
 * 兑换码核销接口
 * 对应对接.md 中 unlock.tsx 调用的 /api/redeem
 *
 * POST /api/redeem
 * body: { code: string }
 * 鉴权：需要用户登录（Bearer token）
 *
 * 流程：
 * 1. 查询兑换码，校验状态=未使用、未过期
 * 2. 标记为已使用（user_id / used_at）
 * 3. 写入 user_courses 解锁课程（幂等），users.bought_courses + 1
 * 4. 返回 { courseId, courseTitle }
 */
router.post('/redeem', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    const code = (req.body?.code || '').toString().trim().toUpperCase()

    if (!userId) {
      return fail(res, 401, '请先登录')
    }
    if (!code) {
      return fail(res, 400, '请输入兑换码')
    }

    // 1. 查询兑换码
    const [rows] = await pool.query(
      'SELECT id, course_id, status, expire_at FROM redeem_codes WHERE code = ? LIMIT 1',
      [code]
    ) as any
    const row = (rows as any[])[0]
    if (!row) {
      return fail(res, 404, '兑换码不存在')
    }
    if (row.status === 1) {
      return fail(res, 400, '兑换码已被使用')
    }
    if (row.status === 2) {
      return fail(res, 400, '兑换码已作废')
    }
    if (row.expire_at && new Date(row.expire_at).getTime() < Date.now()) {
      return fail(res, 400, '兑换码已过期')
    }

    const courseId = Number(row.course_id)

    // 2. 标记为已使用
    await pool.query(
      'UPDATE redeem_codes SET status = 1, user_id = ?, used_at = NOW() WHERE id = ? AND status = 0',
      [userId, row.id]
    )

    // 3. 解锁课程（幂等：已购则不重复加计数）
    const [lessonCountRows] = await pool.query(
      'SELECT COUNT(*) AS cnt FROM lessons WHERE course_id = ?',
      [courseId]
    )
    const totalLessons = (lessonCountRows as any[])[0].cnt

    const [ucResult] = await pool.query(
      `INSERT IGNORE INTO user_courses (user_id, course_id, status, total_lessons, created_at, updated_at)
       VALUES (?, ?, 0, ?, NOW(), NOW())`,
      [userId, courseId, totalLessons]
    )
    if ((ucResult as any).affectedRows > 0) {
      await pool.query(
        'UPDATE users SET bought_courses = bought_courses + 1 WHERE id = ?',
        [userId]
      )
    }

    // 4. 返回课程信息
    const [courseRows] = await pool.query(
      'SELECT id, title FROM courses WHERE id = ?',
      [courseId]
    )
    const course = (courseRows as any[])[0]

    return ok(res, {
      courseId,
      courseTitle: course?.title || '',
    })
  } catch (err) {
    console.error('[redeem] error:', err)
    return fail(res, 500, '兑换失败，请稍后重试')
  }
})

export default router
