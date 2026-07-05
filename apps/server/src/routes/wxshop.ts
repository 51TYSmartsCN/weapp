import { Router, Request, Response } from 'express'
import crypto from 'crypto'
import { pool } from '../db'
import { ok, fail } from '../utils'
import { wxshopConfig, wechatConfig, baseUrl } from '../config'
import { createAndDeliverPostPurchaseFulfillment } from '../services/wechat-store-auto-delivery'

const router = Router()
const DEFAULT_AVATAR_URL = `${baseUrl}/images/avatars/default.png`

// ============================================================
// 加解密工具(小程序消息推送 WXBizMsgCrypt 标准实现
// ============================================================

/**
 * 计算消息签名:sha1(sort(token, timestamp, nonce, encrypt))
 * 兼容模式和安全模式通用
 */
function calcSignature(token: string, timestamp: string, nonce: string, encrypt: string): string {
  const arr = [token, timestamp, nonce, encrypt].sort()
  return crypto.createHash('sha1').update(arr.join('')).digest('hex')
}

/**
 * AES-256-CBC 解密
 * 密钥=EncodingAESKey的base64解码 (32字节)
 * IV=密钥的前16字节
 * 明文结构: 16字节随机串 + 4字节msg_len(大端) + msg + appid
 */
function decryptMsg(encodingAESKey: string, encryptBase64: string): { text: string; appid: string } {
  const key = Buffer.from(encodingAESKey + '=', 'base64')
  const iv = key.slice(0, 16)
  const encrypted = Buffer.from(encryptBase64, 'base64')
  const decipher = crypto.createDecipheriv('aes-256-cbc', key as any, iv as any)
  decipher.setAutoPadding(false)
  let decrypted = Buffer.concat([decipher.update(encrypted as any) as any, decipher.final() as any])

  const padLen = decrypted[decrypted.length - 1]
  if (padLen >= 1 && padLen <= 32) {
    decrypted = decrypted.slice(0, decrypted.length - padLen)
  }

  const msgLen = decrypted.readUInt32BE(16)
  const msg = decrypted.slice(20, 20 + msgLen).toString('utf8')
  const appid = decrypted.slice(20 + msgLen).toString('utf8')
  return { text: msg, appid }
}

/**
 * 解析 XML 消息体(简单解析,仅提取 ToUserName/FromUserName/Event/Encrypt 等)
 */
function parseXml(xml: string): Record<string, string> {
  const result: Record<string, string> = {}
  const regex = /<(\w+)><!\[CDATA\[([^\]]*)\]\]><\/\w+>|<(\w+)>([^<]*?)<\/\w+>/g
  let m: RegExpExecArray | null
  while ((m = regex.exec(xml)) !== null) {
    if (m[1]) {
      result[m[1]] = m[2]
    } else if (m[3]) {
      result[m[3]] = m[4]
    }
  }
  return result
}

// ============================================================
// 业务逻辑
// ============================================================

export async function findOrCreateUserByOpenid(openid: string): Promise<number | null> {
  if (!openid) return null
  const [rows] = await pool.query('SELECT id FROM users WHERE openid = ?', [openid])
  const existing = (rows as any[])[0]
  if (existing) return existing.id

  await pool.query(
    'INSERT INTO users (openid, name, avatar, vip) VALUES (?, ?, ?, 0)',
    [openid, '微信用户', DEFAULT_AVATAR_URL]
  )
  const [r2] = await pool.query('SELECT id FROM users WHERE openid = ?', [openid])
  return (r2 as any[])[0]?.id ?? null
}

