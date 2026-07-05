import { Router } from 'express'
import { pool } from '../db'
import { ok, fail } from '../utils'
import { optionalAuthMiddleware, AuthRequest } from '../auth'

const router = Router()

/** 将 courses 行（含 instructor_name、tag_names）映射为前端 Course 对象 */
function mapCourse(row: any) {
  const tagStr: string | null = row.tag_names ?? null
  const tags = tagStr
    ? Array.from(new Set(tagStr.split(',').map((s) => s.trim()).filter(Boolean)))
    : []
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
    tags,
    isHot: !!row.is_hot,
    status: row.status,
    requiresAccess: !!row.requires_access,
  }
}

/**
 * 课程列表/详情查询的固定 JOIN 片段：
 * 通过 course_categories + categories 关联出分类名，用 GROUP_CONCAT 聚合为 tag_names。
 * 调用方 SQL 需配合 `GROUP BY c.id` 使用。
 */
const COURSE_TAG_JOIN = `
  LEFT JOIN course_categories cc ON cc.course_id = c.id
  LEFT JOIN categories cat ON cat.id = cc.category_id
`

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
      sql = `SELECT c.*, i.name AS instructor_name,
                    GROUP_CONCAT(DISTINCT cat.name SEPARATOR ',') AS tag_names
             FROM courses c
             LEFT JOIN instructors i ON c.instructor_id = i.id
             ${COURSE_TAG_JOIN}
             WHERE c.is_hot = 1 AND c.status = 1
             GROUP BY c.id
             ORDER BY c.id
             LIMIT ? OFFSET ?`
      params = [size, offset]
    } else if (category) {
      sql = `SELECT c.*, i.name AS instructor_name,
                    GROUP_CONCAT(DISTINCT cat.name SEPARATOR ',') AS tag_names
             FROM courses c
             LEFT JOIN instructors i ON c.instructor_id = i.id
             JOIN course_categories cc ON cc.course_id = c.id
             JOIN categories cat ON cat.id = cc.category_id
             WHERE cat.code = ? AND c.status = 1
             GROUP BY c.id
             ORDER BY c.id
             LIMIT ? OFFSET ?`
      params = [String(category), size, offset]
    } else {
      sql = `SELECT c.*, i.name AS instructor_name,
                    GROUP_CONCAT(DISTINCT cat.name SEPARATOR ',') AS tag_names
             FROM courses c
             LEFT JOIN instructors i ON c.instructor_id = i.id
             ${COURSE_TAG_JOIN}
             WHERE c.status = 1
             GROUP BY c.id
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
      `SELECT c.*, i.name AS instructor_name,
              GROUP_CONCAT(DISTINCT cat.name SEPARATOR ',') AS tag_names
       FROM courses c
       LEFT JOIN instructors i ON c.instructor_id = i.id
       ${COURSE_TAG_JOIN}
       WHERE c.id = ?
       GROUP BY c.id`,
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

/** GET /api/courses/:courseId/lessons 课程大纲
 * 注意:此接口不返回 videoUrl,也不返回 content
 * videoUrl 改由 GET /api/lessons/:id/play 鉴权后下发
 * content 改由 GET /api/lessons/:id/content 鉴权后获取
 */
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
      sort: r.sort,
    }))
    return ok(res, data)
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

/**
 * GET /api/courses/:id/access
 * 查询当前用户对该课程的访问权限
 * - 课程 requires_access=0（开放观看）：canLearn=true
 * - 免费课程(price=0):canLearn=true
 * - VIP 用户:canLearn=true
 * - 付费课程:用户在 user_courses 中存在记录 → canLearn=true
 * - 未登录用户:仅免费课或开放观看课 canLearn=true
 *
 * 返回 CourseAccess: { courseId, isFree, purchased, canLearn, isVip }
 */
router.get('/courses/:id/access', optionalAuthMiddleware, async (req, res) => {
  try {
    const courseId = Number(req.params.id)
    if (!Number.isFinite(courseId)) return fail(res, 400, '参数错误')

    // 查课程
    const [courseRows] = await pool.query(
      'SELECT price, requires_access FROM courses WHERE id = ?',
      [courseId]
    )
    const courseRow = (courseRows as any[])[0]
    if (!courseRow) return fail(res, 404, '课程不存在')

    const isFree = Number(courseRow.price) === 0
    // requires_access=0 表示后台已关闭权限校验，任何人都可观看（测试用）
    const accessOpen = !courseRow.requires_access || Number(courseRow.requires_access) === 0

    // 未登录场景:免费课或开放观看课 canLearn=true
    const authReq = req as AuthRequest
    if (!authReq.userId) {
      const canLearn = isFree || accessOpen
      return ok(res, {
        courseId,
        isFree,
        purchased: canLearn,
        canLearn,
        isVip: false,
      })
    }

    // 已登录:免费课或开放观看 → canLearn=true
    if (isFree || accessOpen) {
      return ok(res, { courseId, isFree: true, purchased: true, canLearn: true, isVip: false })
    }

    // 查询用户是否为 VIP
    const [userRows] = await pool.query(
      'SELECT vip, vip_expire_at FROM users WHERE id = ?',
      [authReq.userId]
    )
    const userRow = (userRows as any[])[0]
    const isVip = userRow && Number(userRow.vip) === 1 &&
      (!userRow.vip_expire_at || new Date(userRow.vip_expire_at) > new Date())

    // VIP 用户直接可以观看
    if (isVip) {
      return ok(res, {
        courseId,
        isFree: false,
        purchased: true,
        canLearn: true,
        isVip: true,
      })
    }

    const [ucRows] = await pool.query(
      'SELECT id FROM user_courses WHERE user_id = ? AND course_id = ?',
      [authReq.userId, courseId]
    )
    const purchased = (ucRows as any[]).length > 0
    return ok(res, {
      courseId,
      isFree: false,
      purchased,
      canLearn: purchased,
      isVip: false,
    })
  } catch (err) {
    console.error('[course] access error:', err)
    return fail(res, 500, '服务器错误')
  }
})

export default router
