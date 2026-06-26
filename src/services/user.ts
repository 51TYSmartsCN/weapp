import { user } from '../data'
import type { User } from '../types'
import type { RequestOptions } from './config'
import { shouldUseLocal } from './config'

/** 获取当前用户信息 */
export async function getUser(options?: RequestOptions): Promise<User> {
  if (shouldUseLocal(options)) return user
  // TODO: return Taro.request({ url: '/api/user' })
  return user
}

/** 获取个人中心菜单配置 */
export { menuGroups } from '../data'