export async function handleOrderPaid(payload: {
  orderNo: string
  openid: string
  courseId: number
  amount: number
  originalAmount?: number
  paidAt?: string
}): Promise<{ orderId: number; userId: number; created: boolean }> {
  const { orderNo, openid, courseId, amount, originalAmount, paidAt } = payload

  const userId = await findOrCreateUserByOpenid(openid)
  if (userId == null) throw new Error('无法解析用户 openid')

  const [existRows] = await pool.query('SELECT id FROM orders WHERE order_no = ?', [orderNo])
  const existing = (existRows as any[])[0]
  if (existing) {
    return { orderId: existing.id, userId, created: false }
  }

  const [insertResult] = await pool.query(
    `INSERT INTO orders (order_no, user_id, course_id, amount, original_amount, status, source, pay_method, paid_at)
     VALUES (?, ?, ?, ?, ?, 1, 1, 'wxshop', ?)`,
    [orderNo, userId, courseId, amount, originalAmount ?? null, paidAt ?? null]
  )
  const orderId = (insertResult as any).insertId

  const [lessonCountRows] = await pool.query(
    'SELECT COUNT(*) AS cnt FROM lessons WHERE course_id = ?',
    [courseId]
  )
  const totalLessons = (lessonCountRows as any[])[0].cnt

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
 * 从订单事件数据中提取商品 ID（用于查映射表）
 */
function extractProductId(data: any): string | null {
  if (!data) return null
  const candidates = [
    data.product_id,
    data.productId,
    data.out_product_id,
    data.outProductId,
    data.sku_id,
    data.skuId,
  ]
  for (const c of candidates) {
    if (c != null && String(c).trim() !== '') return String(c)
  }
  return null
}

async function resolveCourseIdByProductId(productId: string): Promise<number | null> {
  try {
    const [rows] = await pool.query(
      'SELECT course_id FROM wxshop_products WHERE product_id = ? AND status = 1 LIMIT 1',
      [productId]
    ) as any
    const row = (rows as any[])[0]
    if (row?.course_id) {
      return Number(row.course_id)
    }
  } catch (err) {
    console.warn('[wxshop] 查 wxshop_products 映射表失败:', err)
  }
  return null
}

export async function resolveCourseIdFromProductInfos(
  productInfos: any[],
  lookupCourseId: (productId: string) => Promise<number | null> = resolveCourseIdByProductId
): Promise<number | null> {
  for (const productInfo of productInfos) {
    const productId = extractProductId(productInfo)
    if (!productId) continue

    const courseId = await lookupCourseId(productId)
    if (courseId) return courseId
  }

  return null
}

/**
 * 通过商品 ID 查映射表获取课程 ID
 */
export async function resolveCourseId(data: any): Promise<number | null> {
  if (Array.isArray(data?.product_infos) && data.product_infos.length > 0) {
    const courseId = await resolveCourseIdFromProductInfos(data.product_infos)
    if (courseId) return courseId
  }

  const productId = extractProductId(data)
  if (!productId) return null

  return resolveCourseIdByProductId(productId)
}

function extractSkuId(data: any): string {
  return String(data?.sku_id || data?.skuId || data?.out_sku_id || data?.outSkuId || '')
}

// ============================================================
// 路由
// ============================================================

/**
 * GET /api/wxshop/order/callback
 * 小程序消息推送 URL 校验
 * query: signature, timestamp, nonce, echostr
 */
router.get('/order/callback', (req: Request, res: Response) => {
  const { signature, timestamp, nonce, echostr } = req.query

  if (!signature || !timestamp || !nonce || !echostr) {
    return fail(res, 400, '缺少参数:signature/timestamp/nonce/echostr')
  }

  // URL 校验时签名是 sha1(sort(token, timestamp, nonce)),不包含加密消息
  if (!wxshopConfig.callbackToken) {
    return fail(res, 500, '未配置 WXSHOP_CALLBACK_TOKEN')
  }
  const arr = [wxshopConfig.callbackToken, String(timestamp), String(nonce)].sort()
  const expected = crypto.createHash('sha1').update(arr.join('')).digest('hex')
  if (expected !== signature) {
    return fail(res, 403, '签名校验失败')
  }

  return res.send(String(echostr))
})

/**
 * POST /api/wxshop/order/callback
 * 小程序消息推送 — 微信小店订单通知
 *
 * query: signature, timestamp, nonce, msg_signature(兼容/安全模式)
 * body: XML 或 JSON
 *
 * 事件: related_shop_order_submission / cooperation_shop_order
 */
router.post('/order/callback', async (req: Request, res: Response) => {
  try {
    const { signature, timestamp, nonce, msg_signature, encrypt_type } = req.query

    // 1. 获取原始消息体
    let rawBody = ''
    if (typeof req.body === 'string') {
      rawBody = req.body
    } else if (req.body && typeof req.body === 'object') {
      rawBody = JSON.stringify(req.body)
    }

    if (!rawBody) {
      return fail(res, 400, '请求体为空')
    }

    // 2. 解析消息(支持 XML 和 JSON 两种格式)
    let msgObj: Record<string, any> = {}
    const isXml = rawBody.trim().startsWith('<')
    if (isXml) {
      msgObj = parseXml(rawBody)
    } else {
      try {
        msgObj = JSON.parse(rawBody)
      } catch {
        msgObj = req.body || {}
      }
    }

    // 3. 判断加密模式 & 解密
    const encType = String(encrypt_type || msgObj.Encrypt ? 'aes' : 'plain')
    const isEncrypted = encType === 'aes' || !!msgObj.Encrypt

    if (isEncrypted) {
      // 密文模式:需先校验 MsgSignature,再 AES 解密
      const encryptStr = msgObj.Encrypt || msgObj.encrypt
      if (!encryptStr) {
        return fail(res, 400, '加密消息缺少 Encrypt 字段')
      }

      if (!wxshopConfig.callbackToken) {
        return fail(res, 500, '未配置 WXSHOP_CALLBACK_TOKEN')
      }
      const msgSig = msg_signature || msgObj.MsgSignature || msgObj.msgSignature
      if (!msgSig) {
        return fail(res, 400, '缺少 msg_signature')
      }
      const expected = calcSignature(
        wxshopConfig.callbackToken,
        String(timestamp || ''),
        String(nonce || ''),
        encryptStr
      )
      if (expected !== msgSig) {
        return fail(res, 403, '消息签名校验失败')
      }

      // 解密
      if (!wxshopConfig.encodingAESKey) {
        return fail(res, 500, '未配置 EncodingAESKey,无法解密')
      }
      const { text, appid } = decryptMsg(wxshopConfig.encodingAESKey, encryptStr)

      // 校验 appid 一致性
      if (appid !== wechatConfig.appid) {
        console.warn('[wxshop] 解密后 appid 不匹配:', appid, 'vs', wechatConfig.appid)
      }

      // 解密后内容可能是 XML 或 JSON
      if (text.trim().startsWith('<')) {
        msgObj = parseXml(text)
      } else {
        msgObj = JSON.parse(text)
      }
    } else {
      // 明文模式:校验 signature = sha1(sort(token, timestamp, nonce))
      if (!wxshopConfig.callbackToken) {
        return fail(res, 500, '未配置 WXSHOP_CALLBACK_TOKEN')
      }
      const arr = [wxshopConfig.callbackToken, String(timestamp || ''), String(nonce || '')].sort()
      const expected = crypto.createHash('sha1').update(arr.join('')).digest('hex')
      if (expected !== signature) {
        return fail(res, 403, '签名校验失败')
      }
    }

    // 4. 提取事件类型
    const event = msgObj.Event || msgObj.event || ''
    const fromUser = msgObj.FromUserName || msgObj.fromUserName || msgObj.openid || ''

    // 非订单事件直接返回 success,避免微信重试
    if (
      event !== 'related_shop_order_submission' &&
      event !== 'cooperation_shop_order' &&
      event !== 'user_enter_tempsession'
    ) {
      // 非订单事件,先回 success 避免重试
      return res.send('success')
    }

    // 5. 解析订单数据
    const data = msgObj.Data || msgObj.data || {}
    const orderId = data.order_id || data.orderId || msgObj.order_id || msgObj.orderId
    const shopAppid = data.shop_appid || data.shopAppid || ''

    if (!orderId || !fromUser) {
      // 字段不全,但仍回 success 避免重试
      console.warn('[wxshop] 订单通知缺少关键字段:', { orderId, fromUser })
      return res.send('success')
    }

    // 6. 提取课程 ID（优先查映射表，查不到再回退解析）
    const courseId = await resolveCourseId(data)
    if (!courseId) {
      console.warn('[wxshop] 无法从订单数据提取课程 ID:', data)
      return res.send('success')
    }

    // 7. 落库 + 授权
    const result = await handleOrderPaid({
      orderNo: String(orderId),
      openid: String(fromUser),
      courseId,
      amount: Number(data.amount || data.pay_price || 0) / 100 || 0,
      paidAt: data.create_time ? new Date(Number(data.create_time) * 1000).toISOString().slice(0, 19).replace('T', ' ') : undefined,
    })

    console.log('[wxshop] 订单处理完成: orderId=', orderId, 'userId=', result.userId, 'created=', result.created)

    const autoDelivery = await createAndDeliverPostPurchaseFulfillment({
      storeOrderId: String(orderId),
      courseId,
      sourceScene: 'miniapp',
      storeProductId: extractProductId(data) || undefined,
      storeSkuId: extractSkuId(data),
      buyerOpenid: String(fromUser),
      paidAt: data.create_time ? new Date(Number(data.create_time) * 1000).toISOString().slice(0, 19).replace('T', ' ') : undefined,
      rawPayload: msgObj,
    })
    console.log('[wxshop] 自动履约发货完成:', {
      orderId,
      delivered: autoDelivery.delivered,
      deliveryError: autoDelivery.deliveryError,
    })

    // 微信要求返回字符串 "success"
    return res.send('success')
  } catch (err) {
    console.error('[wxshop] order callback error:', err)
    // 即使出错也返回 success,避免微信无限重试
    return res.send('success')
  }
})

/**
 * GET /api/wxshop/product
 * 根据课程ID获取微信小店商品信息（无需登录）
 * query: courseId
 */
router.get('/product', async (req: Request, res: Response) => {
  try {
    const courseId = Number(req.query.courseId)
    if (!courseId) {
      return fail(res, 400, '缺少 courseId 参数')
    }

    const [rows] = await pool.query(
      'SELECT product_id, product_title, course_id, course_title FROM wxshop_products WHERE course_id = ? AND status = 1 LIMIT 1',
      [courseId]
    ) as any

    const row = (rows as any[])[0]
    if (!row) {
      return ok(res, null)
    }

    return ok(res, {
      productId: row.product_id,
      productTitle: row.product_title,
      courseId: row.course_id,
      courseTitle: row.course_title,
    })
  } catch (err) {
    console.error('[wxshop] get product error:', err)
    return fail(res, 500, '服务器错误')
  }
})

/**
 * GET /api/wxshop/config
 * 获取微信小店配置（appid等，无需登录）
 */
router.get('/config', async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(
      'SELECT value FROM app_configs WHERE `key` = ?',
      ['wxshop_config']
    ) as any

    const row = (rows as any[])[0]
    if (!row) {
      return ok(res, {
        appid: '',
        shopName: '微信小店',
        productPath: '/pages/product/detail/index',
      })
    }

    const config = JSON.parse(row.value)
    return ok(res, {
      appid: config.appid || '',
      shopName: config.shopName || '微信小店',
      productPath: config.productPath || '/pages/product/detail/index',
    })
  } catch (err) {
    console.error('[wxshop] get config error:', err)
    return fail(res, 500, '服务器错误')
  }
})

export default router
