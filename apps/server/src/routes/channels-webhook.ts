import { Router, Request, Response } from 'express'
import crypto from 'crypto'
import { pool } from '../db'
import { ok, fail } from '../utils'
import { WechatCrypto } from '../utils/crypto'
import { channelsConfig, wechatConfig } from '../config'
import { handleOrderPaid, resolveCourseId } from './wxshop'
import { deliverVirtualOrder, sendChannelsCustomMessage } from '../services/channels-api'

const router = Router()

const wechatCrypto = new WechatCrypto(channelsConfig.token, channelsConfig.encodingAESKey)

/**
 * 生成兑换码（16 位大写字母+数字，去除易混淆字符）
 * 用于视频号小店下单后无法通过 openid 自动解锁的场景：生成兑换码供用户手动核销
 */
function generateRedeemCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  const bytes = crypto.randomBytes(16)
  for (let i = 0; i < 16; i++) {
    code += chars[bytes[i] % chars.length]
  }
  return code
}

/**
 * 为指定课程 + 订单生成一条兑换码记录
 * @returns 生成的兑换码明文
 */
async function createRedeemCode(courseId: number, orderNo: string): Promise<string> {
  // 重试避免极小概率的 unique 冲突
  for (let i = 0; i < 3; i++) {
    const code = generateRedeemCode()
    try {
      await pool.query(
        'INSERT INTO redeem_codes (code, course_id, order_no, status) VALUES (?, ?, ?, 0)',
        [code, courseId, orderNo]
      )
      return code
    } catch (err: any) {
      if (err.code === 'ER_DUP_ENTRY') continue
      throw err
    }
  }
  throw new Error('生成兑换码失败：多次重试仍冲突')
}

/**
 * 从订单事件中尽量提取购买者 openid
 * 视频号小店不同事件字段位置不一，这里做兼容性兜底
 */
function extractOpenid(data: any): string {
  if (!data) return ''
  const candidates = [
    data.openid,
    data.buyer_openid,
    data.buyerOpenid,
    data.from_user_name,
    data.FromUserName,
    data.user_openid,
  ]
  for (const c of candidates) {
    if (c && typeof c === 'string' && c.trim() !== '') return String(c).trim()
  }
  return ''
}

/**
 * 从订单事件提取金额（分 → 元）
 */
function extractAmount(data: any): number {
  const raw = data?.order_price ?? data?.pay_price ?? data?.amount ?? data?.total_fee
  if (raw == null) return 0
  // 视频号小店金额通常为分
  const num = Number(raw)
  if (Number.isNaN(num)) return 0
  return num > 100 ? num / 100 : num
}

/**
 * 安全调用发货接口（失败不影响主流程，订单已落库解锁，发货状态可在后台手动补单）
 */
async function safeDeliver(orderId: string): Promise<boolean> {
  try {
    const ok = await deliverVirtualOrder(orderId)
    console.log('[channels] 虚拟商品发货结果:', { orderId, ok })
    return ok
  } catch (err) {
    console.error('[channels] 虚拟商品发货失败（订单已解锁，可在后台手动补发）:', err)
    return false
  }
}

/**
 * 视频号小店 Webhook 入口
 *
 * 对应对接.md 中的 src/server/routes/webhook.ts
 * 路由前缀在 index.ts 中挂载到 /api/channels
 *
 * - GET  /api/channels/webhook：消息推送 URL 校验（返回 echostr）
 * - POST /api/channels/webhook：接收订单事件（HMAC-SHA256 验签 + AES 解密）
 *
 * 在视频号小店后台填写：https://你的域名/api/channels/webhook
 */
