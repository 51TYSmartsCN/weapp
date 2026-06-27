import { Router } from 'express'
import { pool } from '../../db'
import { ok, fail } from '../../utils'
import { authMiddleware } from '../../auth'

const router = Router()

function mapBannerRow(row: any) {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    image: row.image,
    linkType: row.link_type,
    linkValue: row.link_value,
    sort: row.sort,
    status: row.status,
    createdAt: row.created_at,
  }
}

/** GET /api/admin/banners */
router.get('/banners', authMiddleware, async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM banners ORDER BY sort, id DESC') as any[]
    const list = (rows as any[]).map(mapBannerRow)
    return ok(res, list)
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

/** POST /api/admin/banners */
router.post('/banners', authMiddleware, async (req, res) => {
  try {
    const { title, subtitle, image, linkType, linkValue, sort, status } = req.body
    const [result] = await pool.query(
      `INSERT INTO banners (title, subtitle, image, link_type, link_value, sort, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [title, subtitle ?? '', image ?? '', linkType ?? '', linkValue ?? '', sort ?? 0, status ?? 1]
    ) as any
    return ok(res, { id: (result as any).insertId })
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

/** PUT /api/admin/banners/:id */
router.put('/banners/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { title, subtitle, image, linkType, linkValue, sort, status } = req.body
    await pool.query(
      `UPDATE banners SET title=?, subtitle=?, image=?, link_type=?, link_value=?, sort=?, status=?
       WHERE id=?`,
      [title, subtitle ?? '', image ?? '', linkType ?? '', linkValue ?? '', sort ?? 0, status ?? 1, id]
    )
    return ok(res, null)
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

/** PUT /api/admin/banners/:id/status */
router.put('/banners/:id/status', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const [rows] = await pool.query('SELECT status FROM banners WHERE id = ?', [id]) as any
    const row = (rows as any[])[0]
    if (!row) return fail(res, 404, 'Banner不存在')
    const newStatus = row.status === 1 ? 0 : 1
    await pool.query('UPDATE banners SET status = ? WHERE id = ?', [newStatus, id])
    return ok(res, { status: newStatus })
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

/** DELETE /api/admin/banners/:id */
router.delete('/banners/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id)
    await pool.query('DELETE FROM banners WHERE id = ?', [id])
    return ok(res, null)
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

export default router
