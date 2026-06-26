# Tasks

## 阶段一：后端项目骨架

- [x] Task 1: 搭建 server/ 项目骨架
  - [x] SubTask 1.1: 创建 `server/package.json`（依赖：express、mysql2、cors、dotenv、jsonwebtoken、typescript、ts-node、@types/*；脚本：dev/build/start/seed）
  - [x] SubTask 1.2: 创建 `server/tsconfig.json`（target ES2020、module CommonJS、outDir dist、strict true）
  - [x] SubTask 1.3: 创建 `server/.env.example`（DB_HOST/DB_PORT/DB_USER/DB_PASS/DB_NAME/JWT_SECRET/PORT/WECHAT_APPID/WECHAT_SECRET）
  - [x] SubTask 1.4: 创建 `server/src/config.ts` 读取 .env 导出 dbConfig / jwtConfig / wechatConfig
  - [x] SubTask 1.5: 创建 `server/src/db.ts`（mysql2 createPool promise 版）
  - [x] SubTask 1.6: 创建 `server/src/utils.ts`（ok(data) / fail(code, msg) 响应封装）
  - [x] SubTask 1.7: 创建 `server/src/auth.ts`（signToken + authMiddleware）
  - [x] SubTask 1.8: 创建 `server/src/index.ts`（Express 入口，挂载 cors + json + 所有路由 + listen）

## 阶段二：路由实现

- [x] Task 2: 实现认证与公开读接口路由
  - [x] SubTask 2.1: `routes/auth.ts` — POST /api/auth/login（mock openid + upsert users + 签发 JWT）
  - [x] SubTask 2.2: `routes/course.ts` — GET /api/courses（支持 hot/category/page/size）、GET /api/courses/:id、GET /api/categories、GET /api/courses/:courseId/lessons
  - [x] SubTask 2.3: `routes/instructor.ts` — GET /api/instructors、GET /api/instructors/:id
  - [x] SubTask 2.4: `routes/lesson.ts` — GET /api/lessons、GET /api/lessons/:id
  - [x] SubTask 2.5: `routes/review.ts` — GET /api/reviews（支持可选 course_id）
  - [x] SubTask 2.6: `routes/profile.ts` 中的 GET /api/help-articles（公开）

- [x] Task 3: 实现需认证接口路由
  - [x] SubTask 3.1: `routes/lesson.ts` 补充 POST /api/lessons/:lessonId/progress（UPSERT lesson_progress + 更新 user_courses + INSERT study_records + 完成时颁发 certificates）
  - [x] SubTask 3.2: `routes/user.ts` — GET /api/user、GET /api/user/learning/summary、GET /api/user/courses
  - [x] SubTask 3.3: `routes/favorite.ts` — POST /api/favorites（toggle）、GET /api/favorites/check、GET /api/favorites
  - [x] SubTask 3.4: `routes/follow.ts` — POST /api/follows（toggle）、GET /api/follows/check、GET /api/follows
  - [x] SubTask 3.5: `routes/order.ts` — POST /api/orders（创建即已支付 + 插入 user_courses + 更新 users.bought_courses）、GET /api/orders、GET /api/orders/:id
  - [x] SubTask 3.6: `routes/profile.ts` — GET /api/coupons、GET /api/invitations、GET /api/certificates、GET /api/study-records、POST /api/feedbacks

## 阶段三：Seed 脚本

- [x] Task 4: 实现 seed 脚本
  - [x] SubTask 4.1: 创建 `server/src/seed.ts`，TRUNCATE 所有表（外键逆序）
  - [x] SubTask 4.2: 插入 mock 用户（openid=mock_openhead_demo）、instructors、categories
  - [x] SubTask 4.3: 插入 courses（含 instructor_id 关联）+ course_categories（基于 tags 映射到 category code）
  - [x] SubTask 4.4: 插入 lessons（关联 course_id）、reviews（关联 course_id + user_id）

## 阶段四：前端接入接口

- [x] Task 5: 改造前端 services 与配置
  - [x] SubTask 5.1: `src/services/request.ts` 新增 BASE_URL 常量并拼接到 url 前
  - [x] SubTask 5.2: `src/services/review.ts` API 分支接入 request<T>
  - [x] SubTask 5.3: `src/services/instructor.ts` API 分支接入 request<T>
  - [x] SubTask 5.4: `src/services/user.ts` API 分支接入 request<T>（含 menuGroups 保留本地导出）
  - [x] SubTask 5.5: `src/services/config.ts` 将 useLocal 改为 false

## 阶段五：联调验证

- [x] Task 6: 端到端联调验证
  - [x] SubTask 6.1: 后端 `npm install` 与 `tsc --noEmit` 编译通过
  - [x] SubTask 6.2: 前端 `tsc --noEmit` 编译通过
  - [x] SubTask 6.3: 确认所有前端 service 调用的 URL 都有对应后端路由
  - [x] SubTask 6.4: 确认响应格式统一为 { code, data, message }

# Task Dependencies
- Task 2 依赖 Task 1（路由文件需引用骨架的 db/auth/utils）
- Task 3 依赖 Task 1
- Task 4 依赖 Task 1（seed 需引用 db 连接）
- Task 5 独立于后端，可与 Task 2-4 并行
- Task 6 依赖 Task 2、3、4、5 全部完成
