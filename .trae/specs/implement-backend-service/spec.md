# 后端服务实现 Spec

## Why
前端 `services/` 层已定义全部 API 契约（约 30 个端点），`db/schema.sql` 已就绪，但目前没有任何后端服务承接这些请求；同时 `review.ts` / `instructor.ts` / `user.ts` 三个旧 service 的 API 分支仍直接返回本地数据，未走 `request<T>`。需要实现一套可运行的 Node.js 后端，并把前端 `useLocal` 切换为 `false`，使所有数据真正从接口获得。

## 范围说明
- 实现 `server/` 目录下的 Node.js + Express + TypeScript 后端
- 覆盖前端 `src/services/*.ts` 中定义的全部 API 端点
- 提供数据库 seed 脚本，将 `src/data/*` 中的静态数据导入 MySQL
- 修复 3 个旧 service（review/instructor/user）使其走 `request<T>`
- 在 `request.ts` 中增加 `BASE_URL` 配置，切换 `useLocal` 为 `false`
- **暂不实现**：真实微信 `code2session`（用 mock openid 替代）、真实微信支付回调（报名直接置为已支付）、文件上传、后台管理

## What Changes
- 新增 `server/` 目录：Express 应用 + 路由 + 中间件 + 数据库连接 + seed 脚本
- 后端响应统一为 `{ code, data, message }`（与前端 `ApiResponse<T>` 契约一致）
- 实现 JWT 认证中间件；登录接口接受 mock code 返回 token
- 实现前端 `src/services/` 已定义的全部 ~30 个端点
- **MODIFIED** `src/services/review.ts`：API 分支接入 `request<T>`
- **MODIFIED** `src/services/instructor.ts`：API 分支接入 `request<T>`
- **MODIFIED** `src/services/user.ts`：API 分支接入 `request<T>`
- **MODIFIED** `src/services/request.ts`：新增 `BASE_URL` 常量并拼接到 `url` 前
- **MODIFIED** `src/services/config.ts`：`useLocal` 改为 `false`
- 新增 `server/package.json`、`server/tsconfig.json`、`server/.env.example`

