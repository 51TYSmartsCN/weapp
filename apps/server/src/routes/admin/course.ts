import { Router } from 'express'
import type { PoolConnection } from 'mysql2/promise'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { pool } from '../../db'
import { ok, fail } from '../../utils'
import { authMiddleware } from '../../auth'

const router = Router()
const COURSE_COVER_MAX_SIZE = 2 * 1024 * 1024

const courseCoverDir = path.join(__dirname, '../../../public/images/courses')
if (!fs.existsSync(courseCoverDir)) {
  fs.mkdirSync(courseCoverDir, { recursive: true })
}

const courseCoverStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, courseCoverDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg'
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    cb(null, `course-cover-${unique}${ext}`)
  },
})

const courseCoverUpload = multer({
  storage: courseCoverStorage,
  limits: { fileSize: COURSE_COVER_MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!['image/png', 'image/jpeg'].includes(file.mimetype)) {
      return cb(new Error('仅支持 PNG/JPG 格式'))
    }
    cb(null, true)
  },
})

function mapCourseRow(row: any) {
  const categoryIds = String(row.category_ids || '')
    .split(',')
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item))
  const categoryNames = String(row.category_names || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

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
    requiresAccess: !!row.requires_access,
    categoryIds,
    categoryNames,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function normalizeCategoryIds(input: unknown): number[] {
  if (!Array.isArray(input)) return []
  return Array.from(
    new Set(
      input
        .map((item) => Number(item))
        .filter((item) => Number.isInteger(item) && item > 0)
    )
  )
}

async function ensureCategoriesExist(conn: PoolConnection, categoryIds: number[]) {
  if (!categoryIds.length) return
  const [rows] = await conn.query(
    'SELECT id FROM categories WHERE id IN (?)',
    [categoryIds]
  ) as any
  if ((rows as any[]).length !== categoryIds.length) {
    throw new Error('课程分类不存在或已失效')
  }
}

async function syncCourseCategories(conn: PoolConnection, courseId: number, categoryIds: number[]) {
  await conn.query('DELETE FROM course_categories WHERE course_id = ?', [courseId])
  if (!categoryIds.length) return
  const values = categoryIds.map((categoryId) => [courseId, categoryId])
  await conn.query(
    'INSERT INTO course_categories (course_id, category_id) VALUES ?',
    [values]
  )
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
      `SELECT c.*, i.name AS instructor_name,
              GROUP_CONCAT(DISTINCT cat.id ORDER BY cat.sort, cat.id SEPARATOR ',') AS category_ids,
              GROUP_CONCAT(DISTINCT cat.name ORDER BY cat.sort, cat.id SEPARATOR ',') AS category_names
       FROM courses c
       LEFT JOIN instructors i ON c.instructor_id = i.id
       LEFT JOIN course_categories cc ON cc.course_id = c.id
       LEFT JOIN categories cat ON cat.id = cc.category_id
       ${where}
       GROUP BY c.id
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
  const conn = await pool.getConnection()
  try {
    const {
      title,
      desc,
      instructorId,
      rating,
      students,
      price,
      originalPrice,
      cover,
      isHot,
      status,
      requiresAccess,
      categoryIds,
    } = req.body
    const normalizedCategoryIds = normalizeCategoryIds(categoryIds)

    await conn.beginTransaction()
    await ensureCategoriesExist(conn, normalizedCategoryIds)

    const [result] = await conn.query(
      `INSERT INTO courses (title, \`desc\`, instructor_id, rating, students, price, original_price, cover, is_hot, status, requires_access, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        title, desc, instructorId ?? null, rating ?? 5.0, students ?? 0,
        price ?? 0, originalPrice ?? null, cover ?? '', isHot ? 1 : 0, status ?? 0,
        requiresAccess === false ? 0 : 1,
      ]
    ) as any
    const courseId = Number((result as any).insertId)
    await syncCourseCategories(conn, courseId, normalizedCategoryIds)
    await conn.commit()
    return ok(res, { id: (result as any).insertId })
  } catch (err) {
    await conn.rollback()
    console.error(err)
    return fail(res, 500, err instanceof Error ? err.message : '服务器错误')
  } finally {
    conn.release()
  }
})

/**
 * POST /api/admin/courses/cover
 * 上传课程封面图，返回可访问 URL
 */
router.post('/courses/cover', authMiddleware, (req, res) => {
  courseCoverUpload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return fail(res, 400, '封面图片大小不能超过 2MB')
    }

    if (err) {
      return fail(res, 400, err.message || '封面上传失败')
    }

    try {
      if (!req.file) return fail(res, 400, '未收到文件')
      const url = `/images/courses/${req.file.filename}`
      return ok(res, { url })
    } catch (error) {
      console.error(error)
      return fail(res, 500, '服务器错误')
    }
  })
})

/** PUT /api/admin/courses/:id */
router.put('/courses/:id', authMiddleware, async (req, res) => {
  const conn = await pool.getConnection()
  try {
    const id = Number(req.params.id)
    const {
      title,
      desc,
      instructorId,
      rating,
      students,
      price,
      originalPrice,
      cover,
      isHot,
      status,
      requiresAccess,
      categoryIds,
    } = req.body
    const normalizedCategoryIds = normalizeCategoryIds(categoryIds)

    await conn.beginTransaction()
    await ensureCategoriesExist(conn, normalizedCategoryIds)

    await conn.query(
      `UPDATE courses SET title=?, \`desc\`=?, instructor_id=?, rating=?, students=?, price=?, original_price=?, cover=?, is_hot=?, status=?, requires_access=?, updated_at=NOW()
       WHERE id=?`,
      [
        title, desc, instructorId ?? null, rating ?? 5.0, students ?? 0,
        price ?? 0, originalPrice ?? null, cover ?? '', isHot ? 1 : 0, status ?? 0,
        requiresAccess === false ? 0 : 1, id,
      ]
    )
    await syncCourseCategories(conn, id, normalizedCategoryIds)
    await conn.commit()
    return ok(res, null)
  } catch (err) {
    await conn.rollback()
    console.error(err)
    return fail(res, 500, err instanceof Error ? err.message : '服务器错误')
  } finally {
    conn.release()
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

/** PUT /api/admin/courses/:id/access
 * 切换课程是否需要购课权限才能观看视频
 * - requires_access=1：需要购买/登录（默认）
 * - requires_access=0：开放观看（测试用，任何人都可播放视频）
 */
router.put('/courses/:id/access', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const [rows] = await pool.query('SELECT requires_access FROM courses WHERE id = ?', [id]) as any
    const row = (rows as any[])[0]
    if (!row) return fail(res, 404, '课程不存在')
    const newAccess = row.requires_access === 1 ? 0 : 1
    await pool.query(
      'UPDATE courses SET requires_access = ?, updated_at = NOW() WHERE id = ?',
      [newAccess, id]
    )
    return ok(res, { requiresAccess: !!newAccess })
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
