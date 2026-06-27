import { Router } from 'express'
import { pool } from '../../db'
import { ok, fail } from '../../utils'
import { authMiddleware } from '../../auth'

const router = Router()

function mapOrderRow(row: any) {
  return {
    id: row.id,
    orderNo: row.order_no,
    userId: row.user_id,
    userName: row.user_name ?? '',
    courseId: row.course_id,
    courseTitle: row.course_title ?? '',
    amount: Number(row.amount),
    originalAmount: row.original_amount != null ? Number(row.original_amount) : undefined,
    couponId: row.coupon_id,
    status: row.status,
    payMethod: row.pay_method,
    paidAt: row.paid_at,
    createdAt: row.created_at,
  }
}

/** GET /api/admin/orders */
router.get('/orders', authMiddleware, async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1)
    const size = Math.max(1, Number(req.query.size) || 20)
    const offset = (page - 1) * size
    const status = req.query.status

    let where = 'WHERE 1=1'
    const params: any[] = []

    if (status !== undefined && status !== '') {
      where += ' AND o.status = ?'
      params.push(Number(status))
    }

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM orders o ${where}`,
      params
    ) as any

    const [rows] = await pool.query(
      `SELECT o.*, u.name AS user_name, c.title AS course_title
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       LEFT JOIN courses c ON o.course_id = c.id
       ${where}
       ORDER BY o.id DESC
       LIMIT ? OFFSET ?`,
      [...params, size, offset]
    ) as any[]

    const list = (rows as any[]).map(mapOrderRow)
    return ok(res, { list, total: Number(total) })
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

/** GET /api/admin/orders/:id */
router.get('/orders/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const [rows] = await pool.query(
      `SELECT o.*, u.name AS user_name, c.title AS course_title
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       LEFT JOIN courses c ON o.course_id = c.id
       WHERE o.id = ?`,
      [id]
    ) as any[]
    const row = (rows as any[])[0]
    if (!row) return fail(res, 404, '订单不存在')
    return ok(res, mapOrderRow(row))
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

export default router
