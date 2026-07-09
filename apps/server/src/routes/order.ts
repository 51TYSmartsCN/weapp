import { Router, Request, Response } from 'express'
import { pool } from '../db'
import { ok, fail } from '../utils'
import { authMiddleware, AuthRequest } from '../auth'

const router = Router()

/** 将 orders JOIN courses 行转换为 camelCase */
function mapOrder(o: any) {
  return {
    id: o.id,
    orderNo: o.order_no,
    userId: o.user_id,
    courseId: o.course_id,
    courseTitle: o.course_title,
    amount: Number(o.amount),
    originalAmount:
      o.original_amount != null ? Number(o.original_amount) : undefined,
    couponId: o.coupon_id,
    status: o.status,
    source: o.source,
    payMethod: o.pay_method,
    paidAt: o.paid_at,
    createdAt: o.created_at,
  }
}

/** POST /api/orders - 创建订单（mock 已支付） */
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId!
    const { courseId, couponId } = req.body || {}
    if (!courseId || typeof courseId !== 'number') {
      return fail(res, 400, '参数错误')
    }

    // 查课程 price
    const [courseRows] = await pool.query(
      'SELECT price FROM courses WHERE id = ?',
      [courseId]
    )
    const courseList = courseRows as any[]
    if (courseList.length === 0) return fail(res, 404, '课程不存在')
    const price = Number(courseList[0].price)

    // 生成订单号
    const orderNo = `GEO${Date.now()}${Math.floor(Math.random() * 1000)}`

    // INSERT orders（status=1 已支付 mock，paid_at=NOW()）
    const [insertResult] = await pool.query(
      `INSERT INTO orders (order_no, user_id, course_id, amount, original_amount, coupon_id, status, paid_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, NOW())`,
      [orderNo, userId, courseId, price, price, couponId ?? null]
    )
    const orderId = (insertResult as any).insertId

    // 查课时数
    const [lessonCountRows] = await pool.query(
      'SELECT COUNT(*) AS cnt FROM lessons WHERE course_id = ?',
      [courseId]
    )
    const totalLessons = (lessonCountRows as any[])[0].cnt

    // INSERT IGNORE user_courses
    const [ucResult] = await pool.query(
      `INSERT IGNORE INTO user_courses (user_id, course_id, status, total_lessons, created_at, updated_at)
       VALUES (?, ?, 0, ?, NOW(), NOW())`,
      [userId, courseId, totalLessons]
    )
    // 若是新购（INSERT 成功），bought_courses + 1
    if ((ucResult as any).affectedRows > 0) {
      await pool.query(
        'UPDATE users SET bought_courses = bought_courses + 1 WHERE id = ?',
        [userId]
      )
    }

    // 返回新订单对象
    const [orderRows] = await pool.query(
      `SELECT o.*, c.title AS course_title
       FROM orders o
       JOIN courses c ON c.id = o.course_id
       WHERE o.id = ?`,
      [orderId]
    )
    const orderList = orderRows as any[]
    if (orderList.length === 0) return fail(res, 500, '订单创建失败')
    ok(res, mapOrder(orderList[0]))
  } catch (err) {
    console.error('[order] create error:', err)
    fail(res, 500, '创建订单失败')
  }
})

/** GET /api/orders - 当前用户订单列表 */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId!
    const [rows] = await pool.query(
      `SELECT o.*, c.title AS course_title
       FROM orders o
       JOIN courses c ON c.id = o.course_id
       WHERE o.user_id = ?
       ORDER BY o.created_at DESC`,
      [userId]
    )
    ok(res, (rows as any[]).map(mapOrder))
  } catch (err) {
    console.error('[order] list error:', err)
    fail(res, 500, '获取订单列表失败')
  }
})

/** GET /api/orders/:id - 单个订单 */
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId!
    const id = Number(req.params.id)
    if (!Number.isFinite(id)) return fail(res, 400, '参数错误')

    const [rows] = await pool.query(
      `SELECT o.*, c.title AS course_title
       FROM orders o
       JOIN courses c ON c.id = o.course_id
       WHERE o.id = ? AND o.user_id = ?`,
      [id, userId]
    )
    const list = rows as any[]
    if (list.length === 0) return fail(res, 404, '订单不存在')
    ok(res, mapOrder(list[0]))
  } catch (err) {
    console.error('[order] detail error:', err)
    fail(res, 500, '获取订单失败')
  }
})

export default router
