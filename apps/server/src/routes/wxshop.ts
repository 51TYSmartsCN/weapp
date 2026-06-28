import { Router, Request, Response } from 'express'
import crypto from 'crypto'
import { pool } from '../db'
import { ok, fail } from '../utils'
import { wxshopConfig } from '../config'

const router = Router()

/**
 * 微信小店订单更新回调签名校验
 *
 * 微信小店会在请求头 X-WXShop-Signature 中携带 sha1(sort(token, timestamp, nonce, body))
 * 校验通过才允许落库,否则返回 401
 *
 * @param req Express Request
 * @returns true=签名合法 false=非法
 */
function verifySignature(req: Request): boolean {
  // mockMode 时不校验签名,仅本地联调用
  if (wxshopConfig.mockMode) return true

  const token = wxshopConfig.callbackToken
  const timestamp = req.headers['x-wxshop-timestamp'] as string | undefined
  const nonce = req.headers['x-wxshop-nonce'] as string | undefined
  const signature = req.headers['x-wxshop-signature'] as string | undefined

  if (!timestamp || !nonce || !signature) return false

  // body 需使用原始字符串,express.json() 已解析为对象,这里需重排为字符串
  // 注意:为确保与微信端签名一致,这里使用 raw body 字符串
  // 生产环境建议在 index.ts 中用 express.json({ verify }) 缓存 rawBody
  const bodyStr = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {})

  const arr = [token, timestamp, nonce, bodyStr].sort()
  const expected = crypto.createHash('sha1').update(arr.join('')).digest('hex')
  return expected === signature
}

/** 通过 openid 查找用户;不存在则创建(占位昵称,等待用户登录后完善资料) */
async function findOrCreateUserByOpenid(openid: string): Promise<number | null> {
  if (!openid) return null
  const [rows] = await pool.query('SELECT id FROM users WHERE openid = ?', [openid])
  const existing = (rows as any[])[0]
  if (existing) return existing.id

  await pool.query(
    'INSERT INTO users (openid, name, avatar, vip) VALUES (?, ?, ?, 0)',
    [openid, '微信用户', 'U']
  )
  const [r2] = await pool.query('SELECT id FROM users WHERE openid = ?', [openid])
  return (r2 as any[])[0]?.id ?? null
}

/**
 * 处理一笔订单回调
 * - 幂等:通过 order_no 唯一键保证重复回调不重复落库
 * - 状态映射:微信小店订单状态 → 我们 OrderStatus(这里只处理「已支付」)
 * - 授权:支付成功后 INSERT IGNORE user_courses,用户即可在小程序观看
 */
async function handleOrderPaid(payload: {
  orderNo: string
  openid: string
  courseId: number
  amount: number
  originalAmount?: number
  paidAt?: string
}): Promise<{ orderId: number; userId: number; created: boolean }> {
  const { orderNo, openid, courseId, amount, originalAmount, paidAt } = payload

  // 1. 关联用户
  const userId = await findOrCreateUserByOpenid(openid)
  if (userId == null) throw new Error('无法解析用户 openid')

  // 2. 幂等:先查订单是否已存在
  const [existRows] = await pool.query('SELECT id FROM orders WHERE order_no = ?', [orderNo])
  const existing = (existRows as any[])[0]
  if (existing) {
    return { orderId: existing.id, userId, created: false }
  }

  // 3. 落库订单(source=1 微信小店,status=1 已支付)
  const [insertResult] = await pool.query(
    `INSERT INTO orders (order_no, user_id, course_id, amount, original_amount, status, source, pay_method, paid_at)
     VALUES (?, ?, ?, ?, ?, 1, 1, 'wxshop', ?)`,
    [orderNo, userId, courseId, amount, originalAmount ?? null, paidAt ?? null]
  )
  const orderId = (insertResult as any).insertId

  // 4. 查课时数
  const [lessonCountRows] = await pool.query(
    'SELECT COUNT(*) AS cnt FROM lessons WHERE course_id = ?',
    [courseId]
  )
  const totalLessons = (lessonCountRows as any[])[0].cnt

  // 5. 授权:INSERT IGNORE user_courses(已存在则不重复插入,保证幂等)
  const [ucResult] = await pool.query(
    `INSERT IGNORE INTO user_courses (user_id, course_id, status, total_lessons, created_at, updated_at)
     VALUES (?, ?, 0, ?, NOW(), NOW())`,
    [userId, courseId, totalLessons]
  )
  if ((ucResult as any).affectedRows > 0) {
    await pool.query(
      'UPDATE users SET bought_courses = bought_courses + 1 WHERE id = ?',
      [userId]
    )
  }

  return { orderId, userId, created: true }
}

/**
 * GET /api/wxshop/order/callback
 * 微信小店首次配置回调地址时会用 GET 请求做 URL 校验
 * 这里直接返回 echostr 参数即可
 */
