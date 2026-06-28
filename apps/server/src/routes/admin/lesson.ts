import { Router } from 'express'
import { pool } from '../../db'
import { ok, fail } from '../../utils'
import { authMiddleware } from '../../auth'

const router = Router()

function mapLessonRow(row: any) {
  return {
    id: row.id,
    courseId: row.course_id,
    title: row.title,
    duration: row.duration,
    durationSeconds: row.duration_seconds,
    videoUrl: row.video_url,
    content: row.content ?? '',
    sort: row.sort,
    createdAt: row.created_at,
  }
}

/** GET /api/admin/lessons?courseId= */
router.get('/lessons', authMiddleware, async (req, res) => {
  try {
    const courseId = req.query.courseId ? Number(req.query.courseId) : 0
    if (!courseId) return fail(res, 400, '缺少 courseId 参数')
    const [rows] = await pool.query(
      'SELECT * FROM lessons WHERE course_id = ? ORDER BY sort, id',
      [courseId]
    ) as any[]
    const list = (rows as any[]).map(mapLessonRow)
    return ok(res, list)
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

/** POST /api/admin/lessons */
router.post('/lessons', authMiddleware, async (req, res) => {
  try {
    const { courseId, title, duration, durationSeconds, videoUrl, content, sort } = req.body
    const [result] = await pool.query(
      `INSERT INTO lessons (course_id, title, duration, duration_seconds, video_url, content, sort, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [courseId, title, duration ?? '', durationSeconds ?? 0, videoUrl ?? '', content ?? '', sort ?? 0]
    ) as any
    return ok(res, { id: (result as any).insertId })
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

/** PUT /api/admin/lessons/:id */
router.put('/lessons/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { courseId, title, duration, durationSeconds, videoUrl, content, sort } = req.body
    await pool.query(
      `UPDATE lessons SET course_id=?, title=?, duration=?, duration_seconds=?, video_url=?, content=?, sort=?
       WHERE id=?`,
      [courseId, title, duration ?? '', durationSeconds ?? 0, videoUrl ?? '', content ?? '', sort ?? 0, id]
    )
    return ok(res, null)
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

/** PUT /api/admin/lessons/reorder - batch update sort */
router.put('/lessons/reorder', authMiddleware, async (req, res) => {
  try {
    const items: { id: number; sort: number }[] = req.body.items
    if (!Array.isArray(items) || items.length === 0) {
      return fail(res, 400, '缺少 items 数组')
    }
    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()
      for (const item of items) {
        await conn.query('UPDATE lessons SET sort = ? WHERE id = ?', [item.sort, item.id])
      }
      await conn.commit()
      return ok(res, null)
    } finally {
      conn.release()
    }
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

/** DELETE /api/admin/lessons/:id */
router.delete('/lessons/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id)
    await pool.query('DELETE FROM lessons WHERE id = ?', [id])
    return ok(res, null)
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

export default router
