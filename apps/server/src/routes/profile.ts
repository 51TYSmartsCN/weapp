import { Router, Request, Response } from 'express'
import { pool } from '../db'
import { ok, fail } from '../utils'
import { authMiddleware, AuthRequest } from '../auth'

const router = Router()

/**
 * profile.ts 同时承载多个不同前缀的端点：
 *   公开：GET /help-articles
 *   受保护：GET /coupons、GET /invitations、GET /certificates、GET /study-records、POST /feedbacks
 * 挂载方式：app.use('/api', profileRoutes)
 */

/** GET /api/help-articles - 帮助文章列表（公开），支持 query category，ORDER BY sort */
router.get('/help-articles', async (req: Request, res: Response) => {
  try {
    const { category } = req.query
    let sql = 'SELECT * FROM help_articles'
    const params: any[] = []
    if (category && typeof category === 'string') {
      sql += ' WHERE category = ?'
      params.push(category)
    }
    sql += ' ORDER BY sort'
    const [rows] = await pool.query(sql, params)
    const list = (rows as any[]).map((r) => ({
      id: r.id,
      title: r.title,
      content: r.content,
      category: r.category,
      sort: r.sort,
    }))
    ok(res, list)
  } catch (err) {
    console.error('[profile] help-articles error:', err)
    fail(res, 500, '获取帮助文章失败')
  }
})

/** GET /api/coupons - 我的优惠券（受保护） */
router.get('/coupons', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId!
    const [rows] = await pool.query(
      'SELECT * FROM coupons WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    )
    const list = (rows as any[]).map((r) => ({
      id: r.id,
      userId: r.user_id,
      code: r.code,
      type: r.type,
      value: Number(r.value),
      minAmount: Number(r.min_amount),
      expireAt: r.expire_at,
      status: r.status,
      createdAt: r.created_at,
    }))
    ok(res, list)
  } catch (err) {
    console.error('[profile] coupons error:', err)
    fail(res, 500, '获取优惠券失败')
  }
})

/** GET /api/invitations - 邀请好友汇总（受保护） */
router.get(
  '/invitations',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthRequest).userId!
      const [rows] = await pool.query(
        'SELECT * FROM invitations WHERE inviter_id = ? ORDER BY created_at DESC',
        [userId]
      )
      const invitations = (rows as any[]).map((r) => ({
        id: r.id,
        inviterId: r.inviter_id,
        inviteeId: r.invitee_id,
        reward: Number(r.reward),
        createdAt: r.created_at,
      }))
      const invitedCount = invitations.length
      const rewardTotal = invitations.reduce(
        (sum, inv) => sum + inv.reward,
        0
      )
      ok(res, { invitedCount, rewardTotal, invitations })
    } catch (err) {
      console.error('[profile] invitations error:', err)
      fail(res, 500, '获取邀请信息失败')
    }
  }
)

/** GET /api/certificates - 我的证书（受保护） */
router.get(
  '/certificates',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthRequest).userId!
      const [rows] = await pool.query(
        `SELECT cert.*, c.title AS course_title
         FROM certificates cert
         JOIN courses c ON c.id = cert.course_id
         WHERE cert.user_id = ?
         ORDER BY cert.issued_at DESC`,
        [userId]
      )
      const list = (rows as any[]).map((r) => ({
        id: r.id,
        userId: r.user_id,
        courseId: r.course_id,
        courseTitle: r.course_title,
        certificateNo: r.certificate_no,
        issuedAt: r.issued_at,
      }))
      ok(res, list)
    } catch (err) {
      console.error('[profile] certificates error:', err)
      fail(res, 500, '获取证书失败')
    }
  }
)

/** GET /api/study-records - 学习记录（受保护），ORDER BY studied_at DESC */
router.get(
  '/study-records',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthRequest).userId!
      const [rows] = await pool.query(
        `SELECT sr.*, c.title AS course_title, l.title AS lesson_title
         FROM study_records sr
         JOIN courses c ON c.id = sr.course_id
         JOIN lessons l ON l.id = sr.lesson_id
         WHERE sr.user_id = ?
         ORDER BY sr.studied_at DESC`,
        [userId]
      )
      const list = (rows as any[]).map((r) => ({
        id: r.id,
        userId: r.user_id,
        courseId: r.course_id,
        courseTitle: r.course_title,
        lessonId: r.lesson_id,
        lessonTitle: r.lesson_title,
        duration: r.duration,
        studiedAt: r.studied_at,
      }))
      ok(res, list)
    } catch (err) {
      console.error('[profile] study-records error:', err)
      fail(res, 500, '获取学习记录失败')
    }
  }
)

/** POST /api/feedbacks - 提交意见反馈（受保护），body: { type, content, contact? } */
router.post('/feedbacks', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId!
    const { type, content, contact } = req.body || {}
    if (!type || typeof type !== 'string' || !content || typeof content !== 'string') {
      return fail(res, 400, '参数错误')
    }

    const [insertResult] = await pool.query(
      `INSERT INTO feedbacks (user_id, type, content, contact, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [userId, type, content, contact ?? null]
    )
    const feedbackId = (insertResult as any).insertId

    const [rows] = await pool.query('SELECT * FROM feedbacks WHERE id = ?', [
      feedbackId,
    ])
    const r = (rows as any[])[0]
    ok(res, {
      id: r.id,
      userId: r.user_id,
      type: r.type,
      content: r.content,
      contact: r.contact,
      createdAt: r.created_at,
    })
  } catch (err) {
    console.error('[profile] feedback error:', err)
    fail(res, 500, '提交反馈失败')
  }
})

export default router
