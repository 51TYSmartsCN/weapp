import Taro from '@tarojs/taro'
import { request } from './request'

export interface WxshopProduct {
  productId: string
  productTitle: string
  courseId: number
  courseTitle: string
}

export interface WxshopConfig {
  appid: string
  shopName: string
  productPath: string
}

const WXSHOP_CONFIG_STORAGE_KEY = 'wxshop_config'

const DEFAULT_WXSHOP_CONFIG: WxshopConfig = {
  appid: '',
  shopName: '微信小店',
  productPath: '/pages/product/detail/index',
}

let cachedConfig: WxshopConfig = DEFAULT_WXSHOP_CONFIG

try {
  const stored = Taro.getStorageSync(WXSHOP_CONFIG_STORAGE_KEY)
  if (stored) {
    cachedConfig = { ...DEFAULT_WXSHOP_CONFIG, ...stored }
  }
} catch {
  // ignore
}

export async function getWxshopProduct(courseId: number): Promise<WxshopProduct | null> {
  try {
    const data = await request<WxshopProduct | null>({
      url: `/api/wxshop/product?courseId=${courseId}`,
      method: 'GET',
      skipAuth: true,
    })
    return data || null
  } catch {
    return null
  }
}

export async function fetchWxshopConfig(): Promise<WxshopConfig> {
  try {
    const data = await request<WxshopConfig>({
      url: '/api/wxshop/config',
      method: 'GET',
      skipAuth: true,
    })
    const config = { ...DEFAULT_WXSHOP_CONFIG, ...(data || {}) }
    cachedConfig = config
    try {
      Taro.setStorageSync(WXSHOP_CONFIG_STORAGE_KEY, config)
    } catch {
      // ignore
    }
    return config
  } catch {
    return cachedConfig
  }
}

export function getWxshopConfigSync(): WxshopConfig {
  return cachedConfig
}

export async function initWxshopConfig(): Promise<WxshopConfig> {
  return fetchWxshopConfig()
}

export async function refreshWxshopConfig(): Promise<WxshopConfig> {
  return fetchWxshopConfig()
}

export async function navigateToWxshopProduct(courseId: number): Promise<boolean> {
  const [product, config] = await Promise.all([
    getWxshopProduct(courseId),
    fetchWxshopConfig(),
  ])

  if (!product) {
    Taro.showToast({ title: '该课程暂未上架小店', icon: 'none' })
    return false
  }

  if (!config.appid) {
    Taro.showToast({ title: '小店配置未完成', icon: 'none' })
    return false
  }

  const path = config.productPath + (config.productPath.includes('?') ? '&' : '?') + `productId=${product.productId}`

  try {
    await Taro.navigateToMiniProgram({
      appId: config.appid,
      path,
      extraData: {
        courseId,
        productId: product.productId,
      },
      envVersion: 'release',
    })
    return true
  } catch (err) {
    console.error('[wxshop] navigate fail:', err)
    Taro.showToast({ title: '跳转小店失败', icon: 'none' })
    return false
  }
}
