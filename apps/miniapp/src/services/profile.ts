import {
  certificates,
  coupons,
  helpArticles,
  invitationsSummary,
  studyRecords,
} from '../data'
import type {
  Certificate,
  Coupon,
  Feedback,
  FeedbackPayload,
  HelpArticle,
  InvitationSummary,
  StudyRecord,
} from '../types'
import type { RequestOptions } from './config'
import { shouldUseLocal } from './config'
import { request } from './request'

/** 获取当前用户优惠券列表 */
export async function getCoupons(options?: RequestOptions): Promise<Coupon[]> {
  if (shouldUseLocal(options)) return coupons
  // TODO: return Taro.request({ url: '/api/coupons' })
  return request<Coupon[]>({ url: '/api/coupons', method: 'GET' })
}

/** 获取邀请好友汇总信息 */
export async function getInvitations(options?: RequestOptions): Promise<InvitationSummary> {
  if (shouldUseLocal(options)) return invitationsSummary
  // TODO: return Taro.request({ url: '/api/invitations' })
  return request<InvitationSummary>({ url: '/api/invitations', method: 'GET' })
}

/** 获取学习证书列表 */
export async function getCertificates(options?: RequestOptions): Promise<Certificate[]> {
  if (shouldUseLocal(options)) return certificates
  // TODO: return Taro.request({ url: '/api/certificates' })
  return request<Certificate[]>({ url: '/api/certificates', method: 'GET' })
}

/** 获取学习记录列表 */
export async function getStudyRecords(options?: RequestOptions): Promise<StudyRecord[]> {
  if (shouldUseLocal(options)) return studyRecords
  // TODO: return Taro.request({ url: '/api/study-records' })
  return request<StudyRecord[]>({ url: '/api/study-records', method: 'GET' })
}

/** 提交意见反馈 */
export async function createFeedback(
  payload: FeedbackPayload,
  options?: RequestOptions
): Promise<Feedback> {
  if (shouldUseLocal(options)) {
    return {
      id: Date.now(),
      userId: 0,
      type: payload.type,
      content: payload.content,
      contact: payload.contact,
      createdAt: new Date().toISOString(),
    }
  }
  // TODO: return Taro.request({ url: '/api/feedbacks', method: 'POST', data: payload })
  return request<Feedback>({ url: '/api/feedbacks', method: 'POST', data: payload })
}

/** 获取帮助中心文章列表，可按分类筛选 */
export async function getHelpArticles(
  category?: string,
  options?: RequestOptions
): Promise<HelpArticle[]> {
  if (shouldUseLocal(options)) {
    return category ? helpArticles.filter((a) => a.category === category) : helpArticles
  }
  // TODO: return Taro.request({ url: '/api/help-articles', data: { category } })
  return request<HelpArticle[]>({ url: '/api/help-articles', method: 'GET', data: { category } })
}
