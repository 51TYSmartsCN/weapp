import { channelsConfig, wechatConfig } from '../config'

/**
 * 微信小店（原视频号小店）开放 API 封装
 *
 * 接入流程：
 *   1. 微信小店商家后台(store.weixin.qq.com) → 店铺管理 → 开发配置 → 接口凭证
 *      获取 AppID / AppSecret，并配置 IP 白名单（服务器公网 IP）
 *   2. 通过 stable_token 接口换取 access_token（带内存缓存，避免频繁刷新）
 *   3. 用 access_token 调用发货、客服消息等接口
 *
 * API 域名：https://api.weixin.qq.com（路径前缀 /channels/ec/... 为历史沿用）
 */

const API_BASE = 'https://api.weixin.qq.com'

// access_token 内存缓存（进程级），提前 5 分钟刷新
let cachedAccessToken: { token: string; expiresAt: number } | null = null
const TOKEN_REFRESH_LEAD_MS = 5 * 60 * 1000

interface WxApiBaseResp {
  errcode?: number
  errmsg?: string
}

export interface ChannelsOrderProductInfo {
  product_id?: string
  sku_id?: string
  product_cnt?: number
  sku_cnt?: number
  real_price?: number | string
  out_product_id?: string
  out_sku_id?: string
  title?: string
}

export interface ChannelsOrderDetail {
  order_id?: string
  openid?: string
  unionid?: string
  pay_time?: number | string
  order_price?: number | string
  pay_price?: number | string
  product_infos?: ChannelsOrderProductInfo[]
  order_detail?: {
    product_infos?: ChannelsOrderProductInfo[]
  }
}

export interface BuildCourseDeliveryRequestInput {
  orderId: string
  productInfos: ChannelsOrderProductInfo[]
  miniappAppId: string
  miniappPath: string
}

export interface DeliverVirtualOrderInput {
  orderId: string
  productInfos: ChannelsOrderProductInfo[]
  miniappPath: string
}

