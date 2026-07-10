import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { pool } from '../../db'
import { ok, fail } from '../../utils'
import { authMiddleware } from '../../auth'

const router = Router()

// 讲师头像上传配置
// ts-node-dev 运行时 __dirname 指向 src/routes/admin/，需向上 3 层到达 server 根目录的 public/
const avatarDir = path.join(__dirname, '../../../public/images/instructors')
if (!fs.existsSync(avatarDir)) {
  fs.mkdirSync(avatarDir, { recursive: true })
}

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, avatarDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png'
    // 用时间戳 + 随机串避免重名
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    cb(null, `instructor-${unique}${ext}`)
  },
})

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (_req, file, cb) => {
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.mimetype)) {
      return cb(new Error('仅支持 PNG/JPG/WEBP 格式'))
    }
    cb(null, true)
  },
})

function mapInstructorRow(row: any) {
  return {
    id: row.id,
    name: row.name,
    title: row.title,
    service: row.service,
    bio: row.bio,
    color: row.color,
    avatar: row.avatar,
    status: row.status,
    expertise: row.expertise,
    years: row.years,
    studentCount: row.student_count,
    courseCount: row.course_count,
    linkedCourseCount: Number(row.linked_course_count || 0),
    achievements: row.achievements,
    createdAt: row.created_at,
  }
}

/** GET /api/admin/instructors */
router.get('/instructors', authMiddleware, async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT i.*, COUNT(c.id) AS linked_course_count
       FROM instructors i
       LEFT JOIN courses c ON c.instructor_id = i.id
       GROUP BY i.id
       ORDER BY i.id DESC`
    ) as any[]
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
    const { name, title, service, bio, color, avatar, status, expertise, years, studentCount, courseCount, achievements } = req.body
    const [result] = await pool.query(
      `INSERT INTO instructors (name, title, service, bio, color, avatar, status, expertise, years, student_count, course_count, achievements, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        name, title ?? '', service ?? '', bio ?? '', color ?? '#0D9488', avatar ?? '', status ?? 1,
        expertise ?? '', years ?? 0, studentCount ?? 0, courseCount ?? 0, achievements ?? '',
      ]
    ) as any
    return ok(res, { id: (result as any).insertId })
  } catch (err) {
    console.error(err)
    if (typeof err === 'object' && err && 'code' in err && err.code === 'ER_DATA_TOO_LONG') {
      return fail(res, 400, '头像地址过长，数据库字段未兼容或数据异常')
    }
    return fail(res, 500, '服务器错误')
  }
})

/** PUT /api/admin/instructors/:id */
router.put('/instructors/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { name, title, service, bio, color, avatar, status, expertise, years, studentCount, courseCount, achievements } = req.body
    await pool.query(
      `UPDATE instructors SET name=?, title=?, service=?, bio=?, color=?, avatar=?, status=?, expertise=?, years=?, student_count=?, course_count=?, achievements=?
       WHERE id=?`,
      [
        name, title ?? '', service ?? '', bio ?? '', color ?? '#0D9488', avatar ?? '', status ?? 1,
        expertise ?? '', years ?? 0, studentCount ?? 0, courseCount ?? 0, achievements ?? '', id,
      ]
    )
    return ok(res, null)
  } catch (err) {
    console.error(err)
    if (typeof err === 'object' && err && 'code' in err && err.code === 'ER_DATA_TOO_LONG') {
      return fail(res, 400, '头像地址过长，数据库字段未兼容或数据异常')
    }
    return fail(res, 500, '服务器错误')
  }
})

/** PUT /api/admin/instructors/:id/status */
router.put('/instructors/:id/status', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const [rows] = await pool.query('SELECT status FROM instructors WHERE id = ?', [id]) as any
    const row = (rows as any[])[0]
    if (!row) return fail(res, 404, '讲师不存在')
    const newStatus = row.status === 1 ? 0 : 1
    await pool.query('UPDATE instructors SET status = ? WHERE id = ?', [newStatus, id])
    return ok(res, { status: newStatus })
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

/** DELETE /api/admin/instructors/:id */
router.delete('/instructors/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id) || id <= 0) {
      return fail(res, 400, '讲师 ID 无效')
    }

    const [instructorRows] = await pool.query(
      'SELECT id, status FROM instructors WHERE id = ? LIMIT 1',
      [id]
    ) as any[]
    const instructor = (instructorRows as any[])[0]
    if (!instructor) {
      return fail(res, 404, '讲师不存在或已删除')
    }

    const [[courseRef]] = await pool.query(
      'SELECT COUNT(*) AS total FROM courses WHERE instructor_id = ?',
      [id]
    ) as any
    const relatedCourseCount = Number(courseRef?.total || 0)
    if (relatedCourseCount > 0) {
      if (Number(instructor.status) === 1) {
        return fail(
          res,
          400,
          `该讲师已关联 ${relatedCourseCount} 门课程，当前仍处于上架状态。如需前台隐藏，请先下架讲师；如需彻底删除，请先解除课程关联后再删除`
        )
      }
      return fail(
        res,
        400,
        `该讲师已关联 ${relatedCourseCount} 门课程，虽已下架但仍不能直接删除。请先解除课程关联后再删除`
      )
    }

    await pool.query('DELETE FROM instructors WHERE id = ?', [id])
    return ok(res, null)
  } catch (err) {
    console.error(err)
    if (
      typeof err === 'object' &&
      err &&
      'code' in err &&
      (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED')
    ) {
      return fail(res, 400, '该讲师仍有关联数据，请先解除关联后再删除')
    }
    return fail(res, 500, '服务器错误')
  }
})

/**
 * POST /api/admin/instructors/avatar
 * 上传讲师头像图片，返回可访问的 URL
 * 之后通过 PUT /instructors/:id 把 URL 写入 avatar 字段
 */
router.post('/instructors/avatar', authMiddleware, avatarUpload.single('file'), (req, res) => {
  try {
    if (!req.file) return fail(res, 400, '未收到文件')
    const url = `/images/instructors/${req.file.filename}`
    return ok(res, { url })
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

export default router
