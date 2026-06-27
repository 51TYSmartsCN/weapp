import { Router } from 'express'
import { pool } from '../../db'
import { ok, fail } from '../../utils'
import { authMiddleware } from '../../auth'

const router = Router()

function mapReviewRow(row: any) {
  return {
    id: row.id,
    courseId: row.course_id,
    courseTitle: row.course_title ?? '',
    userId: row.user_id,
    name: row.name,
    rating: Number(row.rating),
    content: row.content,
    date: row.date,
    createdAt: row.created_at,
  }
}

/** GET /api/admin/reviews */
router.get('/reviews', authMiddleware, async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1)
    const size = Math.max(1, Number(req.query.size) || 20)
    const offset = (page - 1) * size

    const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM reviews') as any

    const [rows] = await pool.query(
      `SELECT r.*, c.title AS course_title
       FROM reviews r
       LEFT JOIN courses c ON r.course_id = c.id
       ORDER BY r.id DESC
       LIMIT ? OFFSET ?`,
      [size, offset]
    ) as any[]

    const list = (rows as any[]).map(mapReviewRow)
    return ok(res, { list, total: Number(total) })
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

/** DELETE /api/admin/reviews/:id */
router.delete('/reviews/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id)
    await pool.query('DELETE FROM reviews WHERE id = ?', [id])
    return ok(res, null)
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

export default router
