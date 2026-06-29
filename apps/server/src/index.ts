import express from 'express'
import cors from 'cors'
import path from 'path'
import { corsOrigins, isProduction, port, env } from './config'
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
import bannerRoutes from './routes/banner'
import wxshopRoutes from './routes/wxshop'
import adminLoginRoutes from './routes/admin/index'
import adminDashboardRoutes from './routes/admin/dashboard'
import adminCourseRoutes from './routes/admin/course'
import adminInstructorRoutes from './routes/admin/instructor'
import adminLessonRoutes from './routes/admin/lesson'
import adminBannerRoutes from './routes/admin/banner'
import adminCategoryRoutes from './routes/admin/category'
import adminUserRoutes from './routes/admin/user'
import adminOrderRoutes from './routes/admin/order'
import adminReviewRoutes from './routes/admin/review'
import adminFeedbackRoutes from './routes/admin/feedback'
import adminHelpArticleRoutes from './routes/admin/help-article'
import adminAppConfigRoutes from './routes/admin/app-config'
import adminWxshopProductRoutes from './routes/admin/wxshop-product'
import { adminAuthMiddleware } from './auth'

// 注意：dotenv 已在 ./config 里按 NODE_ENV 加载 .env + .env.{NODE_ENV}
// 这里不再重复 dotenv.config()

const app = express()

app.set('trust proxy', true)

// 挂载中间件
app.use(
  cors({
    origin(origin, callback) {
      if (!isProduction || !origin) {
        callback(null, true)
        return
      }

      if (corsOrigins.includes(origin)) {
        callback(null, true)
        return
      }

      callback(new Error(`[cors] 不允许的来源: ${origin}`))
    },
  })
)

// 微信小店回调路由需要原始 body(XML/JSON 混合),先于 express.json 挂载
// 小程序消息推送:XML 明文/密文 或 JSON 明文/密文
app.use(
  '/api/wxshop',
  express.text({ type: ['text/xml', 'application/xml', 'application/json', 'text/plain'], limit: '1mb' })
)
app.use('/api/wxshop', wxshopRoutes)

// 提高 JSON body 限制以支持头像 base64 上传（默认 100kb 过小）
app.use(express.json({ limit: '5mb' }))

// 静态文件服务：提供 /images/*.jpg 等静态资源访问
app.use('/images', express.static(path.join(__dirname, '../public/images')))

// Admin 后台管理静态页面
app.use('/admin', express.static(path.join(__dirname, '../public/admin')))

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
app.use('/api', bannerRoutes) // /api/banners
app.use('/api/instructors', instructorRoutes)
app.use('/api/lessons', lessonRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api', profileRoutes) // /api/help-articles, /api/coupons, /api/invitations, /api/certificates, /api/study-records, /api/feedbacks
// Task 3: 受保护接口路由
app.use('/api/user', userRoutes) // /api/user, /api/user/learning/summary, /api/user/courses
app.use('/api/favorites', favoriteRoutes)
app.use('/api/follows', followRoutes)
app.use('/api/orders', orderRoutes)

// Admin 管理后台路由
app.use('/api/admin', adminLoginRoutes)       // POST /api/admin/login
app.use('/api/admin', adminAuthMiddleware, adminDashboardRoutes)   // GET /api/admin/dashboard
app.use('/api/admin', adminAuthMiddleware, adminCourseRoutes)     // /api/admin/courses
app.use('/api/admin', adminAuthMiddleware, adminInstructorRoutes) // /api/admin/instructors
app.use('/api/admin', adminAuthMiddleware, adminLessonRoutes)      // /api/admin/lessons
app.use('/api/admin', adminAuthMiddleware, adminBannerRoutes)      // /api/admin/banners
app.use('/api/admin', adminAuthMiddleware, adminCategoryRoutes)    // /api/admin/categories
app.use('/api/admin', adminAuthMiddleware, adminUserRoutes)        // /api/admin/users
app.use('/api/admin', adminAuthMiddleware, adminOrderRoutes)       // /api/admin/orders
app.use('/api/admin', adminAuthMiddleware, adminReviewRoutes)      // /api/admin/reviews
app.use('/api/admin', adminAuthMiddleware, adminFeedbackRoutes)   // /api/admin/feedbacks
app.use('/api/admin', adminAuthMiddleware, adminHelpArticleRoutes) // /api/admin/help-articles
app.use('/api/admin', adminAuthMiddleware, adminAppConfigRoutes)   // /api/admin/app-configs
app.use('/api/admin', adminAuthMiddleware, adminWxshopProductRoutes) // /api/admin/wxshop-products
app.use('/api', adminAppConfigRoutes)          // /api/app-configs/theme（小程序用）

// 健康检查占位
app.get('/api/health', (req, res) => res.json({ code: 0, data: { status: 'ok' } }))

// 启动服务
async function bootstrap() {
  await testDbConnection()
  app.listen(port, () => {
    console.log(`[Server] GEO 课程后端服务已启动 (env=${env}): http://localhost:${port}`)
  })
}

bootstrap()

export default app
