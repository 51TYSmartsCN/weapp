import type { Banner } from '../types'
import type { RequestOptions } from './config'
import { shouldUseLocal } from './config'
import { request } from './request'

// 本地兜底数据（仅 useLocal=true 时使用）
const localBanners: Banner[] = [
  {
    id: 1,
    title: '掌握 GEO，领先 AI 搜索时代',
    subtitle: '让 AI 引擎优先推荐你的内容',
    image: '',
    linkType: 'page',
    linkValue: '/pages/course-list/index',
    sort: 0,
  },
]

/** 获取首页 Banner 列表 */
export async function getBanners(options?: RequestOptions): Promise<Banner[]> {
  if (shouldUseLocal(options)) return localBanners
  // TODO: return Taro.request({ url: '/api/banners' })
  return request<Banner[]>({ url: '/api/banners', method: 'GET' })
}
