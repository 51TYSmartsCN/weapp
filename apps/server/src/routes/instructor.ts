import { Router } from 'express'
import { pool } from '../db'
import { ok, fail } from '../utils'

const router = Router()

/** 将 instructors 行映射为前端 Instructor 对象 */
function mapInstructor(row: any) {
  return {
    id: row.id,
    name: row.name,
    title: row.title,
    service: row.service,
    color: row.color,
    status: row.status,
    bio: row.bio ?? undefined,
    avatar: row.avatar ?? undefined,
    expertise: row.expertise ? row.expertise.split(',').map((s: string) => s.trim()).filter(Boolean) : undefined,
    years: row.years != null ? Number(row.years) : undefined,
    studentCount: row.student_count != null ? Number(row.student_count) : undefined,
    courseCount: row.course_count != null ? Number(row.course_count) : undefined,
    achievements: row.achievements ? row.achievements.split('\n').map((s: string) => s.trim()).filter(Boolean) : undefined,
  }
}

/** GET /api/instructors 全部讲师 */
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM instructors WHERE status = 1 ORDER BY id')
    return ok(res, (rows as any[]).map(mapInstructor))
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

/** GET /api/instructors/:id 单个讲师 */
router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const [rows] = await pool.query('SELECT * FROM instructors WHERE id = ? AND status = 1', [id])
    const row = (rows as any[])[0]
    if (!row) return fail(res, 404, '讲师不存在')
    return ok(res, mapInstructor(row))
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

export default router