router.get('/order/callback', (req: Request, res: Response) => {
  const echostr = req.query.echostr
  if (!echostr) return fail(res, 400, '缺少 echostr')
  // 微信校验 URL 有效性时,返回 echostr 原值即可
  return res.send(echostr)
})

/**
 * POST /api/wxshop/order/callback
 * 微信小店订单更新回调(下单/支付/退款等)
 *
 * body 结构(关键字段):
 * {
 *   "order_no": "wxshop_xxx",      // 微信小店订单号
 *   "buyer_openid": "oXXXX",        // 买家在小程序内的 openid
 *   "out_product_id": "course_3",   // 商品对应我们课程的标识
 *   "amount": 19900,                // 实付金额(分)
 *   "status": "paid",               // 订单状态
 *   "paid_at": 1719600000           // 支付时间戳(秒)
 * }
 *
 * 注意:不同接入方式字段略有差异,以微信小店文档为准
 */
router.post('/order/callback', async (req: Request, res: Response) => {
  try {
    // 1. 签名校验
    if (!verifySignature(req)) {
      return fail(res, 401, '签名校验失败')
    }

    const body = req.body || {}
    const orderNo = body.order_no || body.orderNo
    const openid = body.buyer_openid || body.buyerOpenid || body.openid
    // 课程 ID 可能通过 out_product_id(格式 "course_<id>")或单独字段传入
    const courseIdRaw = body.course_id ?? body.out_product_id ?? body.productId
    const status = body.status || body.order_status

    if (!orderNo || !openid || !courseIdRaw) {
      return fail(res, 400, '缺少必要字段:order_no/buyer_openid/course_id')
    }

    // 解析 courseId
    let courseId: number
    if (typeof courseIdRaw === 'number') {
      courseId = courseIdRaw
    } else if (typeof courseIdRaw === 'string') {
      // 兼容 "course_3" 这种格式
      const match = courseIdRaw.match(/(\d+)$/)
      courseId = match ? Number(match[1]) : Number(courseIdRaw)
    } else {
      return fail(res, 400, 'course_id 格式错误')
    }
    if (!Number.isFinite(courseId) || courseId <= 0) {
      return fail(res, 400, 'course_id 无效')
    }

    // 2. 仅处理「已支付」状态,其他状态先确认收到(避免微信重试)
    if (status && !['paid', 'PAID', 1, '1'].includes(status as any)) {
      // 非 paid 状态也回 200,微信不会重试
      return ok(res, { ignored: true, status })
    }

    // 3. 金额转换:微信小店金额单位是「分」,数据库存「元」
    const amountYuan =
      typeof body.amount === 'number' && body.amount > 100
        ? Number((body.amount / 100).toFixed(2))
        : Number(body.amount ?? 0)

    const originalAmountYuan =
      typeof body.original_amount === 'number' && body.original_amount > 100
        ? Number((body.original_amount / 100).toFixed(2))
        : body.original_amount != null
        ? Number(body.original_amount)
        : undefined

    const paidAt = body.paid_at
      ? new Date(
          typeof body.paid_at === 'number'
            ? body.paid_at * 1000
            : body.paid_at
        ).toISOString().slice(0, 19).replace('T', ' ')
      : null

    // 4. 落库 + 授权
    const result = await handleOrderPaid({
      orderNo: String(orderNo),
      openid: String(openid),
      courseId,
      amount: amountYuan,
      originalAmount: originalAmountYuan,
      paidAt: paidAt ?? undefined,
    })

    return ok(res, {
      orderId: result.orderId,
      userId: result.userId,
      created: result.created,
      message: result.created ? '订单已授权' : '订单已存在,跳过',
    })
  } catch (err) {
    console.error('[wxshop] order callback error:', err)
    return fail(res, 500, err instanceof Error ? err.message : '回调处理失败')
  }
})

/**
 * POST /api/wxshop/order/mock
 * 开发环境模拟下单(无签名校验),方便本地联调
 * body: { openid: string, courseId: number, amount?: number }
 */
router.post('/order/mock', async (req: Request, res: Response) => {
  if (!wxshopConfig.mockMode) {
    return fail(res, 403, 'mock 接口仅在 mockMode 下可用')
  }
  try {
    const { openid, courseId, amount } = req.body || {}
    if (!openid || !courseId) {
      return fail(res, 400, '缺少 openid 或 courseId')
    }

    // 查课程价格
    const [courseRows] = await pool.query('SELECT price FROM courses WHERE id = ?', [courseId])
    const courseList = courseRows as any[]
    if (courseList.length === 0) return fail(res, 404, '课程不存在')

    const orderNo = `WXSHOP_MOCK_${Date.now()}_${Math.floor(Math.random() * 1000)}`
    const result = await handleOrderPaid({
      orderNo,
      openid: String(openid),
      courseId: Number(courseId),
      amount: Number(amount ?? courseList[0].price),
    })

    return ok(res, { orderNo, ...result })
  } catch (err) {
    console.error('[wxshop] mock order error:', err)
    return fail(res, 500, err instanceof Error ? err.message : 'mock 下单失败')
  }
})

export default router
