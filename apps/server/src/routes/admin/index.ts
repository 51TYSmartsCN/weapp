import { Router } from 'express'
import { signToken } from '../../auth'
import { ok, fail } from '../../utils'

const router = Router()

/** POST /api/admin/login */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    if (username !== 'admin' || password !== 'admin123') {
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
