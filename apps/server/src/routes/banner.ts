import { Router } from 'express'
import { pool } from '../db'
import { ok, fail } from '../utils'

const router = Router()

/** 将 banners 行映射为前端 Banner 对象 */
function mapBanner(row: any) {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle ?? '',
    image: row.image,
    linkType: row.link_type,
    linkValue: row.link_value ?? '',
    sort: row.sort,
  }
}

/** GET /api/banners 首页 Banner 列表（仅返回启用项，按 sort 升序） */
router.get('/banners', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM banners WHERE status = 1 ORDER BY sort ASC, id ASC'
    )
    return ok(res, (rows as any[]).map(mapBanner))
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

export default router
