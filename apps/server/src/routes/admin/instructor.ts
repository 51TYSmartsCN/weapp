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
