import { Router, Request, Response } from 'express'
import crypto from 'crypto'
import { ok, fail } from '../utils'
import { WechatCrypto } from '../utils/crypto'
import { channelsConfig } from '../config'
import { handleOrderPaid, resolveCourseId, resolveCourseIdFromProductInfos } from './wxshop'
import { sendChannelsCustomMessage } from '../services/channels-api'
import { StoreSourceScene } from '../services/wechat-store-fulfillment'
import { createAndDeliverPostPurchaseFulfillment } from '../services/wechat-store-auto-delivery'
import {
  getChannelsOrderDetail,
  getOrderProductInfos,
  pickAmountFromOrderDetail,
  pickBuyerOpenidFromOrderDetail,
  pickBuyerUnionidFromOrderDetail,
  pickPaidAtFromOrderDetail,
} from '../services/channels-api'

const router = Router()

const wechatCrypto = new WechatCrypto(channelsConfig.token, channelsConfig.encodingAESKey)

interface OfficialWxshopPaidEvent {
  orderId: string
  buyerOpenid: string
  payTime?: number
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

function extractSkuId(data: any): string {
  return String(data?.sku_id || data?.skuId || data?.out_sku_id || data?.outSkuId || '')
}

function getRawBody(req: Request): string {
  if (typeof req.body === 'string') return req.body
  if (req.body && typeof req.body === 'object') return JSON.stringify(req.body)
  return ''
}

export function parseWxshopJsonPreservingLargeIntegers(text: string): any {
  const normalized = text.replace(/(:\s*)(-?\d{16,})(?=\s*[,}\]])/g, '$1"$2"')
  return JSON.parse(normalized)
}

export function isOfficialWxshopMessagePushRequest(input: {
  query?: Record<string, any>
  headers?: Record<string, any>
}): boolean {
  const query = input.query || {}
  return Boolean(
    query.timestamp &&
    query.nonce &&
    query.msg_signature &&
    String(query.encrypt_type || '').toLowerCase() === 'aes'
  )
}

export function generateOfficialWxshopMessageSignature(
  token: string,
  timestamp: string,
  nonce: string,
  encrypt: string
): string {
  return crypto
    .createHash('sha1')
    .update([token, timestamp, nonce, encrypt].sort().join(''))
    .digest('hex')
}

export function extractOfficialWxshopPaidEvent(payload: any): OfficialWxshopPaidEvent | null {
  const event = payload?.Event || payload?.event || ''
  if (event !== 'channels_ec_order_pay') return null

  const orderInfo = payload.order_info || payload.orderInfo || {}
  const orderId = orderInfo.order_id || orderInfo.orderId || payload.order_id || payload.orderId
  if (!orderId) return null

  const rawPayTime = orderInfo.pay_time || orderInfo.payTime || payload.pay_time || payload.payTime
  const payTime = Number(rawPayTime)
  return {
    orderId: String(orderId),
    buyerOpenid: extractOpenid(payload) || extractOpenid(orderInfo),
    payTime: Number.isFinite(payTime) && payTime > 0 ? payTime : undefined,
  }
}

