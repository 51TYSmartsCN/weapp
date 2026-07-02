import { channelsConfig, isProduction } from '../config'

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
  if (isProduction && !channelsConfig.appId) {
    console.warn('[channels] 跳过确认发货调用：未配置 CHANNELS_APP_ID')
    return false
  }
  if (!channelsConfig.appId) {
    console.log('[channels] mock 跳过确认发货调用：', { orderId, deliveryNote })
    return false
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

/**
 * 虚拟商品发货。
 *
 * 有 deliveryNote 时优先调用 /order/confirm_delivery，把入口写入 delivery_note。
 * 无 deliveryNote 时保留旧 /channels/ec/order/delivery_send 兼容路径。
 *
 * @param orderId 微信小店订单号（order_id）
 * @param deliveryNote 买家订单详情页可见的发货说明
 * @returns 是否发货成功
 */
export async function deliverVirtualOrder(orderId: string, deliveryNote?: string): Promise<boolean> {
  if (deliveryNote && deliveryNote.trim()) {
    return confirmDeliveryWithNote(orderId, deliveryNote.trim())
  }

  if (isProduction && !channelsConfig.appId) {
    console.warn('[channels] 跳过发货调用：未配置 CHANNELS_APP_ID')
    return false
  }
  if (!channelsConfig.appId) {
    console.log('[channels] mock 跳过发货调用：orderId=', orderId)
    return false
  }

  return callChannelsApiWithRetry(async (token) => {
    const url = `${API_BASE}/channels/ec/order/delivery_send?access_token=${token}`
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: orderId,
        delivery_list: [
          {
            // 1=自寄快递，3=虚拟商品无需物流发货（视频号小店虚拟商品场景）
            deliver_type: 3,
          },
        ],
      }),
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
    console.log('[channels] mock 跳过客服消息：openid=', openid)
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
