import { request } from './client'

const TOKEN_KEY = 'admin_token'

/** 登录 */
export async function login(username: string, password: string): Promise<string> {
  const { token } = await request<{ token: string }>({
    method: 'POST',
    url: '/admin/login',
    data: { username, password },
  })
  localStorage.setItem(TOKEN_KEY, token)
  return token
}

/** 登出 */
export function logout(): void {
  localStorage.removeItem(TOKEN_KEY)
}

/** 获取 token */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

/** 是否已登录 */
export function isLoggedIn(): boolean {
  return !!localStorage.getItem(TOKEN_KEY)
}
