import { Router } from 'express'
import { pool } from '../db'
import { ok, fail } from '../utils'
import { signToken } from '../auth'

const router = Router()

/** 将 users 表行映射为前端 User 对象（camelCase） */
function mapUser(row: any) {
  return {
    id: row.id,
    name: row.name,
    avatar: row.avatar,
    vip: !!row.vip,
    vipExpireAt: row.vip_expire_at ? String(row.vip_expire_at) : undefined,
    boughtCourses: row.bought_courses,
    finishedLessons: row.finished_lessons,
    studyHours: row.study_hours,
    // user_courses 关系在 Task 3 才接入，此处暂返回 null
    continueCourse: null,
  }
}

/** POST /api/auth/login
 * body: { code: string }
 * mock 逻辑：openid = 'mock_openid_' + code
 */
router.post('/login', async (req, res) => {
  try {
    const { code } = req.body || {}
    if (!code || typeof code !== 'string') {
      return fail(res, 400, '缺少 code 参数')
    }

    const openid = 'mock_openid_' + code

    // 先查存量用户
    const [rows] = await pool.query('SELECT * FROM users WHERE openid = ?', [openid])
    let userRow = (rows as any[])[0]

    // 不存在则创建
    if (!userRow) {
      await pool.query(
        'INSERT INTO users (openid, name, avatar, vip) VALUES (?, ?, ?, 0)',
        [openid, '微信用户', 'U']
      )
      const [r2] = await pool.query('SELECT * FROM users WHERE openid = ?', [openid])
      userRow = (r2 as any[])[0]
    }

    const token = signToken(userRow.id)
    const user = mapUser(userRow)
    return ok(res, { token, user })
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

export default router
