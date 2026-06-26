import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { port } from './config'
import { pool } from './db'
import userRoutes from './routes/user'
import favoriteRoutes from './routes/favorite'
import followRoutes from './routes/follow'
import orderRoutes from './routes/order'
import authRoutes from './routes/auth'
import courseRoutes from './routes/course'
import instructorRoutes from './routes/instructor'
import lessonRoutes from './routes/lesson'
import reviewRoutes from './routes/review'
import profileRoutes from './routes/profile'

// 加载 .env 环境变量
dotenv.config()

const app = express()

// 挂载中间件
app.use(cors())
app.use(express.json())

// 测试数据库连接
async function testDbConnection() {
  try {
    const conn = await pool.getConnection()
    conn.release()
    console.log('[DB] 数据库连接成功')
  } catch (err) {
    console.error('[DB] 数据库连接失败:', err)
  }
}

// 挂载路由
app.use('/api/auth', authRoutes)
app.use('/api', courseRoutes) // /api/courses, /api/categories, /api/courses/:id/lessons
app.use('/api/instructors', instructorRoutes)
app.use('/api/lessons', lessonRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api', profileRoutes) // /api/help-articles, /api/coupons, /api/invitations, /api/certificates, /api/study-records, /api/feedbacks
// Task 3: 受保护接口路由
app.use('/api/user', userRoutes) // /api/user, /api/user/learning/summary, /api/user/courses
app.use('/api/favorites', favoriteRoutes)
app.use('/api/follows', followRoutes)
app.use('/api/orders', orderRoutes)

// 健康检查占位
app.get('/api/health', (req, res) => res.json({ code: 0, data: { status: 'ok' } }))

// 启动服务
async function bootstrap() {
  await testDbConnection()
  app.listen(port, () => {
    console.log(`[Server] GEO 课程后端服务已启动: http://localhost:${port}`)
  })
}

bootstrap()

export default app
