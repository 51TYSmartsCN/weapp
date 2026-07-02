import { Router, Response } from 'express'
import { ok, fail } from '../utils'
import { authMiddleware, AuthRequest } from '../auth'
import { claimRedeemCode } from '../services/wechat-store-fulfillment'

const router = Router()

/**
 * 兑换码核销接口
 * 对应对接.md 中 unlock.tsx 调用的 /api/redeem
 *
 * POST /api/redeem
 * body: { code: string }
 * 鉴权：需要用户登录（Bearer token）
 *
 * 流程：
 * 1. 查询兑换码，校验状态=未使用、未过期
 * 2. 标记为已使用（user_id / used_at）
 * 3. 写入 user_courses 解锁课程（幂等），users.bought_courses + 1
 * 4. 返回 { courseId, courseTitle }
 */
router.post('/redeem', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    const code = (req.body?.code || '').toString().trim().toUpperCase()

    if (!userId) {
      return fail(res, 401, '请先登录')
    }
    if (!code) {
      return fail(res, 400, '请输入兑换码')
    }

    const result = await claimRedeemCode(code, userId)
    if (result.status === 'not_found') return fail(res, 404, '兑换码不存在')
    if (result.status === 'claimed_other_user') return fail(res, 400, '兑换码已被使用')
    if (result.status === 'revoked') return fail(res, 400, '兑换码已作废')
    if (result.status === 'expired') return fail(res, 400, '兑换码已过期')

    return ok(res, {
      courseId: result.courseId,
      courseTitle: result.courseTitle || '',
      status: result.status,
    })
  } catch (err) {
    console.error('[redeem] error:', err)
    return fail(res, 500, '兑换失败，请稍后重试')
  }
})

export default router
