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

export interface WxshopEntryState {
  product: WxshopProduct | null
  config: WxshopConfig
  appid: string
  productId: string
  canOpen: boolean
  reason: 'ready' | 'missing_product' | 'missing_appid'
  message: string
}

export interface WxshopPendingPurchase {
  courseId: number
  productId: string
  courseTitle?: string
  productTitle?: string
  sourcePage: 'course-detail' | 'lesson-player' | 'unknown'
  startedAt: number
}

const WXSHOP_CONFIG_STORAGE_KEY = 'wxshop_config'
const WXSHOP_PENDING_PURCHASE_KEY = 'wxshop_pending_purchase'

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

export function resolveWxshopEntryState(
  product: WxshopProduct | null,
  config: WxshopConfig
): WxshopEntryState {
  if (!product?.productId) {
    return {
      product,
      config,
      appid: config.appid,
      productId: '',
      canOpen: false,
      reason: 'missing_product',
      message: '该课程暂未绑定微信小店商品',
    }
  }

  if (!config.appid) {
    return {
      product,
      config,
      appid: '',
      productId: product.productId,
      canOpen: false,
      reason: 'missing_appid',
      message: '微信小店配置未完成，请先在后台配置 appid',
    }
  }

  return {
    product,
    config,
    appid: config.appid,
    productId: product.productId,
    canOpen: true,
    reason: 'ready',
    message: '',
  }
}

export async function getWxshopEntryState(courseId: number): Promise<WxshopEntryState> {
  const [product, config] = await Promise.all([
    getWxshopProduct(courseId),
    fetchWxshopConfig(),
  ])
  return resolveWxshopEntryState(product, config)
}

export function showWxshopUnavailable(state: Pick<WxshopEntryState, 'message' | 'reason'>) {
  if (state.reason === 'ready') return
  console.warn('[wxshop] unavailable:', state)
  Taro.showToast({ title: state.message, icon: 'none' })
}

export function markWxshopPurchasePending(input: Omit<WxshopPendingPurchase, 'startedAt'>) {
  try {
    Taro.setStorageSync(WXSHOP_PENDING_PURCHASE_KEY, {
      ...input,
      startedAt: Date.now(),
    })
  } catch {
    // ignore
  }
}

export function getWxshopPendingPurchase(courseId?: number): WxshopPendingPurchase | null {
  try {
    const pending = Taro.getStorageSync(WXSHOP_PENDING_PURCHASE_KEY) as WxshopPendingPurchase | undefined
    if (!pending?.courseId || !pending.productId) return null
    if (courseId != null && Number(pending.courseId) !== Number(courseId)) return null
    return pending
  } catch {
    return null
  }
}

export function clearWxshopPendingPurchase(courseId?: number) {
  const pending = getWxshopPendingPurchase(courseId)
  if (courseId != null && !pending) return
  try {
    Taro.removeStorageSync(WXSHOP_PENDING_PURCHASE_KEY)
  } catch {
    // ignore
  }
}
