import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { pool } from '../../db'
import { ok, fail } from '../../utils'
import { authMiddleware } from '../../auth'

const router = Router()

// TabBar 图标上传配置
// ts-node-dev 运行时 __dirname 指向 src/routes/admin/，需向上 3 层到达 server 根目录的 public/
const tabIconDir = path.join(__dirname, '../../../public/images/tab')
if (!fs.existsSync(tabIconDir)) {
  fs.mkdirSync(tabIconDir, { recursive: true })
}

// Logo 上传目录
const logoDir = path.join(__dirname, '../../../public/images/logo')
if (!fs.existsSync(logoDir)) {
  fs.mkdirSync(logoDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, tabIconDir),
  filename: (req, file, cb) => {
    // 用原始扩展名，文件名用 tab-{index}-{state}.png
    const ext = path.extname(file.originalname) || '.png'
    const { index, state } = req.params
    cb(null, `tab-${index}-${state}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 }, // 100kb（微信限制 40kb，留余量）
  fileFilter: (_req, file, cb) => {
    if (!['image/png', 'image/jpeg'].includes(file.mimetype)) {
      return cb(new Error('仅支持 PNG/JPG 格式'))
    }
    cb(null, true)
  },
})

// Logo 上传 multer 配置（独立 storage，文件名带时间戳避免缓存）
const logoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, logoDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png'
    cb(null, `logo-${Date.now()}${ext}`)
  },
})

const uploadLogo = multer({
  storage: logoStorage,
  limits: { fileSize: 500 * 1024 }, // 500kb
  fileFilter: (_req, file, cb) => {
    if (!['image/png', 'image/jpeg'].includes(file.mimetype)) {
      return cb(new Error('仅支持 PNG/JPG 格式'))
    }
    cb(null, true)
  },
})

interface AppConfigRow {
  id: number
  key: string
  value: string
  description: string | null
  updated_at: Date
}

function appendVersion(url: string, version: string): string {
  if (!url) return url

  const [pathname, queryString = ''] = url.split('?')
  const params = new URLSearchParams(queryString)
  params.set('v', version)
  return `${pathname}?${params.toString()}`
}

function withTabIconVersion(value: any, updatedAt?: Date): any {
  if (!value || !Array.isArray(value.tabItems) || !updatedAt) return value

  const version = String(new Date(updatedAt).getTime())
  return {
    ...value,
    tabItems: value.tabItems.map((item: any) => ({
      ...item,
      iconUrl: appendVersion(item.iconUrl || '', version),
      activeIconUrl: appendVersion(item.activeIconUrl || '', version),
    })),
  }
}

function mapConfigRow(row: any) {
  return {
    id: row.id,
    key: row.key,
    value: row.key === 'theme'
      ? withTabIconVersion(JSON.parse(row.value), row.updated_at)
      : JSON.parse(row.value),
    description: row.description,
    updatedAt: row.updated_at,
  }
}

/** GET /api/app-configs/theme - 小程序获取主题配置（无需登录，需放在 :key 之前） */
router.get('/app-configs/theme', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT value, updated_at FROM app_configs WHERE `key` = ?', ['theme']) as [any[], any]
    const row = rows[0]
    if (!row) {
      // 返回默认主题色（蓝紫色系）
      return ok(res, {
        primary: '#6366F1',
        primaryLight: '#818CF8',
        primaryLighter: '#C7D2FE',
        primaryLightest: '#EEF2FF',
        primaryDark: '#4F46E5',
        primaryDarker: '#4338CA',
        tabBarSelectedColor: '#6366F1',
        tabBarColor: '#94A3B8',
        tabBarBgColor: '#FFFFFF',
      })
    }
    return ok(res, withTabIconVersion(JSON.parse(row.value), row.updated_at))
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

/**
 * GET /api/app-configs/module-modes - 小程序获取模块展示模式配置（无需登录，需放在 :key 之前）
 * 控制各模块在「视频/图文」之间切换，所有环境表现一致
 */
router.get('/app-configs/module-modes', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT value FROM app_configs WHERE `key` = ?', ['module_modes']) as [any[], any]
    const row = rows[0]
    if (!row) {
      // 默认：课时播放走视频、详情封面走图片
      return ok(res, {
        lessonPlayer: { contentMode: 'video' },
        courseDetailCover: { mode: 'image' },
      })
    }
    return ok(res, JSON.parse(row.value))
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

/**
 * GET /api/app-configs/app-info - 小程序获取应用基础信息（无需登录，需放在 :key 之前）
 * 包含应用名称、应用描述、应用 Logo 等
 */
router.get('/app-configs/app-info', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT value FROM app_configs WHERE `key` = ?', ['app-info']) as [any[], any]
    const row = rows[0]
    if (!row) {
      // 返回默认应用信息
      return ok(res, {
        appName: 'GEO 课程',
        appDescription: '专注 GEO 领域的实战学习平台',
      })
    }
    return ok(res, JSON.parse(row.value))
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

/**
 * GET /api/app-configs/home-stats - 小程序获取首页统计卡片配置（无需登录，需放在 :key 之前）
 * 控制首页 StatsCard 的展示内容
 */
router.get('/app-configs/home-stats', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT value FROM app_configs WHERE `key` = ?', ['home_stats']) as [any[], any]
    const row = rows[0]
    if (!row) {
      return ok(res, [
        { value: '10,000+', label: '学员' },
        { value: '200+', label: '企业客户' },
        { value: '98%', label: '好评率' },
      ])
    }
    return ok(res, JSON.parse(row.value))
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

/**
 * POST /api/admin/app-configs/tabbar/icon/:index/:state
 * 上传 TabBar 图标
 * - index: tab 序号 0-3
 * - state: normal | active
 * 返回图标的可访问 URL
 */
router.post('/app-configs/tabbar/icon/:index/:state', authMiddleware, upload.single('file'), (req, res) => {
  try {
    const index = Number(req.params.index)
    const state = req.params.state
    if (index < 0 || index > 3) return fail(res, 400, 'index 范围 0-3')
    if (!['normal', 'active'].includes(state)) return fail(res, 400, 'state 仅支持 normal/active')

    if (!req.file) return fail(res, 400, '未收到文件')

    // 固定文件名会让小程序和浏览器命中旧缓存，这里返回带版本号的 URL 强制刷新。
    const url = appendVersion(`/images/tab/${req.file.filename}`, String(Date.now()))
    return ok(res, { url })
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

/**
 * POST /api/admin/app-configs/logo
 * 上传应用 Logo 图片
 * 返回图标的可访问 URL
 */
router.post('/app-configs/logo', authMiddleware, uploadLogo.single('file'), (req, res) => {
  try {
    if (!req.file) return fail(res, 400, '未收到文件')
    const url = `/images/logo/${req.file.filename}`
    return ok(res, { url })
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

/** GET /api/admin/app-configs */
router.get('/app-configs', authMiddleware, async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM app_configs') as [AppConfigRow[], any]
    const list = rows.map(mapConfigRow)
    return ok(res, list)
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

/** GET /api/admin/app-configs/:key */
router.get('/app-configs/:key', authMiddleware, async (req, res) => {
  try {
    const key = req.params.key
    const [rows] = await pool.query('SELECT * FROM app_configs WHERE `key` = ?', [key]) as [AppConfigRow[], any]
    const row = rows[0]
    if (!row) return fail(res, 404, '配置不存在')
    return ok(res, mapConfigRow(row))
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

/** PUT /api/admin/app-configs/:key */
router.put('/app-configs/:key', authMiddleware, async (req, res) => {
  try {
    const key = req.params.key
    const { value, description } = req.body

    // 检查是否存在
    const [existing] = await pool.query('SELECT id FROM app_configs WHERE `key` = ?', [key]) as [any[], any]
    if ((existing as any[]).length === 0) {
      // 不存在则创建
      await pool.query(
        'INSERT INTO app_configs (`key`, `value`, `description`) VALUES (?, ?, ?)',
        [key, JSON.stringify(value), description ?? '']
      )
    } else {
      // 存在则更新
      await pool.query(
        'UPDATE app_configs SET `value` = ?, `description` = ? WHERE `key` = ?',
        [JSON.stringify(value), description ?? '', key]
      )
    }
    return ok(res, null)
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

export default router