function normalizeMiniappPath(path: string): string {
  return path.replace(/^\//, '')
}

function normalizeProductInfo(productInfo: ChannelsOrderProductInfo): ChannelsOrderProductInfo {
  const normalized: ChannelsOrderProductInfo = {}
  if (productInfo.product_id) normalized.product_id = String(productInfo.product_id)
  if (productInfo.sku_id) normalized.sku_id = String(productInfo.sku_id)
  const count = Number(productInfo.product_cnt ?? productInfo.sku_cnt ?? 0)
  if (Number.isFinite(count) && count > 0) normalized.product_cnt = count
  if (productInfo.sku_cnt != null) normalized.sku_cnt = Number(productInfo.sku_cnt)
  if (productInfo.real_price != null) normalized.real_price = productInfo.real_price
  if (productInfo.out_product_id) normalized.out_product_id = String(productInfo.out_product_id)
  if (productInfo.out_sku_id) normalized.out_sku_id = String(productInfo.out_sku_id)
  if (productInfo.title) normalized.title = String(productInfo.title)
  return normalized
}

function toDeliveryProductInfo(productInfo: ChannelsOrderProductInfo): {
  product_id: string
  sku_id: string
  product_cnt: number
} | null {
  const productId = productInfo.product_id ? String(productInfo.product_id).trim() : ''
  const skuId = productInfo.sku_id ? String(productInfo.sku_id).trim() : ''
  if (!productId || !skuId) return null

  const productCount = Number(productInfo.product_cnt ?? productInfo.sku_cnt ?? 1)
  return {
    product_id: productId,
    sku_id: skuId,
    product_cnt: Number.isFinite(productCount) && productCount > 0 ? productCount : 1,
  }
}

export function getOrderProductInfos(order: ChannelsOrderDetail | null | undefined): ChannelsOrderProductInfo[] {
  if (!order) return []
  const productInfos = Array.isArray(order.order_detail?.product_infos)
    ? order.order_detail?.product_infos
    : Array.isArray(order.product_infos)
      ? order.product_infos
      : []

  return productInfos
    .map(normalizeProductInfo)
    .filter((productInfo) => Boolean(
      productInfo.product_id ||
      productInfo.out_product_id ||
      productInfo.sku_id ||
      productInfo.out_sku_id ||
      productInfo.product_cnt ||
      productInfo.sku_cnt ||
      productInfo.real_price ||
      productInfo.title
    ))
}

export function pickBuyerOpenidFromOrderDetail(order: ChannelsOrderDetail | null | undefined): string {
  if (!order?.openid) return ''
  return String(order.openid).trim()
}

export function pickBuyerUnionidFromOrderDetail(order: ChannelsOrderDetail | null | undefined): string {
  if (!order?.unionid) return ''
  return String(order.unionid).trim()
}

function formatUnixTimestampToMysql(value: number | string): string {
  const timestamp = Number(value)
  if (!Number.isFinite(timestamp) || timestamp <= 0) return ''
  return new Date(timestamp * 1000).toISOString().slice(0, 19).replace('T', ' ')
}

export function pickPaidAtFromOrderDetail(order: ChannelsOrderDetail | null | undefined): string {
  if (!order?.pay_time) return ''
  return formatUnixTimestampToMysql(order.pay_time)
}

export function pickAmountFromOrderDetail(order: ChannelsOrderDetail | null | undefined): number {
  const rawAmount = order?.order_price ?? order?.pay_price
  if (rawAmount != null) {
    const amount = Number(rawAmount)
    if (!Number.isFinite(amount) || amount <= 0) return 0
    return amount > 100 ? amount / 100 : amount
  }

  const productInfos = getOrderProductInfos(order)
  const amount = productInfos.reduce((sum, productInfo) => {
    const realPrice = Number(productInfo.real_price)
    return Number.isFinite(realPrice) && realPrice > 0 ? sum + realPrice : sum
  }, 0)
  if (!Number.isFinite(amount) || amount <= 0) return 0
  return amount > 100 ? amount / 100 : amount
}

export function buildCourseDeliveryRequest(input: BuildCourseDeliveryRequestInput) {
  if (!input.orderId.trim()) {
    throw new Error('[channels] 发货缺少 orderId')
  }
  if (!input.miniappAppId.trim()) {
    throw new Error('[channels] 发货缺少小程序 appid')
  }

  const productInfos = input.productInfos
    .map(normalizeProductInfo)
    .map(toDeliveryProductInfo)
    .filter((productInfo): productInfo is NonNullable<typeof productInfo> => productInfo != null)

  if (productInfos.length === 0) {
    throw new Error(`[channels] 订单 ${input.orderId} 缺少有效 product_id/sku_id/product_cnt，无法发起课程发货`)
  }

  return {
    order_id: input.orderId,
    delivery_list: [
      {
        deliver_type: 3,
        product_infos: productInfos,
        course_info: {
          course_path: {
            type: 0,
            wxa_appid: input.miniappAppId,
            wxa_path: normalizeMiniappPath(input.miniappPath),
          },
        },
      },
    ],
  }
}

/**
 * 获取 access_token（带内存缓存，使用 stable_token 接口）
 *
 * stable_token 与普通 token 的区别：
 * - 普通 token：每次获取都会使上一份失效，多端共用时互相挤掉
 * - stable_token：force_update=false 时不强制刷新，多端共存更稳；force_update=true 用于本地 token 失效兜底
 *
 * @param forceUpdate 是否强制刷新（用于上游报 40001 token 失效时重试）
 */
export async function getChannelsAccessToken(forceUpdate = false): Promise<string> {
  // 缓存命中且未到期
  if (!forceUpdate && cachedAccessToken && Date.now() < cachedAccessToken.expiresAt) {
    return cachedAccessToken.token
  }

  if (!channelsConfig.appId || !channelsConfig.appSecret) {
    throw new Error('[channels] 未配置 CHANNELS_APP_ID / CHANNELS_APP_SECRET，无法获取 access_token')
  }

  const url = `${API_BASE}/cgi-bin/stable_token`
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credential',
      appid: channelsConfig.appId,
      secret: channelsConfig.appSecret,
      force_update: forceUpdate,
    }),
  })
  const data = (await resp.json()) as { access_token?: string; expires_in?: number } & WxApiBaseResp

  if (!data.access_token) {
    throw new Error(`[channels] 获取 access_token 失败: errcode=${data.errcode} errmsg=${data.errmsg}`)
  }

  cachedAccessToken = {
    token: data.access_token,
    // expires_in 通常为 7200 秒，提前 5 分钟刷新
    expiresAt: Date.now() + (data.expires_in ?? 7200) * 1000 - TOKEN_REFRESH_LEAD_MS,
  }
  return cachedAccessToken.token
}

/**
 * 本地缓存的 access_token 失效（收到 40001 等错误码时调用，便于上游重试）
 */
export function invalidateChannelsAccessToken(): void {
  cachedAccessToken = null
}

/**
 * 确认发货并写入发货说明。
 *
 * 接口：POST /order/confirm_delivery
 * 字段：delivery_note（买家订单详情页可见）
 */
