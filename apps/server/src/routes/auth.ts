import { Router, Request, Response } from 'express'
import fs from 'fs'
import path from 'path'
import { pool } from '../db'
import { ok, fail } from '../utils'
import { signToken, authMiddleware, AuthRequest, blacklistToken } from '../auth'
import { wechatConfig } from '../config'

const router = Router()

/** 头像图片保存目录（public/images/avatars） */
const AVATAR_DIR = path.join(__dirname, '../../public/images/avatars')

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
    // user_courses 关系在 user 路由才接入，此处暂返回 null
    continueCourse: null,
    // 已完善资料：name 不是默认占位且 avatar 不是单字占位
    hasProfile: !!row.name && row.name !== '微信用户' && !!row.avatar && row.avatar !== 'U',
  }
}

/** 调用微信 jscode2session 接口换取 openid + session_key */
async function jscode2session(code: string): Promise<{ openid: string; unionid?: string }> {
  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${encodeURIComponent(
    wechatConfig.appid
  )}&secret=${encodeURIComponent(wechatConfig.secret)}&js_code=${encodeURIComponent(
    code
  )}&grant_type=authorization_code`

  const resp = await fetch(url)
  const data = (await resp.json()) as {
    openid?: string
    unionid?: string
    errcode?: number
    errmsg?: string
  }

  if (!data.openid) {
    throw new Error(`jscode2session 失败: ${data.errcode} ${data.errmsg || ''}`)
  }
  return { openid: data.openid, unionid: data.unionid }
}

/** POST /api/auth/login
 * body: { code: string }
 * - 配置了 WECHAT_APPID + WECHAT_SECRET 时走真实 jscode2session
 * - 未配置时降级为 mock openid（开发联调）
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { code } = req.body || {}
    if (!code || typeof code !== 'string') {
      return fail(res, 400, '缺少 code 参数')
    }

    let openid: string
    let unionid: string | undefined

    if (wechatConfig.appid && wechatConfig.secret) {
      const session = await jscode2session(code)
      openid = session.openid
      unionid = session.unionid
    } else {
      // 开发降级：用 code 直接拼 mock openid
      openid = 'mock_openid_' + code
    }

    // 先查存量用户
    const [rows] = await pool.query('SELECT * FROM users WHERE openid = ?', [openid])
    let userRow = (rows as any[])[0]

    // 不存在则创建（占位昵称 + 头像，待用户在登录后完善资料）
    if (!userRow) {
      await pool.query(
        'INSERT INTO users (openid, unionid, name, avatar, vip) VALUES (?, ?, ?, ?, 0)',
        [openid, unionid ?? null, '微信用户', 'U']
      )
      const [r2] = await pool.query('SELECT * FROM users WHERE openid = ?', [openid])
      userRow = (r2 as any[])[0]
    }

    const token = signToken(userRow.id)
    const user = mapUser(userRow)
    return ok(res, { token, user })
  } catch (err) {
    console.error('[auth] login error:', err)
    return fail(res, 500, err instanceof Error ? err.message : '登录失败')
  }
})

/** POST /api/auth/logout
 * 已登录用户登出：将当前 token 加入黑名单，前端清本地 token。
 * - 黑名单校验在 authMiddleware 中生效，登出后原 token 立即失效
 * - 进程重启后黑名单清空（生产应换 Redis 持久化）
 */
router.post('/logout', authMiddleware, (req: Request, res: Response) => {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (token) blacklistToken(token)
  return ok(res, { success: true })
})

/** POST /api/auth/profile
 * body: { nickname: string, avatarBase64?: string, mime?: string }
 * 已登录用户更新昵称 + 头像。avatarBase64 不传则只更新昵称。
 */
router.post('/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId!
    const { nickname, avatarBase64, mime } = req.body || {}

    if (!nickname || typeof nickname !== 'string' || nickname.trim().length === 0) {
      return fail(res, 400, '昵称不能为空')
    }
    const trimmedName = nickname.trim().slice(0, 64)

    // 处理头像图片（base64 → 文件）
    let avatarUrl: string | undefined
    if (avatarBase64 && typeof avatarBase64 === 'string') {
      // 确保目录存在
      fs.mkdirSync(AVATAR_DIR, { recursive: true })

      const ext = mime === 'image/png' ? 'png' : 'jpg'
      const filename = `avatar-${userId}-${Date.now()}.${ext}`
      const filepath = path.join(AVATAR_DIR, filename)
      const buffer = Buffer.from(avatarBase64, 'base64')
      fs.writeFileSync(filepath, buffer)

      // 拼接完整 URL（与 seed.ts 中课程封面的 URL 风格保持一致）
      const host = req.get('host') || `localhost:${process.env.PORT || 4000}`
      const protocol = req.protocol || 'http'
      avatarUrl = `${protocol}://${host}/images/avatars/${filename}`
    }

    // 更新数据库
    if (avatarUrl) {
      await pool.query('UPDATE users SET name = ?, avatar = ? WHERE id = ?', [
        trimmedName,
        avatarUrl,
        userId,
      ])
    } else {
      await pool.query('UPDATE users SET name = ? WHERE id = ?', [trimmedName, userId])
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [userId])
    const userRow = (rows as any[])[0]
    if (!userRow) return fail(res, 404, '用户不存在')

    const user = mapUser(userRow)
    return ok(res, user)
  } catch (err) {
    console.error('[auth] profile update error:', err)
    return fail(res, 500, '更新资料失败')
  }
})

export default router
