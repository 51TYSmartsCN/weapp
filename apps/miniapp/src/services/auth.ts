import Taro from '@tarojs/taro'
import { request } from './request'
import type { User } from '../types'

/** 本地存储的 token key */
const TOKEN_KEY = 'geo_token'

/** 登录接口返回结构 */
interface LoginResult {
  token: string
  user: User
}

/** 读取本地 token */
export function getToken(): string {
  return Taro.getStorageSync(TOKEN_KEY) || ''
}

/** 写入本地 token */
export function setToken(token: string): void {
  Taro.setStorageSync(TOKEN_KEY, token)
}

/** 清除本地 token */
export function removeToken(): void {
  Taro.removeStorageSync(TOKEN_KEY)
}

/** 是否已登录（仅判断本地是否存在 token） */
export function isLoggedIn(): boolean {
  return !!getToken()
}

/**
 * 微信登录流程：
 * 1. Taro.login 获取临时 code
 * 2. POST /api/auth/login { code }
 * 3. 后端配置了 WECHAT_APPID/SECRET 时走真实 jscode2session 换 openid；否则降级 mock
 * 4. 返回 { token, user }，token 持久化到本地存储
 * 5. user.hasProfile === false 表示昵称/头像仍是占位，需要调用 updateProfile 完善
 */
export async function login(): Promise<User> {
  const { code } = await Taro.login()
  if (!code) {
    throw new Error('微信登录失败：未获取到 code')
  }

  const result = await request<LoginResult>({
    url: '/api/auth/login',
    method: 'POST',
    data: { code },
    skipAuth: true,
  })

  setToken(result.token)
  return result.user
}

/** 更新资料载荷 */
export interface UpdateProfilePayload {
  /** 昵称（必填） */
  nickname: string
  /** 头像临时文件路径（来自 chooseAvatar 事件）。不传则只更新昵称 */
  avatarTempPath?: string
}

/**
 * 完善用户资料：上传昵称 + 头像到后端。
 * - 头像临时文件会被读取为 base64 一并发送，后端落盘成静态资源并返回 URL
 * - 调用前需已登录（依赖本地 token）
 */
export async function updateProfile(payload: UpdateProfilePayload): Promise<User> {
  const body: Record<string, unknown> = { nickname: payload.nickname }

  if (payload.avatarTempPath) {
    // 读取微信返回的临时文件并转 base64
    const fs = Taro.getFileSystemManager()
    const base64 = fs.readFileSync(payload.avatarTempPath, 'base64') as string
    body.avatarBase64 = base64
    body.mime = 'image/jpeg'
  }

  return request<User>({
    url: '/api/auth/profile',
    method: 'POST',
    data: body,
  })
}

/**
 * 退出登录：
 * 1. 调后端 /api/auth/logout 将当前 token 加入黑名单（让旧 token 立即失效）
 * 2. 即使后端调用失败（网络/超时）也继续清本地 token，确保用户一定能退出
 * 3. 清除本地 token
 */
export async function logout(): Promise<void> {
  try {
    await request<void>({
      url: '/api/auth/logout',
      method: 'POST',
    })
  } catch (err) {
    // 后端调用失败（网络/超时/token 已过期）也继续清本地 token
    console.warn('[logout] 后端登出失败，仍清除本地 token', err)
  } finally {
    removeToken()
  }
}
