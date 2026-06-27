import { Router } from 'express'
import { pool } from '../../db'
import { ok, fail } from '../../utils'
import { authMiddleware } from '../../auth'

const router = Router()

function mapUserRow(row: any) {
  return {
    id: row.id,
    openid: row.openid,
    name: row.name,
    avatar: row.avatar,
    vip: !!row.vip,
    vipExpireAt: row.vip_expire_at,
    boughtCourses: row.bought_courses,
    finishedLessons: row.finished_lessons,
    studyHours: row.study_hours,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/** GET /api/admin/users */
router.get('/users', authMiddleware, async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1)
    const size = Math.max(1, Number(req.query.size) || 20)
    const offset = (page - 1) * size

    const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM users') as any
    const [rows] = await pool.query(
      'SELECT * FROM users ORDER BY id DESC LIMIT ? OFFSET ?',
      [size, offset]
    ) as any[]

    const list = (rows as any[]).map(mapUserRow)
    return ok(res, { list, total: Number(total) })
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

/** GET /api/admin/users/:id */
router.get('/users/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]) as any[]
    const row = (rows as any[])[0]
    if (!row) return fail(res, 404, '用户不存在')
    return ok(res, mapUserRow(row))
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

/** PUT /api/admin/users/:id/vip */
router.put('/users/:id/vip', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { vip, vipExpireAt } = req.body
    await pool.query(
      'UPDATE users SET vip = ?, vip_expire_at = ?, updated_at = NOW() WHERE id = ?',
      [vip ? 1 : 0, vipExpireAt ?? null, id]
    )
    return ok(res, null)
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

export default router
