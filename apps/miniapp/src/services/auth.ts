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
 * 3. 后端通过 code 换取 openid（mock 模式下 openid = 'mock_openid_' + code）
 * 4. 返回 { token, user }，token 持久化到本地存储
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

/** 退出登录：清除本地 token */
export function logout(): void {
  removeToken()
}