function pickPrimaryProductId(productInfos: Array<{ product_id?: string; out_product_id?: string }>): string {
  for (const productInfo of productInfos) {
    const productId = productInfo.product_id || productInfo.out_product_id
    if (productId && String(productId).trim()) return String(productId).trim()
  }
  return ''
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

async function fulfillPaidChannelsOrder(input: {
  orderId: string
  payload: any
  orderInfo: any
  fallbackOpenid?: string
  fallbackPayTime?: number
}) {
  const orderDetail = await getChannelsOrderDetail(input.orderId)
  const productInfos = getOrderProductInfos(orderDetail)
  const productId = pickPrimaryProductId(productInfos) || input.orderInfo.product_id || input.orderInfo.productId || ''
  const openid = pickBuyerOpenidFromOrderDetail(orderDetail) || input.fallbackOpenid || extractOpenid(input.orderInfo)
  const unionid = pickBuyerUnionidFromOrderDetail(orderDetail) || undefined
  const amount = pickAmountFromOrderDetail(orderDetail) || extractAmount(input.orderInfo)
  const paidAt = pickPaidAtFromOrderDetail(orderDetail) || (
    input.fallbackPayTime
      ? new Date(input.fallbackPayTime * 1000).toISOString().slice(0, 19).replace('T', ' ')
      : input.orderInfo.pay_time
        ? new Date(Number(input.orderInfo.pay_time) * 1000).toISOString().slice(0, 19).replace('T', ' ')
        : undefined
  )

  const courseId = productInfos.length > 0
    ? await resolveCourseIdFromProductInfos(productInfos)
    : await resolveCourseId(input.orderInfo)
  if (!courseId) {
    console.warn('[channels] 无法解析课程 ID，product_id=', productId, 'order_id=', input.orderId)
    return
  }

  const autoDelivery = await createAndDeliverPostPurchaseFulfillment({
    storeOrderId: input.orderId,
    courseId,
    sourceScene: resolveSourceScene(input.payload),
    storeProductId: productId ? String(productId) : undefined,
    storeSkuId: extractSkuId(productInfos[0] || input.orderInfo),
    storeProductInfos: productInfos,
    buyerOpenid: openid || undefined,
    buyerUnionid: unionid,
    paidAt,
    rawPayload: {
      eventPayload: input.payload,
      orderDetail,
    },
  })
  const fulfillment = autoDelivery.fulfillment
  console.log('[channels] 自动履约发货完成:', {
    orderId: input.orderId,
    delivered: autoDelivery.delivered,
    deliveryError: autoDelivery.deliveryError,
  })

  if (openid || unionid) {
    const result = await handleOrderPaid({
      orderNo: input.orderId,
      openid: openid || undefined,
      unionid,
      courseId,
      amount,
      paidAt,
    })
    console.log('[channels] 订单自动解锁完成:', input.orderId, 'userId=', result.userId, 'created=', result.created)
    await sendChannelsCustomMessage(openid, fulfillment.fulfillmentText).catch((err) => {
      console.warn('[channels] 客服消息推送失败（不影响主流程）:', err)
    })
  } else {
    console.log('[channels] 无 openid，已生成购后承接内容（需通过发货说明/短信/客服后台通知买家）:', {
      orderId: input.orderId,
      courseId,
      redeemCodeSuffix: fulfillment.redeemCode.slice(-4),
      urlLink: fulfillment.urlLink,
    })
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
      const rawBody = getRawBody(req)

      if (!rawBody) {
        return fail(res, 400, '请求体为空')
      }

      if (isOfficialWxshopMessagePushRequest({ query: req.query, headers: req.headers })) {
        if (!channelsConfig.token) {
          return fail(res, 500, '未配置 CHANNELS_TOKEN')
        }
        if (!channelsConfig.encodingAESKey) {
          return fail(res, 500, '未配置 CHANNELS_ENCODING_AES_KEY，无法解密')
        }

        let encryptedPayload: any
        try {
          encryptedPayload = JSON.parse(rawBody)
        } catch {
          return fail(res, 400, '请求体非合法 JSON')
        }

        const encryptStr = encryptedPayload.Encrypt || encryptedPayload.encrypt
        if (!encryptStr) {
          return fail(res, 400, '加密消息缺少 Encrypt 字段')
        }

        const expected = generateOfficialWxshopMessageSignature(
          channelsConfig.token,
          String(req.query.timestamp),
          String(req.query.nonce),
          String(encryptStr)
        )
        if (expected !== String(req.query.msg_signature)) {
          return fail(res, 401, '消息签名校验失败')
        }

        const { text, appid } = wechatCrypto.decrypt(String(encryptStr))
        if (channelsConfig.appId && appid !== channelsConfig.appId) {
          console.warn('[channels] 解密后微信小店 appid 不匹配:', appid, 'vs', channelsConfig.appId)
        }

        let payload: any
        try {
          payload = parseWxshopJsonPreservingLargeIntegers(text)
        } catch {
          return fail(res, 500, '解密后内容非合法 JSON')
        }

        const paidEvent = extractOfficialWxshopPaidEvent(payload)
        if (!paidEvent) {
          console.log('[channels] 非微信小店支付成功事件，跳过:', payload.Event || payload.event || '')
          return res.send('success')
        }

        await fulfillPaidChannelsOrder({
          orderId: paidEvent.orderId,
          payload,
          orderInfo: payload.order_info || payload.orderInfo || {},
          fallbackOpenid: paidEvent.buyerOpenid,
          fallbackPayTime: paidEvent.payTime,
        })

        return res.send('success')
      }

      const timestamp = req.headers['x-wx-timestamp'] as string
      const nonce = req.headers['x-wx-nonce'] as string
      const signature = req.headers['x-wx-signature'] as string

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
        payload = parseWxshopJsonPreservingLargeIntegers(rawBody)
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

        // 微信小店消息解密尾部 appid 是微信小店 AppID，不是课程小程序 AppID。
        if (channelsConfig.appId && appid !== channelsConfig.appId) {
          console.warn('[channels] 解密后微信小店 appid 不匹配:', appid, 'vs', channelsConfig.appId)
        }

        try {
          payload = parseWxshopJsonPreservingLargeIntegers(text)
        } catch {
          return fail(res, 500, '解密后内容非合法 JSON')
        }
      }

      // 2.3 提取事件类型
      const event = payload.Event || payload.event || ''
      const orderInfo = payload.order_info || payload.orderInfo || {}

      // 非目标事件直接返回 success，避免微信重试
      if (event !== 'channels_ec_order_pay_success' && event !== 'channels_ec_order_pay') {
        console.log('[channels] 非支付成功事件，跳过:', event)
        return res.send('success')
      }

      // 2.4 提取订单关键字段
      const orderId = orderInfo.order_id || orderInfo.orderId || payload.order_id
      if (!orderId) {
        console.warn('[channels] 订单事件缺少 order_id:', payload)
        return res.send('success')
      }

      await fulfillPaidChannelsOrder({
        orderId: String(orderId),
        payload,
        orderInfo,
        fallbackOpenid: extractOpenid(payload),
      })

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
