import { request } from './request'

export type ClaimStatusValue =
  | 'active'
  | 'claimed_current_user'
  | 'claimed_other_user'
  | 'revoked'
  | 'expired'
  | 'not_found'

export interface ClaimStatus {
  status: ClaimStatusValue
  courseId?: number
  courseTitle?: string
  orderStatus?: string
  claimStatus?: string
  requiresLogin: boolean
}

export async function getClaimTokenStatus(token: string): Promise<ClaimStatus> {
  return request<ClaimStatus>({
    url: `/api/wechat-store/claim-tokens/${encodeURIComponent(token)}`,
    method: 'GET',
    authMode: 'optional',
  })
}

export async function claimByToken(token: string): Promise<ClaimStatus> {
  return request<ClaimStatus>({
    url: `/api/wechat-store/claim-tokens/${encodeURIComponent(token)}/claim`,
    method: 'POST',
  })
}

export async function getClaimSceneStatus(scene: string): Promise<ClaimStatus> {
  return request<ClaimStatus>({
    url: `/api/wechat-store/claim-scenes/${encodeURIComponent(scene)}`,
    method: 'GET',
    authMode: 'optional',
  })
}

export async function claimByScene(scene: string): Promise<ClaimStatus> {
  return request<ClaimStatus>({
    url: `/api/wechat-store/claim-scenes/${encodeURIComponent(scene)}/claim`,
    method: 'POST',
  })
}
