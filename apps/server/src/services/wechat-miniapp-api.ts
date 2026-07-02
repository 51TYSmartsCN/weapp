import fs from 'fs/promises'
import path from 'path'
import { baseUrl, fulfillmentConfig, isProduction, wechatConfig } from '../config'

const API_BASE = 'https://api.weixin.qq.com'
const TOKEN_REFRESH_LEAD_MS = 5 * 60 * 1000

interface WxApiBaseResp {
  errcode?: number
  errmsg?: string
}

let cachedAccessToken: { token: string; expiresAt: number } | null = null

async function getMiniappAccessToken(forceUpdate = false): Promise<string> {
  if (!forceUpdate && cachedAccessToken && Date.now() < cachedAccessToken.expiresAt) {
    return cachedAccessToken.token
  }

  if (!wechatConfig.appid || !wechatConfig.secret) {
    throw new Error('[miniapp] 未配置 WECHAT_APPID / WECHAT_SECRET，无法获取 access_token')
  }

  const resp = await fetch(`${API_BASE}/cgi-bin/stable_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credential',
      appid: wechatConfig.appid,
      secret: wechatConfig.secret,
      force_update: forceUpdate,
    }),
  })
  const data = (await resp.json()) as { access_token?: string; expires_in?: number } & WxApiBaseResp
  if (!data.access_token) {
    throw new Error(`[miniapp] 获取 access_token 失败: errcode=${data.errcode} errmsg=${data.errmsg}`)
  }

  cachedAccessToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 7200) * 1000 - TOKEN_REFRESH_LEAD_MS,
  }
  return cachedAccessToken.token
}

async function callMiniappApiWithRetry<T>(fn: (token: string) => Promise<T>): Promise<T> {
  let token = await getMiniappAccessToken()
  try {
    return await fn(token)
  } catch (err: any) {
    if (err?.errcode === 40001 || err?.errcode === 42001) {
      cachedAccessToken = null
      token = await getMiniappAccessToken(true)
      return fn(token)
    }
    throw err
  }
}

function normalizePagePath(page: string): string {
  return page.replace(/^\//, '')
}

function buildMockPath(query: string): string {
  const page = fulfillmentConfig.claimPage
  return `${page}${query ? `?${query}` : ''}`
}

export async function generateMiniappUrlLink(query: string): Promise<string> {
  if (!wechatConfig.appid || !wechatConfig.secret) {
    if (isProduction) {
      throw new Error('[miniapp] 生产环境未配置 WECHAT_APPID / WECHAT_SECRET，无法生成 URL Link')
    }
    return `${baseUrl}/mock-miniapp-link${buildMockPath(query)}`
  }

  return callMiniappApiWithRetry(async (token) => {
    const resp = await fetch(`${API_BASE}/wxa/generate_urllink?access_token=${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: normalizePagePath(fulfillmentConfig.claimPage),
        query,
        env_version: 'release',
        expire_type: 1,
        expire_interval: fulfillmentConfig.urlLinkExpireDays,
      }),
    })
    const data = (await resp.json()) as { url_link?: string } & WxApiBaseResp
    if (!data.url_link) {
      throw Object.assign(
        new Error(`[miniapp] 生成 URL Link 失败: errcode=${data.errcode} errmsg=${data.errmsg}`),
        { errcode: data.errcode }
      )
    }
    return data.url_link
  })
}

export async function generateUnlimitedQRCode(scene: string): Promise<string | null> {
  if (!wechatConfig.appid || !wechatConfig.secret) {
    if (isProduction) {
      throw new Error('[miniapp] 生产环境未配置 WECHAT_APPID / WECHAT_SECRET，无法生成小程序码')
    }
    return null
  }

  return callMiniappApiWithRetry(async (token) => {
    const resp = await fetch(`${API_BASE}/wxa/getwxacodeunlimit?access_token=${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scene,
        page: normalizePagePath(fulfillmentConfig.claimPage),
        check_path: false,
        env_version: 'release',
      }),
    })

    const contentType = resp.headers.get('content-type') || ''
    const buffer = Buffer.from(await resp.arrayBuffer())
    if (contentType.includes('application/json')) {
      const data = JSON.parse(buffer.toString('utf-8')) as WxApiBaseResp
      throw Object.assign(
        new Error(`[miniapp] 生成小程序码失败: errcode=${data.errcode} errmsg=${data.errmsg}`),
        { errcode: data.errcode }
      )
    }

    const dir = path.resolve(__dirname, '../../public/images/wxshop-claims')
    await fs.mkdir(dir, { recursive: true })
    const filename = `${scene}.png`
    await fs.writeFile(path.join(dir, filename), buffer)
    return `${baseUrl}/images/wxshop-claims/${filename}`
  })
}
