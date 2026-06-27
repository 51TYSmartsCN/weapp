import { Router } from 'express'
import { pool } from '../../db'
import { ok, fail } from '../../utils'
import { authMiddleware } from '../../auth'

const router = Router()

/** GET /api/admin/dashboard */
router.get('/dashboard', authMiddleware, async (_req, res) => {
  try {
    const [[{ totalCourses }]] = await pool.query('SELECT COUNT(*) AS totalCourses FROM courses') as any
    const [[{ totalUsers }]] = await pool.query('SELECT COUNT(*) AS totalUsers FROM users') as any
    const [[{ totalOrders }]] = await pool.query('SELECT COUNT(*) AS totalOrders FROM orders') as any
    const [[{ totalInstructors }]] = await pool.query('SELECT COUNT(*) AS totalInstructors FROM instructors') as any
    const [[{ totalRevenue }]] = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) AS totalRevenue FROM orders WHERE status = 1'
    ) as any
    const [[{ todayOrders }]] = await pool.query(
      "SELECT COUNT(*) AS todayOrders FROM orders WHERE DATE(created_at) = CURDATE()"
    ) as any

    return ok(res, {
      totalCourses: Number(totalCourses),
      totalUsers: Number(totalUsers),
      totalOrders: Number(totalOrders),
      totalInstructors: Number(totalInstructors),
      totalRevenue: Number(totalRevenue),
      todayOrders: Number(todayOrders),
    })
  } catch (err) {
    console.error(err)
    return fail(res, 500, '服务器错误')
  }
})

export default router
