import { Router, Request, Response } from 'express'
import { pool } from '../db'
import { ok, fail, signUrlPayload, verifyUrlToken } from '../utils'
import { authMiddleware, AuthRequest, optionalAuthMiddleware } from '../auth'

const router = Router()

/** 将 lessons 行转换为 camelCase(列表/详情不返回 videoUrl,不返回 content) */
function mapLesson(row: any) {
  return {
    id: row.id,
    courseId: row.course_id,
    title: row.title,
    duration: row.duration,
    durationSeconds: row.duration_seconds,
    sort: row.sort,
  }
}

/** GET /api/lessons - 全部课时(不返回 videoUrl,不返回 content) */
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

/** GET /api/lessons/:id - 单个课时(不返回 videoUrl,不返回 content) */
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

/**
 * 校验课程访问权限的通用函数
 * 权限优先级：开放观看 > 免费课程 > VIP 用户 > 已购买用户
 */
async function checkCourseAccess(
  userId: number | undefined,
  courseId: number
): Promise<{ canAccess: boolean; reason?: string; isFree: boolean; accessOpen: boolean; isVip: boolean }> {
  const [courseRows] = await pool.query(
    'SELECT price, requires_access FROM courses WHERE id = ?',
    [courseId]
  )
  const courseRow = (courseRows as any[])[0]
  if (!courseRow) return { canAccess: false, reason: '课程不存在', isFree: false, accessOpen: false, isVip: false }

  const isFree = Number(courseRow.price) === 0
  const accessOpen = !courseRow.requires_access || Number(courseRow.requires_access) === 0

  if (isFree || accessOpen) {
    return { canAccess: true, isFree, accessOpen, isVip: false }
  }

  if (!userId) {
    return { canAccess: false, reason: '请先登录', isFree, accessOpen, isVip: false }
  }

  const [userRows] = await pool.query(
    'SELECT vip, vip_expire_at FROM users WHERE id = ?',
    [userId]
  )
  const userRow = (userRows as any[])[0]
  const isVip = userRow && Number(userRow.vip) === 1 &&
    (!userRow.vip_expire_at || new Date(userRow.vip_expire_at) > new Date())

  if (isVip) {
    return { canAccess: true, isFree, accessOpen, isVip: true }
  }

  const [ucRows] = await pool.query(
    'SELECT id FROM user_courses WHERE user_id = ? AND course_id = ?',
    [userId, courseId]
  )
  if ((ucRows as any[]).length === 0) {
    return { canAccess: false, reason: '请先购买课程', isFree, accessOpen, isVip: false }
  }
  return { canAccess: true, isFree, accessOpen, isVip: false }
}

/**
 * GET /api/lessons/:id/play
 * 鉴权后下发带签名的临时视频地址
 * - 必须登录
 * - 课程 requires_access=0（开放观看）→ 返回
 * - 课程免费(price=0)→ 返回
 * - 课程付费 → 用户在 user_courses 中存在记录才返回,否则 403
 *
 * 返回 LessonPlayUrl: { lessonId, courseId, videoUrl, expiresAt }
 * videoUrl 为带签名的代理URL，有效期 2 小时
 */
router.get('/:id/play', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId!
    const lessonId = Number(req.params.id)
    if (!Number.isFinite(lessonId)) return fail(res, 400, '参数错误')

    // 1. 查课时
    const [lessonRows] = await pool.query('SELECT * FROM lessons WHERE id = ?', [lessonId])
    const lessonRow = (lessonRows as any[])[0]
    if (!lessonRow) return fail(res, 404, '课时不存在')
    const courseId = lessonRow.course_id

    // 2. 校验访问权限
    const access = await checkCourseAccess(userId, courseId)
    if (!access.canAccess) {
      return fail(res, 403, access.reason || '无访问权限')
    }

    // 3. 生成带签名的临时播放 token（2小时有效）
    const token = signUrlPayload(
      { uid: userId, lid: lessonId, cid: courseId, t: 'video' },
      2 * 60 * 60 * 1000
    )

    // 4. 拼接代理 URL（由 /api/lessons/:id/stream 校验签名后重定向到真实视频）
    const host = req.get('host') || `localhost:${process.env.PORT || 4000}`
    const protocol = req.protocol || 'http'
    const proxyUrl = `${protocol}://${host}/api/lessons/${lessonId}/stream?token=${token}`

    return ok(res, {
      lessonId,
      courseId,
      videoUrl: proxyUrl,
      expiresAt: Date.now() + 2 * 60 * 60 * 1000,
    })
  } catch (err) {
    console.error('[lesson] play error:', err)
    return fail(res, 500, '获取视频地址失败')
  }
})

/**
 * GET /api/lessons/:id/stream
 * 视频播放代理：校验签名 token 合法后，302 重定向到真实视频地址
 * 这样真实视频地址不会暴露给用户，且签名过期后链接失效
 */
router.get('/:id/stream', async (req: Request, res: Response) => {
  try {
    const lessonId = Number(req.params.id)
    const token = String(req.query.token || '')
    if (!Number.isFinite(lessonId) || !token) {
      return fail(res, 400, '参数错误')
    }

    // 1. 校验签名
    const payload = verifyUrlToken(token)
    if (!payload) {
      return fail(res, 403, '链接已失效，请重新获取')
    }
    if (Number(payload.lid) !== lessonId || payload.t !== 'video') {
      return fail(res, 403, '签名不匹配')
    }

    // 2. 查课时的真实视频地址
    const [lessonRows] = await pool.query('SELECT video_url FROM lessons WHERE id = ?', [lessonId])
    const lessonRow = (lessonRows as any[])[0]
    if (!lessonRow || !lessonRow.video_url) {
      return fail(res, 404, '视频不存在')
    }

    // 3. 302 重定向到真实视频地址（浏览器/Video 标签会自动跟随）
    // 注意：如果视频在本地，应该用流式返回而不是重定向，这里兼容外部 URL 的情况
    return res.redirect(302, lessonRow.video_url)
  } catch (err) {
    console.error('[lesson] stream error:', err)
    return fail(res, 500, '视频加载失败')
  }
})

/**
 * GET /api/lessons/:id/content
 * 获取课时图文内容（鉴权）
 * - 未登录：免费课或开放课可看
 * - 已登录：免费课、开放课、已购课可看
 */
router.get('/:id/content', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId
    const lessonId = Number(req.params.id)
    if (!Number.isFinite(lessonId)) return fail(res, 400, '参数错误')

    // 1. 查课时
    const [lessonRows] = await pool.query('SELECT * FROM lessons WHERE id = ?', [lessonId])
    const lessonRow = (lessonRows as any[])[0]
    if (!lessonRow) return fail(res, 404, '课时不存在')
    const courseId = lessonRow.course_id

    // 2. 校验访问权限
    const access = await checkCourseAccess(userId, courseId)
    if (!access.canAccess) {
      return fail(res, 403, access.reason || '无访问权限')
    }

    // 3. 返回图文内容
    return ok(res, {
      lessonId,
      courseId,
      content: lessonRow.content ?? '',
    })
  } catch (err) {
    console.error('[lesson] content error:', err)
    return fail(res, 500, '获取课程内容失败')
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
