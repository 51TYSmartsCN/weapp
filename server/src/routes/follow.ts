import { Router, Request, Response } from 'express'
import { pool } from '../db'
import { ok, fail } from '../utils'
import { authMiddleware, AuthRequest } from '../auth'

const router = Router()

/** POST /api/follows - 切换关注（toggle） */
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId!
    const { instructorId } = req.body || {}
    if (!instructorId || typeof instructorId !== 'number') {
      return fail(res, 400, '参数错误')
    }

    const [existing] = await pool.query(
      'SELECT id FROM follows WHERE user_id = ? AND instructor_id = ?',
      [userId, instructorId]
    )
    if ((existing as any[]).length > 0) {
      // 已关注 -> 取消
      await pool.query(
        'DELETE FROM follows WHERE user_id = ? AND instructor_id = ?',
        [userId, instructorId]
      )
      return ok(res, false)
    }

    // 未关注 -> 添加
    await pool.query(
      'INSERT INTO follows (user_id, instructor_id) VALUES (?, ?)',
      [userId, instructorId]
    )
    ok(res, true)
  } catch (err) {
    console.error('[follow] toggle error:', err)
    fail(res, 500, '关注操作失败')
  }
})

/** GET /api/follows/check - 检查是否已关注，query: instructor_id */
router.get('/check', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId!
    const instructorId = Number(req.query.instructor_id)
    if (!Number.isFinite(instructorId)) return fail(res, 400, '参数错误')

    const [rows] = await pool.query(
      'SELECT id FROM follows WHERE user_id = ? AND instructor_id = ?',
      [userId, instructorId]
    )
    ok(res, (rows as any[]).length > 0)
  } catch (err) {
    console.error('[follow] check error:', err)
    fail(res, 500, '查询失败')
  }
})

/** GET /api/follows - 当前用户关注列表 */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId!
    const [rows] = await pool.query(
      `SELECT f.id, f.user_id, f.instructor_id, f.created_at,
              i.name AS instructor_name, i.title AS instructor_title,
              i.service AS instructor_service, i.color AS instructor_color,
              i.avatar AS instructor_avatar, i.bio AS instructor_bio
       FROM follows f
       JOIN instructors i ON i.id = f.instructor_id
       WHERE f.user_id = ?
       ORDER BY f.created_at DESC`,
      [userId]
    )
    const list = (rows as any[]).map((r) => ({
      id: r.id,
      userId: r.user_id,
      instructorId: r.instructor_id,
      createdAt: r.created_at,
      instructor: {
        id: r.instructor_id,
        name: r.instructor_name,
        title: r.instructor_title,
        service: r.instructor_service,
        color: r.instructor_color,
        avatar: r.instructor_avatar,
        bio: r.instructor_bio,
      },
    }))
    ok(res, list)
  } catch (err) {
    console.error('[follow] list error:', err)
    fail(res, 500, '获取关注列表失败')
  }
})

export default router
