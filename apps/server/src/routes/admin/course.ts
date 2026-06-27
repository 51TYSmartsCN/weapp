import { Router } from 'express'
import { pool } from '../../db'
import { ok, fail } from '../../utils'
import { authMiddleware } from '../../auth'

const router = Router()

function mapCourseRow(row: any) {
  return {
    id: row.id,
    title: row.title,
    desc: row.desc,
    instructorId: row.instructor_id,
    rating: Number(row.rating),
    students: row.students,
    price: Number(row.price),
    originalPrice: row.original_price != null ? Number(row.original_price) : undefined,
    cover: row.cover,
    isHot: !!row.is_hot,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/** GET /api/admin/courses */
router.get('/courses', authMiddleware, async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1)
    const size = Math.max(1, Number(req.query.size) || 20)
    const offset = (page - 1) * size
    const search = req.query.search ? String(req.query.search) : ''
    const status = req.query.status

    let where = 'WHERE 1=1'
    const params: any[] = []

    if (search) {
      where += ' AND c.title LIKE ?'
      params.push(`%${search}%`)
    }
    if (status !== undefined && status !== '') {
      where += ' AND c.status = ?'
      params.push(Number(status))
    }

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM courses c ${where}`,
      params
    ) as any

    const [rows] = await pool.query(
      `SELECT c.*, i.name AS instructor_name
       FROM courses c
       LEFT JOIN instructors i ON c.instructor_id = i.id
       ${where}
       ORDER BY c.id DESC
       LIMIT ? OFFSET ?`,
      [...params, size, offset]
    ) as any[]

    const list = (rows as any[]).map((r) => ({
      ...mapCourseRow(r),
      instructorName: r.instructor_name ?? '',
    }))

    return ok(res, { list, total: Number(total) })
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

/** POST /api/admin/courses */
router.post('/courses', authMiddleware, async (req, res) => {
  try {
    const { title, desc, instructorId, rating, students, price, originalPrice, cover, isHot, status } = req.body
    const [result] = await pool.query(
      `INSERT INTO courses (title, \`desc\`, instructor_id, rating, students, price, original_price, cover, is_hot, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        title, desc, instructorId ?? null, rating ?? 5.0, students ?? 0,
        price ?? 0, originalPrice ?? null, cover ?? '', isHot ? 1 : 0, status ?? 0,
      ]
    ) as any
    return ok(res, { id: (result as any).insertId })
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

/** PUT /api/admin/courses/:id */
router.put('/courses/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { title, desc, instructorId, rating, students, price, originalPrice, cover, isHot, status } = req.body
    await pool.query(
      `UPDATE courses SET title=?, \`desc\`=?, instructor_id=?, rating=?, students=?, price=?, original_price=?, cover=?, is_hot=?, status=?, updated_at=NOW()
       WHERE id=?`,
      [
        title, desc, instructorId ?? null, rating ?? 5.0, students ?? 0,
        price ?? 0, originalPrice ?? null, cover ?? '', isHot ? 1 : 0, status ?? 0, id,
      ]
    )
    return ok(res, null)
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

/** PUT /api/admin/courses/:id/status */
router.put('/courses/:id/status', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const [rows] = await pool.query('SELECT status FROM courses WHERE id = ?', [id]) as any
    const row = (rows as any[])[0]
    if (!row) return fail(res, 404, '课程不存在')
    const newStatus = row.status === 1 ? 0 : 1
    await pool.query('UPDATE courses SET status = ?, updated_at = NOW() WHERE id = ?', [newStatus, id])
    return ok(res, { status: newStatus })
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

/** PUT /api/admin/courses/:id/hot */
router.put('/courses/:id/hot', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const [rows] = await pool.query('SELECT is_hot FROM courses WHERE id = ?', [id]) as any
    const row = (rows as any[])[0]
    if (!row) return fail(res, 404, '课程不存在')
    const newHot = row.is_hot === 1 ? 0 : 1
    await pool.query('UPDATE courses SET is_hot = ?, updated_at = NOW() WHERE id = ?', [newHot, id])
    return ok(res, { isHot: !!newHot })
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

/** DELETE /api/admin/courses/:id */
router.delete('/courses/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id)
    await pool.query('DELETE FROM courses WHERE id = ?', [id])
    return ok(res, null)
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

export default router
