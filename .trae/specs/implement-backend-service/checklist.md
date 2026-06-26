# Checklist

## 后端骨架
- [x] server/package.json 含 express/mysql2/cors/dotenv/jsonwebtoken/ts-node 依赖与 dev/build/start/seed 脚本
- [x] server/tsconfig.json 配置为 Node 18 + ES2020 + strict
- [x] server/.env.example 含 DB_*、JWT_SECRET、PORT、WECHAT_* 字段
- [x] server/src/config.ts 正确读取 .env 并导出 dbConfig/jwtConfig/wechatConfig
- [x] server/src/db.ts 使用 mysql2 createPool promise 版
- [x] server/src/utils.ts 提供 ok(data) 与 fail(code, msg) 响应封装
- [x] server/src/auth.ts 提供 signToken 与 authMiddleware
- [x] server/src/index.ts 挂载 cors + json + 所有路由并 listen

## 路由覆盖（与前端 services 一一对应）
- [x] POST /api/auth/login 返回 { token, user }
- [x] GET /api/courses 支持 hot/category/page/size 参数
- [x] GET /api/courses/:id 返回课程详情
- [x] GET /api/categories 返回分类列表
- [x] GET /api/courses/:courseId/lessons 返回课时列表
- [x] GET /api/instructors 返回讲师列表
- [x] GET /api/instructors/:id 返回单个讲师
- [x] GET /api/lessons 返回全部课时
- [x] GET /api/lessons/:id 返回单个课时
- [x] POST /api/lessons/:lessonId/progress 上报进度（含 user_courses/certificates 联动）
- [x] GET /api/reviews 返回评价列表（支持可选 course_id）
- [x] GET /api/user 返回当前用户
- [x] GET /api/user/learning/summary 返回 { continueCourse, myCourses, stats }
- [x] GET /api/user/courses 返回我的课程
- [x] POST /api/favorites toggle 语义，返回 boolean
- [x] GET /api/favorites/check?course_id= 返回 boolean
- [x] GET /api/favorites 返回收藏列表
- [x] POST /api/follows toggle 语义，返回 boolean
- [x] GET /api/follows/check?instructor_id= 返回 boolean
- [x] GET /api/follows 返回关注列表
- [x] POST /api/orders 创建订单（mock 直接已支付 + 插入 user_courses）
- [x] GET /api/orders 返回订单列表
- [x] GET /api/orders/:id 返回单个订单
- [x] GET /api/coupons 返回优惠券
- [x] GET /api/invitations 返回 { invitedCount, rewardTotal, invitations }
- [x] GET /api/certificates 返回证书
- [x] GET /api/study-records 返回学习记录
- [x] POST /api/feedbacks 提交反馈
- [x] GET /api/help-articles 支持 category 过滤

## 响应格式
- [x] 所有成功响应为 { code: 0, data: T }
- [x] 业务错误为 { code: <非零>, message: string }
- [x] 未认证返回 HTTP 401 + { code: 401, message: '未登录' }
- [x] 受保护接口挂载 authMiddleware

## Seed 脚本
- [x] npm run seed 能清空所有表并插入初始数据
- [x] seed 后 users/instructors/categories/courses/course_categories/lessons/reviews 表有数据
- [x] course_categories 基于 src/data/courses.ts 的 tags 正确映射到 category code

## 前端改造
- [x] src/services/request.ts 新增 BASE_URL 并拼接到 url 前
- [x] src/services/review.ts API 分支使用 request<T>
- [x] src/services/instructor.ts API 分支使用 request<T>
- [x] src/services/user.ts API 分支使用 request<T>（menuGroups 仍本地导出）
- [x] src/services/config.ts useLocal 改为 false

## 编译验证
- [x] server 目录 tsc --noEmit 通过
- [x] 前端 tsc --noEmit 通过
- [x] 前端所有 service 的 URL 都能在后端路由中找到对应实现（30/30 通过）