## Impact
- Affected specs: `design-database-schema`（复用其 schema.sql 与 API 流程定义）
- Affected code: 新增 `server/**`、修改 `src/services/{review,instructor,user,request,config}.ts`
- 新增依赖：express、mysql2、cors、dotenv、jsonwebtoken、typescript、ts-node、@types/*

---

## ADDED Requirements

### Requirement: 后端项目结构
系统 SHALL 在 `server/` 目录下提供独立的 Node.js + Express + TypeScript 后端项目，与前端 Taro 项目共享 `db/schema.sql`。

```
server/
├── package.json           # 独立依赖（express/mysql2/jsonwebtoken/dotenv/cors）
├── tsconfig.json          # Node 18 + ES2020
├── .env.example           # DB_HOST/DB_USER/DB_PASS/DB_NAME/JWT_SECRET/PORT/WECHAT_*
├── src/
│   ├── index.ts           # Express 入口（cors + json + routes + listen）
│   ├── config.ts          # 读取 .env，导出 dbConfig / jwtConfig / wechatConfig
│   ├── db.ts              # mysql2 连接池（promise 版）
│   ├── auth.ts            # JWT 签发与验证中间件
│   ├── utils.ts           # ok(data) / fail(code, msg) 统一响应
│   ├── seed.ts            # 将 src/data/* 导入数据库（可独立运行 npm run seed）
│   └── routes/
│       ├── auth.ts        # POST /api/auth/login
│       ├── course.ts      # /api/courses、/api/categories
│       ├── instructor.ts  # /api/instructors
│       ├── lesson.ts      # /api/lessons、/api/courses/:id/lessons、进度上报
│       ├── review.ts      # /api/reviews
│       ├── user.ts        # /api/user、/api/user/learning/summary、/api/user/courses
│       ├── favorite.ts    # /api/favorites
│       ├── follow.ts      # /api/follows
│       ├── order.ts       # /api/orders
│       └── profile.ts     # /api/coupons、/api/invitations、/api/certificates、/api/study-records、/api/feedbacks、/api/help-articles
```

#### Scenario: 启动后端
- **WHEN** 开发者执行 `cd server && npm install && npm run dev`
- **THEN** 后端在 `http://localhost:3000` 监听，连接 MySQL，所有 `/api/*` 路由可用

---

### Requirement: 统一响应格式
所有 API 响应 SHALL 使用 `{ code: number, data: T, message?: string }` 结构。成功 `code` 为 `0`，业务错误为非零。HTTP 状态码始终为 200（除 401 未授权外），错误信息由 `message` 承载。

#### Scenario: 成功响应
- **WHEN** 任何 GET/POST 成功
- **THEN** 返回 `{ code: 0, data: <结果> }`

#### Scenario: 业务错误
- **WHEN** 资源不存在或参数校验失败
- **THEN** 返回 `{ code: <非零>, message: '<可读提示>' }`，HTTP 200

---

### Requirement: JWT 认证中间件
系统 SHALL 提供 `authMiddleware`，从 `Authorization: Bearer <token>` 解析用户 ID 注入 `req.userId`。除 `/api/auth/login`、`/api/courses`（GET）、`/api/categories`、`/api/instructors`、`/api/lessons`（GET）、`/api/reviews`、`/api/help-articles` 等公开读接口外，所有写接口与个人数据接口 SHALL 受认证保护。

#### Scenario: 登录获取 token
- **WHEN** 前端 `POST /api/auth/login { code }`
- **THEN** 后端用 mock 逻辑将 code 转为 openid（`mock_openid_<code>`），upsert `users` 表，签发 JWT `{ userId, exp }`，返回 `{ token, user }`

#### Scenario: 未携带 token 访问受保护接口
- **WHEN** 请求 `/api/favorites` 未带 Authorization 头
- **THEN** 返回 HTTP 401 + `{ code: 401, message: '未登录' }`

---

### Requirement: 课程与分类接口
系统 SHALL 实现以下端点：

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/courses | 支持 `hot=1`、`category=<code>`、`page`、`size` 查询参数 |
| GET | /api/courses/:id | 返回课程详情（含 instructor 信息） |
| GET | /api/categories | 返回分类列表，按 sort 排序 |
| GET | /api/courses/:courseId/lessons | 返回该课程下的课时列表 |

`hot=1` 时 `WHERE is_hot=1`；`category` 时 `JOIN course_categories + categories` 按 `code` 过滤；分页默认 page=1, size=20。

#### Scenario: 获取热门课程
- **WHEN** `GET /api/courses?hot=1`
- **THEN** 返回 `courses WHERE is_hot=1 AND status=1` 的列表

#### Scenario: 按分类筛选
- **WHEN** `GET /api/courses?category=geo-intro`
- **THEN** 通过 `course_categories JOIN categories WHERE code='geo-intro'` 过滤返回

---

### Requirement: 讲师接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/instructors | 全部讲师 |
| GET | /api/instructors/:id | 单个讲师 |

---

### Requirement: 课时与进度接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/lessons | 全部课时 |
| GET | /api/lessons/:id | 单个课时 |
| POST | /api/lessons/:lessonId/progress | 上报进度（需认证） |

进度上报逻辑：
1. UPSERT `lesson_progress` (user_id, lesson_id)
2. 若 `completed=true`：更新 `user_courses.completed_lessons` 与 `progress`；若 `progress=100` 置 `status=2` 并颁发 `certificates`
3. INSERT `study_records` 一条记录
4. 返回更新后的 `LessonProgress`

---

### Requirement: 评价接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/reviews | 全部评价（支持可选 `course_id` 查询参数过滤） |

---

### Requirement: 用户接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/user | 当前用户信息（需认证） |
| GET | /api/user/learning/summary | 学习中心汇总（需认证） |
| GET | /api/user/courses | 我的课程列表（需认证） |

`/api/user/learning/summary` 返回 `{ continueCourse, myCourses, stats }`，continueCourse 为 `user_courses` 按 `last_study_at DESC` 第一条。

---

### Requirement: 收藏接口（需认证）
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/favorites | body `{ courseId }`，toggle 语义，返回 `true`=已收藏/`false`=已取消 |
| GET | /api/favorites/check | query `course_id`，返回 `boolean` |
| GET | /api/favorites | 当前用户收藏列表 |

---

### Requirement: 关注接口（需认证）
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/follows | body `{ instructorId }`，toggle 语义 |
| GET | /api/follows/check | query `instructor_id`，返回 `boolean` |
| GET | /api/follows | 当前用户关注列表 |

---

### Requirement: 订单接口（需认证）
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/orders | body `{ courseId, couponId? }`，创建订单并直接置为已支付（mock），同时 INSERT `user_courses`，UPDATE `users.bought_courses += 1` |
| GET | /api/orders | 当前用户订单列表 |
| GET | /api/orders/:id | 单个订单 |

---

### Requirement: 个人中心接口（需认证）
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/coupons | 当前用户优惠券 |
| GET | /api/invitations | 邀请汇总 `{ invitedCount, rewardTotal, invitations }` |
| GET | /api/certificates | 当前用户证书 |
| GET | /api/study-records | 当前用户学习记录 |
| POST | /api/feedbacks | body `{ type, content, contact? }` |
| GET | /api/help-articles | 公开，支持 `category` 过滤 |

---

### Requirement: 数据库 Seed 脚本
系统 SHALL 提供 `npm run seed` 脚本，从 `server/src/seed.ts` 执行：
1. 先 `TRUNCATE` 所有表（按外键逆序）
2. 从前端 `src/data/*.ts` 同构数据插入：users(1 条 mock 用户)、instructors、categories、courses、course_categories、lessons、reviews
3. 不插入 user_courses / orders / favorites 等用户行为数据（由前端操作产生）

#### Scenario: 首次 seed
- **WHEN** 执行 `npm run seed`
- **THEN** 数据库被清空并填充初始业务数据，前端切换 `useLocal=false` 后即可正常显示首页、课程列表、详情

---

### Requirement: 前端 BASE_URL 配置
`src/services/request.ts` SHALL 新增 `BASE_URL` 常量（默认 `http://localhost:3000`），在 `Taro.request` 调用时拼接为 `BASE_URL + url`。

#### Scenario: 切换到接口模式
- **WHEN** `apiConfig.useLocal = false`
- **THEN** 所有 service 走 `request<T>`，请求发往 `http://localhost:3000/api/*`

---

## MODIFIED Requirements

### Requirement: 旧 service 接入 request 封装
`src/services/review.ts`、`src/services/instructor.ts`、`src/services/user.ts` 中所有函数的 API 分支 SHALL 使用 `request<T>({ url, method, data })`，与其他 service 保持一致。

### Requirement: 数据源默认切换
`src/services/config.ts` 中 `apiConfig.useLocal` SHALL 改为 `false`，使项目默认走后端接口。

---

## REMOVED Requirements
无。