export async function confirmDeliveryWithNote(orderId: string, deliveryNote: string): Promise<boolean> {
  if (!channelsConfig.appId) {
    throw new Error('[channels] 未配置 CHANNELS_APP_ID，无法确认发货')
  }

  return callChannelsApiWithRetry(async (token) => {
    const url = `${API_BASE}${channelsConfig.confirmDeliveryPath}?access_token=${token}`
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: orderId,
        delivery_note: deliveryNote,
      }),
    })
    const data = (await resp.json()) as WxApiBaseResp
    if (data.errcode && data.errcode !== 0) {
      throw Object.assign(new Error(`确认发货失败: errcode=${data.errcode} errmsg=${data.errmsg}`), {
        errcode: data.errcode,
      })
    }
    return true
  })
}

export async function getChannelsOrderDetail(orderId: string): Promise<ChannelsOrderDetail> {
  if (!orderId.trim()) {
    throw new Error('[channels] 查询订单详情缺少 orderId')
  }

  return callChannelsApiWithRetry(async (token) => {
    const url = `${API_BASE}/channels/ec/order/get?access_token=${token}`
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: orderId,
      }),
    })
    const data = (await resp.json()) as { order?: ChannelsOrderDetail } & WxApiBaseResp
    if (data.errcode && data.errcode !== 0) {
      throw Object.assign(new Error(`查询订单详情失败: errcode=${data.errcode} errmsg=${data.errmsg}`), {
        errcode: data.errcode,
      })
    }
    if (!data.order) {
      throw new Error(`[channels] 查询订单详情失败：订单 ${orderId} 未返回 order`)
    }
    return data.order
  })
}

/**
 * 课程类虚拟商品发货。
 *
 * 主流程使用微信小店官方 delivery/send 接口，并携带课程商品明细与小程序课程路径。
 * @returns 是否发货成功
 */
export async function deliverVirtualOrder(input: DeliverVirtualOrderInput): Promise<boolean> {
  if (!channelsConfig.appId) {
    throw new Error('[channels] 未配置 CHANNELS_APP_ID，无法发货')
  }
  if (!wechatConfig.appid) {
    throw new Error('[channels] 未配置 WECHAT_APPID，无法生成课程跳转路径')
  }

  const requestBody = buildCourseDeliveryRequest({
    orderId: input.orderId,
    productInfos: input.productInfos,
    miniappAppId: wechatConfig.appid,
    miniappPath: input.miniappPath,
  })

  return callChannelsApiWithRetry(async (token) => {
    const url = `${API_BASE}/channels/ec/order/delivery/send?access_token=${token}`
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    })
    const data = (await resp.json()) as WxApiBaseResp
    if (data.errcode && data.errcode !== 0) {
      throw Object.assign(new Error(`发货失败: errcode=${data.errcode} errmsg=${data.errmsg}`), {
        errcode: data.errcode,
      })
    }
    return true
  })
}

/**
 * 发送客服文本消息（携带兑换码给买家）
 *
 * 接口：POST /cgi-bin/message/custom/send
 * 限制：用户在小店与客服有 48 小时交互窗口期内才能下发，否则会报 10706 等错误
 *      因此该方法做容错处理，失败仅记录日志，不影响主流程
 *
 * @param openid 买家 openid
 * @param content 文本内容（兑换码或跳转链接）
 */
export async function sendChannelsCustomMessage(openid: string, content: string): Promise<boolean> {
  if (!channelsConfig.appId) {
    console.warn('[channels] 未配置 CHANNELS_APP_ID，跳过客服消息：openid=', openid)
    return false
  }
  if (!openid) {
    console.warn('[channels] 客服消息缺少 openid，跳过')
    return false
  }

  return callChannelsApiWithRetry(async (token) => {
    const url = `${API_BASE}/cgi-bin/message/custom/send?access_token=${token}`
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        touser: openid,
        msgtype: 'text',
        text: { content },
      }),
    })
    const data = (await resp.json()) as WxApiBaseResp
    if (data.errcode && data.errcode !== 0) {
      console.warn(`[channels] 客服消息发送失败（不影响主流程）: errcode=${data.errcode} errmsg=${data.errmsg}`)
      return false
    }
    return true
  })
}

/**
 * 通用 API 调用包装：自动注入 access_token，遇到 40001/42001（token 失效）时刷新重试一次
 */
async function callChannelsApiWithRetry<T>(fn: (token: string) => Promise<T>): Promise<T> {
  let token = await getChannelsAccessToken()
  try {
    return await fn(token)
  } catch (err: any) {
    // 40001: access_token 无效；42001: access_token 过期
    if (err?.errcode === 40001 || err?.errcode === 42001) {
      console.warn('[channels] access_token 失效，强制刷新后重试一次')
      invalidateChannelsAccessToken()
      token = await getChannelsAccessToken(true)
      return await fn(token)
    }
    throw err
  }
}
