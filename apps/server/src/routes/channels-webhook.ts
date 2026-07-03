import { Router, Request, Response } from 'express'
import { ok, fail } from '../utils'
import { WechatCrypto } from '../utils/crypto'
import { channelsConfig, wechatConfig } from '../config'
import { handleOrderPaid, resolveCourseId } from './wxshop'
import { sendChannelsCustomMessage } from '../services/channels-api'
import { StoreSourceScene } from '../services/wechat-store-fulfillment'
import { createAndDeliverPostPurchaseFulfillment } from '../services/wechat-store-auto-delivery'

const router = Router()

const wechatCrypto = new WechatCrypto(channelsConfig.token, channelsConfig.encodingAESKey)

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

function extractSkuId(data: any): string {
  return String(data?.sku_id || data?.skuId || data?.out_sku_id || data?.outSkuId || '')
}

function resolveSourceScene(payload: any): StoreSourceScene {
  const raw = String(
    payload?.source_scene ||
    payload?.sourceScene ||
    payload?.scene ||
    payload?.order_info?.source_scene ||
    payload?.orderInfo?.sourceScene ||
    ''
  )
  if (raw.includes('live') || raw.includes('直播')) return 'channels_live'
  if (raw.includes('video') || raw.includes('短视频')) return 'channels_video'
  if (raw.includes('showcase') || raw.includes('橱窗')) return 'channels_showcase'
  return 'store'
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
      if (!channelsConfig.token) {
        return fail(res, 500, '未配置 CHANNELS_TOKEN')
      }
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
        if (wechatConfig.appid && appid !== wechatConfig.appid) {
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

      // 2.6 创建购后承接并自动发货：兑换码 + 小程序入口 + 小程序码 + delivery_note
      const autoDelivery = await createAndDeliverPostPurchaseFulfillment({
        storeOrderId: String(orderId),
        courseId,
        sourceScene: resolveSourceScene(payload),
        storeProductId: productId ? String(productId) : undefined,
        storeSkuId: extractSkuId(orderInfo),
        buyerOpenid: openid || undefined,
        paidAt: orderInfo.pay_time
          ? new Date(Number(orderInfo.pay_time) * 1000).toISOString().slice(0, 19).replace('T', ' ')
          : undefined,
        rawPayload: payload,
      })
      const fulfillment = autoDelivery.fulfillment
      console.log('[channels] 自动履约发货完成:', {
        orderId,
        delivered: autoDelivery.delivered,
        deliveryError: autoDelivery.deliveryError,
      })

      // 若能拿到 openid，仍保留旧的自动解锁体验；购后承接可作为兜底/跨端绑定入口。
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
        await sendChannelsCustomMessage(openid, fulfillment.fulfillmentText).catch((err) => {
          console.warn('[channels] 客服消息推送失败（不影响主流程）:', err)
        })
      } else {
        console.log('[channels] 无 openid，已生成购后承接内容（需通过发货说明/短信/客服后台通知买家）:', {
          orderId,
          courseId,
          redeemCodeSuffix: fulfillment.redeemCode.slice(-4),
          urlLink: fulfillment.urlLink,
        })
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
