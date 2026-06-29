import { Router } from 'express'
import { signToken } from '../../auth'
import { ok, fail } from '../../utils'
import { adminConfig } from '../../config'

const router = Router()

/** POST /api/admin/login */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    if (!adminConfig.username || !adminConfig.password) {
      return fail(res, 1002, '管理员账号未配置')
    }
    if (username !== adminConfig.username || password !== adminConfig.password) {
      return fail(res, 1001, '用户名或密码错误')
    }
    const token = signToken(99999) // admin userId
    return ok(res, { token })
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

export default router
