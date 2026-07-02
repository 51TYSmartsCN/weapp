import { Router, Response } from 'express'
import { authMiddleware, AuthRequest, optionalAuthMiddleware } from '../auth'
import { fail, ok } from '../utils'
import {
  claimByScene,
  claimByToken,
  getClaimSceneStatus,
  getClaimTokenStatus,
} from '../services/wechat-store-fulfillment'

const router = Router()

router.get('/claim-tokens/:token', optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const token = String(req.params.token || '').trim()
    if (!token) return fail(res, 400, '缺少 token')
    return ok(res, await getClaimTokenStatus(token, req.userId))
  } catch (err) {
    console.error('[wechat-store] get claim token error:', err)
    return fail(res, 500, '查询领取状态失败')
  }
})

router.post('/claim-tokens/:token/claim', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const token = String(req.params.token || '').trim()
    if (!token) return fail(res, 400, '缺少 token')
    if (!req.userId) return fail(res, 401, '请先登录')
    return ok(res, await claimByToken(token, req.userId))
  } catch (err) {
    console.error('[wechat-store] claim token error:', err)
    return fail(res, 500, '领取课程失败')
  }
})

router.get('/claim-scenes/:scene', optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const scene = decodeURIComponent(String(req.params.scene || '').trim())
    if (!scene) return fail(res, 400, '缺少 scene')
    return ok(res, await getClaimSceneStatus(scene, req.userId))
  } catch (err) {
    console.error('[wechat-store] get claim scene error:', err)
    return fail(res, 500, '查询领取状态失败')
  }
})

router.post('/claim-scenes/:scene/claim', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const scene = decodeURIComponent(String(req.params.scene || '').trim())
    if (!scene) return fail(res, 400, '缺少 scene')
    if (!req.userId) return fail(res, 401, '请先登录')
    return ok(res, await claimByScene(scene, req.userId))
  } catch (err) {
    console.error('[wechat-store] claim scene error:', err)
    return fail(res, 500, '领取课程失败')
  }
})

export default router