router.all('/webhook', async (req: Request, res: Response) => {
  const method = req.method.toUpperCase()

  try {
    if (method === 'GET') {
      // 1. GET 请求：消息推送验证
      const { signature, timestamp, nonce, echostr } = req.query
      if (!signature || !timestamp || !nonce || !echostr) {
        return fail(res, 400, '缺少参数: signature/timestamp/nonce/echostr')
      }

      if (!channelsConfig.mockMode) {
        if (!channelsConfig.token) {
          return fail(res, 500, '未配置 CHANNELS_TOKEN')
        }
        const valid = wechatCrypto.checkSignature(
          String(signature),
          String(timestamp),
          String(nonce)
        )
        if (!valid) {
          return fail(res, 403, '签名校验失败')
        }
      }

      res.setHeader('Content-Type', 'text/plain')
      return res.send(String(echostr))
    }

    if (method === 'POST') {
      // 2. POST 请求：接收订单事件
      const timestamp = req.headers['x-wx-timestamp'] as string
      const nonce = req.headers['x-wx-nonce'] as string
      const signature = req.headers['x-wx-signature'] as string

      // 获取原始 body（index.ts 中已用 express.text 挂载，req.body 为字符串）
      let rawBody = ''
      if (typeof req.body === 'string') {
        rawBody = req.body
      } else if (req.body && typeof req.body === 'object') {
        rawBody = JSON.stringify(req.body)
      }

      if (!rawBody) {
        return fail(res, 400, '请求体为空')
      }

      // 2.1 验证 POST 签名（HMAC-SHA256）
      if (!channelsConfig.mockMode) {
        if (!timestamp || !nonce || !signature) {
          return fail(res, 401, '缺少签名 headers: x-wx-timestamp/x-wx-nonce/x-wx-signature')
        }
        const expected = wechatCrypto.generatePostSignature(
          String(timestamp),
          String(nonce),
          rawBody
        )
        if (expected !== signature) {
          return fail(res, 401, '签名校验失败')
        }
      }

      // 2.2 解析请求体（可能是加密 JSON 或明文 JSON）
      let payload: any
      try {
        payload = JSON.parse(rawBody)
      } catch {
        return fail(res, 400, '请求体非合法 JSON')
      }

      // 加密消息体：{ encrypt: "..." }，需先 AES 解密
      const encryptStr = payload.encrypt || payload.Encrypt
      if (encryptStr) {
        if (!channelsConfig.encodingAESKey) {
          return fail(res, 500, '未配置 CHANNELS_ENCODING_AES_KEY，无法解密')
        }
        const { text, appid } = wechatCrypto.decrypt(encryptStr)

        // 校验 appid 一致性
        if (!channelsConfig.mockMode && wechatConfig.appid && appid !== wechatConfig.appid) {
          console.warn('[channels] 解密后 appid 不匹配:', appid, 'vs', wechatConfig.appid)
        }

        try {
          payload = JSON.parse(text)
        } catch {
          return fail(res, 500, '解密后内容非合法 JSON')
        }
      }

      // 2.3 提取事件类型
      const event = payload.Event || payload.event || ''
      const orderInfo = payload.order_info || payload.orderInfo || {}

      // 非目标事件直接返回 success，避免微信重试
      if (event !== 'channels_ec_order_pay_success') {
        console.log('[channels] 非支付成功事件，跳过:', event)
        return res.send('success')
      }

      // 2.4 提取订单关键字段
      const orderId = orderInfo.order_id || orderInfo.orderId || payload.order_id
      const productId = orderInfo.product_id || orderInfo.productId || ''
      const openid = extractOpenid(orderInfo)
      const amount = extractAmount(orderInfo)

      if (!orderId) {
        console.warn('[channels] 订单事件缺少 order_id:', payload)
        return res.send('success')
      }

      // 2.5 解析课程 ID（复用 wxshop_products 映射表）
      const courseId = await resolveCourseId(orderInfo)
      if (!courseId) {
        console.warn('[channels] 无法解析课程 ID，product_id=', productId, 'order_id=', orderId)
        return res.send('success')
      }

      // 2.6 解锁课程
      // 若能拿到 openid，复用微信小店 handleOrderPaid 自动解锁；
      // 否则生成兑换码，用户可凭码在小程序核销页手动兑换。
      //
      // 三种场景：
      //   A. 有 openid + 课程未购：handleOrderPaid 自动解锁 + 发货
      //   B. 有 openid + 课程已购（重复下单）：生成兑换码 + 客服消息推送 + 发货
      //   C. 无 openid：生成兑换码 + 发货（无法推送客服消息，需订单详情/短信等渠道通知）
      let needDeliver = false
      if (openid) {
        const result = await handleOrderPaid({
          orderNo: String(orderId),
          openid,
          courseId,
          amount,
          paidAt: orderInfo.pay_time
            ? new Date(Number(orderInfo.pay_time) * 1000).toISOString().slice(0, 19).replace('T', ' ')
            : undefined,
        })
        console.log('[channels] 订单自动解锁完成:', orderId, 'userId=', result.userId, 'created=', result.created)

        if (result.created) {
          // 场景 A：新建订单，直接发货
          needDeliver = true
        } else {
          // 场景 B：重复下单，生成兑换码作为补偿，并通过客服消息推送
          const code = await createRedeemCode(courseId, String(orderId))
          console.log('[channels] 课程已购，已生成兑换码作为补偿:', { orderId, courseId, code })
          const msg = `您的兑换码：${code}\n\n请打开 GEO 课程小程序 → 我的 → 兑换课程，输入兑换码即可解锁课程。`
          await sendChannelsCustomMessage(openid, msg).catch((err) => {
            console.warn('[channels] 客服消息推送失败（不影响主流程）:', err)
          })
          needDeliver = true
        }
      } else {
        // 场景 C：无 openid，仅生成兑换码，无法推送客服消息
        const code = await createRedeemCode(courseId, String(orderId))
        console.log('[channels] 无 openid，已生成兑换码（需通过订单详情/短信通知买家）:', { orderId, courseId, code })
        needDeliver = true
      }

      // 2.7 调用虚拟商品发货接口（deliver_type=3），标记订单已发货
      if (needDeliver) {
        await safeDeliver(String(orderId))
      }

      // 微信要求返回字符串 "success"
      return res.send('success')
    }

    // 非 GET/POST 请求
    return fail(res, 405, 'Method Not Allowed')
  } catch (err) {
    console.error('[channels] webhook 处理失败:', err)
    // 即使出错也返回 success，避免微信无限重试
    return res.send('success')
  }
})

export default router
