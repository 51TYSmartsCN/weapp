import { request } from './request'

/**
 * 兑换码核销服务
 * 对应对接.md 中 unlock.tsx 的兑换请求
 *
 * 后端接口：POST /api/redeem（需登录）
 * 返回：{ courseId, courseTitle }
 */

export interface RedeemResult {
  courseId: number
  courseTitle: string
}

/** 提交兑换码核销 */
export async function redeemCode(code: string): Promise<RedeemResult> {
  return request<RedeemResult>({
    url: '/api/redeem',
    method: 'POST',
    data: { code },
  })
}
