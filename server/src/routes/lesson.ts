import { Router, Request, Response } from 'express'
import { pool } from '../db'
import { ok, fail } from '../utils'
import { authMiddleware, AuthRequest } from '../auth'

const router = Router()

/** 将 lessons 行转换为 camelCase */
function mapLesson(row: any) {
  return {
    id: row.id,
    courseId: row.course_id,
    title: row.title,
    duration: row.duration,
    durationSeconds: row.duration_seconds,
    videoUrl: row.video_url,
    sort: row.sort,
  }
}

/** GET /api/lessons - 全部课时 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM lessons ORDER BY course_id, sort'
    )
    ok(res, (rows as any[]).map(mapLesson))
  } catch (err) {
    console.error('[lesson] list error:', err)
    fail(res, 500, '获取课时列表失败')
  }
})

/** GET /api/lessons/:id - 单个课时 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isFinite(id)) return fail(res, 400, '参数错误')
    const [rows] = await pool.query('SELECT * FROM lessons WHERE id = ?', [id])
    const list = rows as any[]
    if (list.length === 0) return fail(res, 404, '课时不存在')
    ok(res, mapLesson(list[0]))
  } catch (err) {
    console.error('[lesson] detail error:', err)
    fail(res, 500, '获取课时失败')
  }
})

/** POST /api/lessons/:lessonId/progress - 上报学习进度（受保护） */
router.post(
  '/:lessonId/progress',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthRequest).userId!
      const lessonId = Number(req.params.lessonId)
      if (!Number.isFinite(lessonId)) return fail(res, 400, '参数错误')

      const { watchedSeconds, completed, lastPosition } = req.body || {}
      if (
        typeof watchedSeconds !== 'number' ||
        typeof completed !== 'boolean' ||
        typeof lastPosition !== 'number'
      ) {
        return fail(res, 400, '参数错误')
      }

      // 查 lesson 拿 course_id
      const [lessonRows] = await pool.query(
        'SELECT course_id FROM lessons WHERE id = ?',
        [lessonId]
      )
      const lessonList = lessonRows as any[]
      if (lessonList.length === 0) return fail(res, 404, '课时不存在')
      const courseId = lessonList[0].course_id

      // UPSERT lesson_progress
      await pool.query(
        `INSERT INTO lesson_progress (user_id, lesson_id, course_id, completed, watched_seconds, last_position, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE
           completed = VALUES(completed),
           watched_seconds = VALUES(watched_seconds),
           last_position = VALUES(last_position),
           updated_at = NOW()`,
        [userId, lessonId, courseId, completed ? 1 : 0, watchedSeconds, lastPosition]
      )

      // 完成时重新统计并更新 user_courses
      if (completed) {
        const [countRows] = await pool.query(
          'SELECT COUNT(*) AS cnt FROM lesson_progress WHERE user_id = ? AND course_id = ? AND completed = 1',
          [userId, courseId]
        )
        const completedLessons = (countRows as any[])[0].cnt

        const [totalRows] = await pool.query(
          'SELECT COUNT(*) AS cnt FROM lessons WHERE course_id = ?',
          [courseId]
        )
        const totalLessons = (totalRows as any[])[0].cnt

        const progress =
          totalLessons > 0
            ? Math.round((completedLessons / totalLessons) * 100)
            : 0

        await pool.query(
          `UPDATE user_courses
           SET completed_lessons = ?, progress = ?, status = ?, last_study_at = NOW(), updated_at = NOW()
           WHERE user_id = ? AND course_id = ?`,
          [completedLessons, progress, progress === 100 ? 2 : 1, userId, courseId]
        )

        // 进度满 100 且无证书，颁发证书
        if (progress === 100) {
          const [certRows] = await pool.query(
            'SELECT id FROM certificates WHERE user_id = ? AND course_id = ?',
            [userId, courseId]
          )
          if ((certRows as any[]).length === 0) {
            const certificateNo = `GEO${userId}${courseId}${Date.now()}`
            await pool.query(
              'INSERT INTO certificates (user_id, course_id, certificate_no, issued_at) VALUES (?, ?, ?, NOW())',
              [userId, courseId, certificateNo]
            )
          }
        }
      }

      // 记录学习流水
      await pool.query(
        'INSERT INTO study_records (user_id, course_id, lesson_id, duration, studied_at) VALUES (?, ?, ?, ?, NOW())',
        [userId, courseId, lessonId, watchedSeconds]
      )

      // 返回更新后的 LessonProgress 对象
      const [progressRows] = await pool.query(
        'SELECT * FROM lesson_progress WHERE user_id = ? AND lesson_id = ?',
        [userId, lessonId]
      )
      const progressRow = (progressRows as any[])[0]
      ok(res, {
        id: progressRow.id,
        userId: progressRow.user_id,
        lessonId: progressRow.lesson_id,
        courseId: progressRow.course_id,
        completed: progressRow.completed === 1,
        watchedSeconds: progressRow.watched_seconds,
        lastPosition: progressRow.last_position,
        updatedAt: progressRow.updated_at,
      })
    } catch (err) {
      console.error('[lesson] progress error:', err)
      fail(res, 500, '进度上报失败')
    }
  }
)

export default router
