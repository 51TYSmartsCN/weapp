import { Router } from 'express'
import { pool } from '../../db'
import { ok, fail } from '../../utils'
import { authMiddleware } from '../../auth'

const router = Router()

function mapInstructorRow(row: any) {
  return {
    id: row.id,
    name: row.name,
    title: row.title,
    service: row.service,
    bio: row.bio,
    color: row.color,
    avatar: row.avatar,
    expertise: row.expertise,
    years: row.years,
    studentCount: row.student_count,
    courseCount: row.course_count,
    achievements: row.achievements,
    createdAt: row.created_at,
  }
}

/** GET /api/admin/instructors */
router.get('/instructors', authMiddleware, async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM instructors ORDER BY id DESC') as any[]
    const list = (rows as any[]).map(mapInstructorRow)
    return ok(res, list)
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

/** POST /api/admin/instructors */
router.post('/instructors', authMiddleware, async (req, res) => {
  try {
    const { name, title, service, bio, color, avatar, expertise, years, studentCount, courseCount, achievements } = req.body
    const [result] = await pool.query(
      `INSERT INTO instructors (name, title, service, bio, color, avatar, expertise, years, student_count, course_count, achievements, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        name, title ?? '', service ?? '', bio ?? '', color ?? '#0D9488', avatar ?? '',
        expertise ?? '', years ?? 0, studentCount ?? 0, courseCount ?? 0, achievements ?? '',
      ]
    ) as any
    return ok(res, { id: (result as any).insertId })
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

/** PUT /api/admin/instructors/:id */
router.put('/instructors/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { name, title, service, bio, color, avatar, expertise, years, studentCount, courseCount, achievements } = req.body
    await pool.query(
      `UPDATE instructors SET name=?, title=?, service=?, bio=?, color=?, avatar=?, expertise=?, years=?, student_count=?, course_count=?, achievements=?
       WHERE id=?`,
      [
        name, title ?? '', service ?? '', bio ?? '', color ?? '#0D9488', avatar ?? '',
        expertise ?? '', years ?? 0, studentCount ?? 0, courseCount ?? 0, achievements ?? '', id,
      ]
    )
    return ok(res, null)
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

/** DELETE /api/admin/instructors/:id */
router.delete('/instructors/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id)
    await pool.query('DELETE FROM instructors WHERE id = ?', [id])
    return ok(res, null)
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

export default router
