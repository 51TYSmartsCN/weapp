import { Router } from 'express'
import { pool } from '../../db'
import { ok, fail } from '../../utils'
import { authMiddleware } from '../../auth'

const router = Router()

function mapRow(row: any) {
  return {
    id: row.id,
    productId: row.product_id,
    productTitle: row.product_title,
    courseId: row.course_id,
    courseTitle: row.course_title,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/** GET /api/admin/wxshop-products */
router.get('/wxshop-products', authMiddleware, async (req, res) => {
  try {
    const page = Number(req.query.page) || 1
    const size = Number(req.query.size) || 20
    const search = (req.query.search as string) || ''
    const status = req.query.status !== undefined ? Number(req.query.status) : null
    const offset = (page - 1) * size

    const where: string[] = []
    const params: any[] = []
    if (search) {
      where.push('(product_id LIKE ? OR product_title LIKE ? OR course_title LIKE ?)')
      params.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }
    if (status !== null) {
      where.push('status = ?')
      params.push(status)
    }
    const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM wxshop_products ${whereSql}`,
      params
    ) as any
    const total = (countRows as any[])[0].total

    const [rows] = await pool.query(
      `SELECT * FROM wxshop_products ${whereSql} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...params, size, offset]
    ) as any
    const list = (rows as any[]).map(mapRow)

    return ok(res, { list, total })
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

/** POST /api/admin/wxshop-products */
router.post('/wxshop-products', authMiddleware, async (req, res) => {
  try {
    const { productId, productTitle, courseId, courseTitle, status } = req.body
    if (!productId || !courseId) {
      return fail(res, 400, '商品ID和课程ID不能为空')
    }
    const [result] = await pool.query(
      `INSERT INTO wxshop_products (product_id, product_title, course_id, course_title, status)
       VALUES (?, ?, ?, ?, ?)`,
      [productId, productTitle || '', courseId, courseTitle || '', status ?? 1]
    ) as any
    return ok(res, { id: (result as any).insertId })
  } catch (err: any) {
    console.error(err)
    if (err.code === 'ER_DUP_ENTRY') {
      return fail(res, 400, '该商品ID已存在映射')
    }
    return fail(res, 500, '服务器错误')
  }
})

/** PUT /api/admin/wxshop-products/:id */
router.put('/wxshop-products/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { productId, productTitle, courseId, courseTitle, status } = req.body
    if (!productId || !courseId) {
      return fail(res, 400, '商品ID和课程ID不能为空')
    }
    await pool.query(
      `UPDATE wxshop_products SET product_id=?, product_title=?, course_id=?, course_title=?, status=? WHERE id=?`,
      [productId, productTitle || '', courseId, courseTitle || '', status ?? 1, id]
    )
    return ok(res, null)
  } catch (err: any) {
    console.error(err)
    if (err.code === 'ER_DUP_ENTRY') {
      return fail(res, 400, '该商品ID已存在映射')
    }
    return fail(res, 500, '服务器错误')
  }
})

/** DELETE /api/admin/wxshop-products/:id */
router.delete('/wxshop-products/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id)
    await pool.query('DELETE FROM wxshop_products WHERE id = ?', [id])
    return ok(res, null)
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

/** PUT /api/admin/wxshop-products/:id/status */
router.put('/wxshop-products/:id/status', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { status } = req.body
    await pool.query('UPDATE wxshop_products SET status = ? WHERE id = ?', [status ? 1 : 0, id])
    return ok(res, { status: status ? 1 : 0 })
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

export default router
