import { Router, Response } from 'express'
import { authMiddleware, AuthRequest, optionalAuthMiddleware } from '../auth'
import { fail, ok } from '../utils'
import { wxshopConfig } from '../config'
import {
  claimByScene,
  claimByToken,
  createPostPurchaseFulfillment,
  getClaimSceneStatus,
  getClaimTokenStatus,
  StoreSourceScene,
} from '../services/wechat-store-fulfillment'

const router = Router()

function normalizeSourceScene(value: unknown): StoreSourceScene {
  const scene = String(value || 'unknown')
  if (
    scene === 'miniapp' ||
    scene === 'channels_video' ||
    scene === 'channels_live' ||
    scene === 'channels_showcase' ||
    scene === 'store'
  ) {
    return scene
  }
  return 'unknown'
}

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

router.post('/orders/mock-fulfillment', async (req, res) => {
  if (!wxshopConfig.mockMode) {
    return fail(res, 403, 'mock 接口仅在 mockMode 下可用')
  }

  try {
    const courseId = Number(req.body?.courseId)
    if (!courseId) return fail(res, 400, '缺少 courseId')

    const storeOrderId = String(req.body?.storeOrderId || `WXSTORE_MOCK_${Date.now()}`)
    const result = await createPostPurchaseFulfillment({
      storeOrderId,
      courseId,
      sourceScene: normalizeSourceScene(req.body?.sourceScene),
      storeProductId: req.body?.storeProductId ? String(req.body.storeProductId) : undefined,
      storeSkuId: req.body?.storeSkuId ? String(req.body.storeSkuId) : undefined,
      buyerOpenid: req.body?.buyerOpenid ? String(req.body.buyerOpenid) : undefined,
      rawPayload: { mock: true, body: req.body },
    })

    return ok(res, result)
  } catch (err) {
    console.error('[wechat-store] mock fulfillment error:', err)
    return fail(res, 500, err instanceof Error ? err.message : 'mock 发货失败')
  }
})

export default router
