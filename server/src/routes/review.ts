import { Router } from 'express'
import { pool } from '../db'
import { ok, fail } from '../utils'

const router = Router()

/** 将 reviews 行映射为前端 Review 对象 */
function mapReview(row: any) {
  return {
    id: row.id,
    courseId: row.course_id,
    userId: row.user_id,
    name: row.name,
    rating: row.rating,
    content: row.content,
    date: row.date ? String(row.date).slice(0, 10) : '',
  }
}

/** GET /api/reviews
 * 支持可选 query: course_id
 * ORDER BY created_at DESC
 */
router.get('/', async (req, res) => {
  try {
    const courseId = req.query.course_id
    let sql: string
    let params: any[]
    if (courseId !== undefined && courseId !== null && courseId !== '') {
      sql = 'SELECT * FROM reviews WHERE course_id = ? ORDER BY created_at DESC'
      params = [Number(courseId)]
    } else {
      sql = 'SELECT * FROM reviews ORDER BY created_at DESC'
      params = []
    }
    const [rows] = await pool.query(sql, params)
    return ok(res, (rows as any[]).map(mapReview))
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

export default router
