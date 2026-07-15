import Taro from '@tarojs/taro'
import { BASE_URL } from './request'

export const WECHAT_AI_ENABLED = process.env.TARO_APP_ENABLE_WECHAT_AI === 'true'

const AI_HANDOFF_STORAGE_KEY = 'geo_wechat_ai_handoff'
const AI_BASE_URL_STORAGE_KEY = 'geo_wechat_ai_base_url'

export interface AgentHandoffPayload {
  pageId?: number
  path: string
  query?: string
  payload?: unknown
  receivedAt: number
}

export function cacheAgentHandoff(input: Omit<AgentHandoffPayload, 'receivedAt'>) {
  Taro.setStorageSync(AI_HANDOFF_STORAGE_KEY, {
    ...input,
    receivedAt: Date.now(),
  } satisfies AgentHandoffPayload)
}

export function consumeAgentHandoff(path: string): AgentHandoffPayload | null {
  const handoff = Taro.getStorageSync(AI_HANDOFF_STORAGE_KEY) as AgentHandoffPayload | null
  if (!handoff || handoff.path !== path) return null
  Taro.removeStorageSync(AI_HANDOFF_STORAGE_KEY)
  return handoff
}

export function cacheWechatAiBaseUrl() {
  if (!BASE_URL) return
  Taro.setStorageSync(AI_BASE_URL_STORAGE_KEY, BASE_URL)
}

export function getWechatAiBaseUrl(): string {
  return Taro.getStorageSync(AI_BASE_URL_STORAGE_KEY) || BASE_URL || ''
}
