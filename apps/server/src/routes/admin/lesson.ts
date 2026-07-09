import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { pool } from '../../db'
import { ok, fail } from '../../utils'
import { authMiddleware } from '../../auth'

const router = Router()
const LESSON_VIDEO_MAX_SIZE = 200 * 1024 * 1024
const ALLOWED_VIDEO_MIME_TYPES = ['video/mp4', 'video/quicktime', 'video/x-m4v']
const ALLOWED_VIDEO_EXTENSIONS = ['.mp4', '.mov', '.m4v']

const lessonVideoDir = path.join(__dirname, '../../../public/videos/lessons')
if (!fs.existsSync(lessonVideoDir)) {
  fs.mkdirSync(lessonVideoDir, { recursive: true })
}

function isAllowedVideoFile(file: Express.Multer.File) {
  const ext = path.extname(file.originalname).toLowerCase()
  return ALLOWED_VIDEO_MIME_TYPES.includes(file.mimetype) && ALLOWED_VIDEO_EXTENSIONS.includes(ext)
}

const lessonVideoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, lessonVideoDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.mp4'
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    cb(null, `lesson-video-${unique}${ext}`)
  },
})

const lessonVideoUpload = multer({
  storage: lessonVideoStorage,
  limits: { fileSize: LESSON_VIDEO_MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!isAllowedVideoFile(file)) {
      return cb(new Error('仅支持 MP4/MOV/M4V 格式'))
    }
    cb(null, true)
  },
})

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
    if (!Number.isInteger(Number(courseId)) || Number(courseId) <= 0) {
      return fail(res, 400, '缺少有效的 courseId')
    }
    if (!String(title || '').trim()) {
      return fail(res, 400, '缺少课时标题')
    }
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

/**
 * POST /api/admin/lessons/video
 * 上传课时视频，返回可访问 URL；之后通过创建/编辑课时写入 videoUrl 字段
 */
router.post('/lessons/video', authMiddleware, (req, res) => {
  lessonVideoUpload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return fail(res, 400, '视频大小不能超过 200MB')
    }

    if (err) {
      return fail(res, 400, err.message || '视频上传失败')
    }

    try {
      if (!req.file) return fail(res, 400, '未收到文件')
      const url = `/videos/lessons/${req.file.filename}`
      return ok(res, { url })
    } catch (error) {
      console.error(error)
      return fail(res, 500, '服务器错误')
    }
  })
})

/** PUT /api/admin/lessons/:id */
router.put('/lessons/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { courseId, title, duration, durationSeconds, videoUrl, content, sort } = req.body
    if (!Number.isInteger(id) || id <= 0) {
      return fail(res, 400, '缺少有效的课时 ID')
    }
    if (!Number.isInteger(Number(courseId)) || Number(courseId) <= 0) {
      return fail(res, 400, '缺少有效的 courseId')
    }
    if (!String(title || '').trim()) {
      return fail(res, 400, '缺少课时标题')
    }
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
