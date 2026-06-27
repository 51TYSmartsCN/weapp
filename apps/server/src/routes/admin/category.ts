import { Router } from 'express'
import { pool } from '../../db'
import { ok, fail } from '../../utils'
import { authMiddleware } from '../../auth'

const router = Router()

function mapCategoryRow(row: any) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    sort: row.sort,
  }
}

/** GET /api/admin/categories */
router.get('/categories', authMiddleware, async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY sort, id') as any[]
    const list = (rows as any[]).map(mapCategoryRow)
    return ok(res, list)
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

/** POST /api/admin/categories */
router.post('/categories', authMiddleware, async (req, res) => {
  try {
    const { code, name, sort } = req.body
    const [result] = await pool.query(
      'INSERT INTO categories (code, name, sort) VALUES (?, ?, ?)',
      [code, name, sort ?? 0]
    ) as any
    return ok(res, { id: (result as any).insertId })
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

/** PUT /api/admin/categories/:id */
router.put('/categories/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { code, name, sort } = req.body
    await pool.query(
      'UPDATE categories SET code=?, name=?, sort=? WHERE id=?',
      [code, name, sort ?? 0, id]
    )
    return ok(res, null)
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

/** DELETE /api/admin/categories/:id */
router.delete('/categories/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id)
    await pool.query('DELETE FROM categories WHERE id = ?', [id])
    return ok(res, null)
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

export default router
