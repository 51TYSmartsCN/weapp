import { Router } from 'express'
import { pool } from '../../db'
import { ok, fail } from '../../utils'
import { authMiddleware } from '../../auth'

const router = Router()

function mapHelpArticleRow(row: any) {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    category: row.category,
    sort: row.sort,
  }
}

/** GET /api/admin/help-articles */
router.get('/help-articles', authMiddleware, async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM help_articles ORDER BY sort, id') as any[]
    const list = (rows as any[]).map(mapHelpArticleRow)
    return ok(res, list)
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

/** POST /api/admin/help-articles */
router.post('/help-articles', authMiddleware, async (req, res) => {
  try {
    const { title, content, category, sort } = req.body
    const [result] = await pool.query(
      'INSERT INTO help_articles (title, content, category, sort) VALUES (?, ?, ?, ?)',
      [title, content ?? '', category ?? '', sort ?? 0]
    ) as any
    return ok(res, { id: (result as any).insertId })
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

/** PUT /api/admin/help-articles/:id */
router.put('/help-articles/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { title, content, category, sort } = req.body
    await pool.query(
      'UPDATE help_articles SET title=?, content=?, category=?, sort=? WHERE id=?',
      [title, content ?? '', category ?? '', sort ?? 0, id]
    )
    return ok(res, null)
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

/** DELETE /api/admin/help-articles/:id */
router.delete('/help-articles/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id)
    await pool.query('DELETE FROM help_articles WHERE id = ?', [id])
    return ok(res, null)
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

export default router
