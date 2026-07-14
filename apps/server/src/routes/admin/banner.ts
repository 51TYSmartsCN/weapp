import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { pool } from '../../db'
import { ok, fail } from '../../utils'
import { authMiddleware } from '../../auth'
import { baseUrl } from '../../config'

const router = Router()
const BANNER_IMAGE_MAX_SIZE = 2 * 1024 * 1024

const bannerImageDir = path.join(__dirname, '../../../public/images/banners')
if (!fs.existsSync(bannerImageDir)) {
  fs.mkdirSync(bannerImageDir, { recursive: true })
}

const bannerImageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, bannerImageDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg'
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    cb(null, `banner-${unique}${ext}`)
  },
})

const bannerImageUpload = multer({
  storage: bannerImageStorage,
  limits: { fileSize: BANNER_IMAGE_MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!['image/png', 'image/jpeg'].includes(file.mimetype)) {
      return cb(new Error('仅支持 PNG/JPG 格式'))
    }
    cb(null, true)
  },
})

function resolveBannerImage(image: unknown) {
  const value = typeof image === 'string' ? image.trim() : ''
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value
  if (value.startsWith('/')) return `${baseUrl}${value}`
  return `${baseUrl}/${value}`
}

function mapBannerRow(row: any) {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    image: resolveBannerImage(row.image),
    linkType: row.link_type,
    linkValue: row.link_value,
    sort: row.sort,
    status: row.status,
    createdAt: row.created_at,
  }
}

/** GET /api/admin/banners */
router.get('/banners', authMiddleware, async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM banners ORDER BY sort, id DESC') as any[]
    const list = (rows as any[]).map(mapBannerRow)
    return ok(res, list)
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

/** POST /api/admin/banners */
router.post('/banners', authMiddleware, async (req, res) => {
  try {
    const { title, subtitle, image, linkType, linkValue, sort, status } = req.body
    const [result] = await pool.query(
      `INSERT INTO banners (title, subtitle, image, link_type, link_value, sort, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [title, subtitle ?? '', image ?? '', linkType ?? '', linkValue ?? '', sort ?? 0, status ?? 1]
    ) as any
    return ok(res, { id: (result as any).insertId })
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

/**
 * POST /api/admin/banners/image
 * 上传 Banner 图片，返回可访问 URL
 */
router.post('/banners/image', authMiddleware, (req, res) => {
  bannerImageUpload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return fail(res, 400, 'Banner 图片大小不能超过 2MB')
    }

    if (err) {
      return fail(res, 400, err.message || 'Banner 图片上传失败')
    }

    try {
      if (!req.file) return fail(res, 400, '未收到文件')
      const url = resolveBannerImage(`/images/banners/${req.file.filename}`)
      return ok(res, { url })
    } catch (error) {
      console.error(error)
      return fail(res, 500, '服务器错误')
    }
  })
})

/** PUT /api/admin/banners/:id */
router.put('/banners/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { title, subtitle, image, linkType, linkValue, sort, status } = req.body
    await pool.query(
      `UPDATE banners SET title=?, subtitle=?, image=?, link_type=?, link_value=?, sort=?, status=?
       WHERE id=?`,
      [title, subtitle ?? '', image ?? '', linkType ?? '', linkValue ?? '', sort ?? 0, status ?? 1, id]
    )
    return ok(res, null)
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

/** PUT /api/admin/banners/:id/status */
router.put('/banners/:id/status', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const [rows] = await pool.query('SELECT status FROM banners WHERE id = ?', [id]) as any
    const row = (rows as any[])[0]
    if (!row) return fail(res, 404, 'Banner不存在')
    const newStatus = row.status === 1 ? 0 : 1
    await pool.query('UPDATE banners SET status = ? WHERE id = ?', [newStatus, id])
    return ok(res, { status: newStatus })
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

/** DELETE /api/admin/banners/:id */
router.delete('/banners/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id)
    await pool.query('DELETE FROM banners WHERE id = ?', [id])
    return ok(res, null)
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

export default router
