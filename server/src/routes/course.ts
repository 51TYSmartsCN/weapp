import { Router } from 'express'
import { pool } from '../db'
import { ok, fail } from '../utils'

const router = Router()

/** 将 courses 行（含 instructor_name）映射为前端 Course 对象 */
function mapCourse(row: any) {
  return {
    id: row.id,
    title: row.title,
    desc: row.desc,
    instructor: row.instructor_name ?? '',
    instructorId: row.instructor_id,
    rating: Number(row.rating),
    students: row.students,
    price: Number(row.price),
    originalPrice: row.original_price != null ? Number(row.original_price) : undefined,
    cover: row.cover,
    isHot: !!row.is_hot,
    status: row.status,
  }
}

/** GET /api/courses
 * 支持 query: hot、category、page(默认1)、size(默认20)
 */
router.get('/courses', async (req, res) => {
  try {
    const hot = req.query.hot
    const category = req.query.category
    const page = Math.max(1, Number(req.query.page) || 1)
    const size = Math.max(1, Number(req.query.size) || 20)
    const offset = (page - 1) * size

    let sql: string
    let params: any[]

    if (hot === '1' || (hot as any) === 1) {
      sql = `SELECT c.*, i.name AS instructor_name
             FROM courses c
             LEFT JOIN instructors i ON c.instructor_id = i.id
             WHERE c.is_hot = 1 AND c.status = 1
             ORDER BY c.id
             LIMIT ? OFFSET ?`
      params = [size, offset]
    } else if (category) {
      sql = `SELECT c.*, i.name AS instructor_name
             FROM courses c
             LEFT JOIN instructors i ON c.instructor_id = i.id
             JOIN course_categories cc ON cc.course_id = c.id
             JOIN categories cat ON cat.id = cc.category_id
             WHERE cat.code = ? AND c.status = 1
             ORDER BY c.id
             LIMIT ? OFFSET ?`
      params = [String(category), size, offset]
    } else {
      sql = `SELECT c.*, i.name AS instructor_name
             FROM courses c
             LEFT JOIN instructors i ON c.instructor_id = i.id
             WHERE c.status = 1
             ORDER BY c.id
             LIMIT ? OFFSET ?`
      params = [size, offset]
    }

    const [rows] = await pool.query(sql, params)
    const data = (rows as any[]).map(mapCourse)
    return ok(res, data)
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

/** GET /api/courses/:id 单课程详情 */
router.get('/courses/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const [rows] = await pool.query(
      `SELECT c.*, i.name AS instructor_name
       FROM courses c
       LEFT JOIN instructors i ON c.instructor_id = i.id
       WHERE c.id = ?`,
      [id]
    )
    const row = (rows as any[])[0]
    if (!row) return fail(res, 404, '课程不存在')
    return ok(res, mapCourse(row))
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

/** GET /api/categories 分类列表 */
router.get('/categories', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY sort')
    const data = (rows as any[]).map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      sort: r.sort,
    }))
    return ok(res, data)
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

/** GET /api/courses/:courseId/lessons 课程大纲 */
router.get('/courses/:courseId/lessons', async (req, res) => {
  try {
    const courseId = Number(req.params.courseId)
    const [rows] = await pool.query(
      'SELECT * FROM lessons WHERE course_id = ? ORDER BY sort',
      [courseId]
    )
    const data = (rows as any[]).map((r) => ({
      id: r.id,
      courseId: r.course_id,
      title: r.title,
      duration: r.duration,
      durationSeconds: r.duration_seconds,
      videoUrl: r.video_url,
      sort: r.sort,
    }))
    return ok(res, data)
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

export default router
