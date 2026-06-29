import type { Banner } from '../types'
import type { RequestOptions } from './config'
import { shouldUseLocal } from './config'
import { request } from './request'

// 默认在线 Banner 图片（可通过后端 /api/banners 配置覆盖）
const DEFAULT_BANNER_IMAGE = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Modern%20AI%20search%20engine%20optimization%20banner%20with%20abstract%20digital%20data%20visualization%2C%20geometric%20neural%20network%20patterns%2C%20teal%20emerald%20gradient%20background%2C%20professional%20technology%20business%20style&image_size=landscape_16_9'

// 本地兜底数据（仅 useLocal=true 时使用）
const localBanners: Banner[] = [
  {
    id: 1,
    title: '掌握 GEO，领先 AI 搜索时代',
    subtitle: '让 AI 引擎优先推荐你的内容',
    image: DEFAULT_BANNER_IMAGE,
    linkType: 'page',
    linkValue: '/pages/course-list/index',
    sort: 0,
  },
]

/** 获取首页 Banner 列表 */
export async function getBanners(options?: RequestOptions): Promise<Banner[]> {
  if (shouldUseLocal(options)) return localBanners
  // TODO: return Taro.request({ url: '/api/banners' })
  return request<Banner[]>({ url: '/api/banners', method: 'GET', skipAuth: true })
}
