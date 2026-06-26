import { Router, Request, Response } from 'express'
import { pool } from '../db'
import { ok, fail } from '../utils'
import { authMiddleware, AuthRequest } from '../auth'

const router = Router()

/** POST /api/favorites - 切换收藏（toggle） */
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId!
    const { courseId } = req.body || {}
    if (!courseId || typeof courseId !== 'number') {
      return fail(res, 400, '参数错误')
    }

    const [existing] = await pool.query(
      'SELECT id FROM favorites WHERE user_id = ? AND course_id = ?',
      [userId, courseId]
    )
    if ((existing as any[]).length > 0) {
      // 已收藏 -> 取消
      await pool.query(
        'DELETE FROM favorites WHERE user_id = ? AND course_id = ?',
        [userId, courseId]
      )
      return ok(res, false)
    }

    // 未收藏 -> 添加
    await pool.query(
      'INSERT INTO favorites (user_id, course_id) VALUES (?, ?)',
      [userId, courseId]
    )
    ok(res, true)
  } catch (err) {
    console.error('[favorite] toggle error:', err)
    fail(res, 500, '收藏操作失败')
  }
})

/** GET /api/favorites/check - 检查是否已收藏，query: course_id */
router.get('/check', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId!
    const courseId = Number(req.query.course_id)
    if (!Number.isFinite(courseId)) return fail(res, 400, '参数错误')

    const [rows] = await pool.query(
      'SELECT id FROM favorites WHERE user_id = ? AND course_id = ?',
      [userId, courseId]
    )
    ok(res, (rows as any[]).length > 0)
  } catch (err) {
    console.error('[favorite] check error:', err)
    fail(res, 500, '查询失败')
  }
})

/** GET /api/favorites - 当前用户收藏列表 */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId!
    const [rows] = await pool.query(
      `SELECT f.id, f.user_id, f.course_id, f.created_at,
              c.title AS course_title, c.cover AS course_cover,
              c.instructor_id, c.price, c.rating, c.students, c.is_hot
       FROM favorites f
       JOIN courses c ON c.id = f.course_id
       WHERE f.user_id = ?
       ORDER BY f.created_at DESC`,
      [userId]
    )
    const list = (rows as any[]).map((r) => ({
      id: r.id,
      userId: r.user_id,
      courseId: r.course_id,
      createdAt: r.created_at,
      course: {
        id: r.course_id,
        title: r.course_title,
        cover: r.course_cover,
        instructorId: r.instructor_id,
        price: Number(r.price),
        rating: Number(r.rating),
        students: r.students,
        isHot: r.is_hot === 1,
      },
    }))
    ok(res, list)
  } catch (err) {
    console.error('[favorite] list error:', err)
    fail(res, 500, '获取收藏列表失败')
  }
})

export default router
