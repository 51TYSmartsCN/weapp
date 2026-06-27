import { Router } from 'express'
import { pool } from '../../db'
import { ok, fail } from '../../utils'
import { authMiddleware } from '../../auth'

const router = Router()

function mapFeedbackRow(row: any) {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name ?? '',
    type: row.type,
    content: row.content,
    contact: row.contact,
    createdAt: row.created_at,
  }
}

/** GET /api/admin/feedbacks */
router.get('/feedbacks', authMiddleware, async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT f.*, u.name AS user_name
       FROM feedbacks f
       LEFT JOIN users u ON f.user_id = u.id
       ORDER BY f.id DESC`
    ) as any[]
    const list = (rows as any[]).map(mapFeedbackRow)
    return ok(res, list)
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

/** DELETE /api/admin/feedbacks/:id */
router.delete('/feedbacks/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id)
    await pool.query('DELETE FROM feedbacks WHERE id = ?', [id])
    return ok(res, null)
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

export default router
