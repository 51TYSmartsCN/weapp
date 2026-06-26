# GEO 课程项目数据库表设计 Spec

## Why
当前项目所有数据均为前端本地静态数据（`src/data/`），无法承载真实业务。为支撑后端 API 对接（即把 `services/config.ts` 中 `useLocal` 切换为 `false`），需要一套覆盖现有 6 个页面核心功能的数据库表结构，以及与之配套的接口操作流程，使每一项用户行为（浏览、收藏、关注、报名、学习、评价等）都有明确的存储位置和读写路径。

## 范围说明
**仅覆盖现有 6 个页面已经体现的核心功能**，暂不开发：支付回调细节、消息推送、后台管理、积分体系、推荐算法等扩展能力。菜单配置（`menuGroups`）维持前端静态配置，不入库。

## What Changes
- 新增 16 张数据库表，覆盖：用户、讲师、课程、分类、课时、评价、用户-课程关系、课时进度、收藏、关注、订单、优惠券、邀请、证书、学习记录、意见反馈、帮助文章
- 明确每张表的字段、类型、约束、索引
- 明确前端 `services/` 已有 / 待新增接口与表的关系
- 给出每个核心用户操作的完整调用链路（前端 → service → API → 表）

## Impact
- Affected specs: 数据源切换机制（`services/config.ts`）、service 层契约
- Affected code: `src/services/*`（取消 TODO 注释并补全新接口）、`src/types/index.ts`（补充订单/优惠券/进度等类型）、`src/data/*`（保留作为 mock 参考）

---

## ADDED Requirements

### Requirement: 用户表（users）
系统 SHALL 提供 `users` 表存储微信小程序用户基本信息与学习汇总。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 用户 ID |
| openid | VARCHAR(64) | UNIQUE, NOT NULL | 微信 openid |
| unionid | VARCHAR(64) | NULL | 微信 unionid（可选） |
| name | VARCHAR(64) | NOT NULL | 昵称 |
| avatar | VARCHAR(32) | NOT NULL | 头像文字（如"李"）或 URL |
| vip | TINYINT(1) | DEFAULT 0 | 是否 VIP |
| vip_expire_at | DATETIME | NULL | VIP 到期时间 |
| bought_courses | INT | DEFAULT 0 | 已购课程数（冗余字段） |
| finished_lessons | INT | DEFAULT 0 | 已完成课时数（冗余字段） |
| study_hours | INT | DEFAULT 0 | 累计学习时长（小时） |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |
| updated_at | DATETIME | ON UPDATE CURRENT_TIMESTAMP | |

索引：`uk_openid`、`idx_vip`

#### Scenario: 用户首次登录
- **WHEN** 微信小程序调用 `wx.login` 拿到 code
- **THEN** 后端通过 code 换取 openid，若 `users` 表不存在则插入新行，返回 user_id 与 token

---

### Requirement: 讲师表（instructors）
系统 SHALL 提供 `instructors` 表存储讲师信息。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | |
| name | VARCHAR(64) | NOT NULL | 姓名 |
| title | VARCHAR(64) | NOT NULL | 头衔（如"GEO 优化专家"） |
| service | VARCHAR(128) | NOT NULL | 服务说明（如"已服务 500+ 企业"） |
| bio | TEXT | NULL | 简介（课程详情页用） |
| color | VARCHAR(16) | NOT NULL | 头像背景色 |
| avatar | VARCHAR(32) | NULL | 头像文字 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |

索引：无额外

---

### Requirement: 课程表（courses）
系统 SHALL 提供 `courses` 表存储课程基本信息，并通过外键关联讲师。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | |
| title | VARCHAR(128) | NOT NULL | 课程标题 |
| desc | VARCHAR(256) | NOT NULL | 简短描述 |
| instructor_id | BIGINT | NOT NULL, FK→instructors.id | 讲师 |
| rating | DECIMAL(2,1) | DEFAULT 0.0 | 评分 |
| students | INT | DEFAULT 0 | 学习人数 |
| price | DECIMAL(10,2) | NOT NULL | 现价 |
| original_price | DECIMAL(10,2) | NULL | 原价 |
| cover | VARCHAR(256) | NOT NULL | 封面（CSS 渐变或图片 URL） |
| is_hot | TINYINT(1) | DEFAULT 0 | 是否热门（首页 hot 区） |
| status | TINYINT(1) | DEFAULT 1 | 上下架 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |
| updated_at | DATETIME | ON UPDATE CURRENT_TIMESTAMP | |

索引：`idx_instructor_id`、`idx_is_hot`、`idx_status`

---

### Requirement: 分类表（categories）与 课程-分类关联表（course_categories）
系统 SHALL 提供 `categories` 表存储分类枚举，并提供 `course_categories` 多对多关联表（对应前端 `tags`）。

**categories**

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK | |
| code | VARCHAR(32) | UNIQUE, NOT NULL | 枚举值（如 `geo-intro`） |
| name | VARCHAR(32) | NOT NULL | 显示名（如"GEO入门"） |
| sort | INT | DEFAULT 0 | 排序 |

**course_categories**

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK | |
| course_id | BIGINT | FK→courses.id, CASCADE | |
| category_id | BIGINT | FK→categories.id, CASCADE | |

索引：`uk_course_category (course_id, category_id)`、`idx_category_id`

#### Scenario: 按分类筛选课程
- **WHEN** 前端调用 `getCoursesByCategory('geo-intro')`
- **THEN** 后端 `JOIN course_categories + categories + courses` 按 `code` 过滤返回

---

### Requirement: 课时表（lessons）
系统 SHALL 提供 `lessons` 表存储课程大纲，通过 `course_id` 关联课程。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK | |
| course_id | BIGINT | NOT NULL, FK→courses.id, CASCADE | |
| title | VARCHAR(128) | NOT NULL | |
| duration | VARCHAR(16) | NOT NULL | 形如"15min" |
| duration_seconds | INT | NULL | 实际秒数（用于进度计算） |
| video_url | VARCHAR(512) | NULL | 视频 URL |
| sort | INT | DEFAULT 0 | 排序 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |

索引：`idx_course_id_sort (course_id, sort)`

---

### Requirement: 评价表（reviews）
系统 SHALL 提供 `reviews` 表存储学员对课程的评价，关联课程与用户。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK | |
| course_id | BIGINT | NOT NULL, FK→courses.id | |
| user_id | BIGINT | NOT NULL, FK→users.id | |
| name | VARCHAR(64) | NOT NULL | 显示用昵称（冗余） |
| rating | TINYINT | NOT NULL | 1-5 |
| content | TEXT | NOT NULL | |
| date | DATE | NOT NULL | 显示日期 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |

索引：`idx_course_id_created (course_id, created_at DESC)`

---

### Requirement: 用户-课程关系表（user_courses）
系统 SHALL 提供 `user_courses` 表存储用户购买/学习状态，对应学习中心"我的课程"与"继续学习"。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK | |
| user_id | BIGINT | NOT NULL, FK→users.id | |
| course_id | BIGINT | NOT NULL, FK→courses.id | |
| status | TINYINT | NOT NULL | 0=已购未学 1=学习中 2=已完成 |
| progress | INT | DEFAULT 0 | 进度百分比 0-100 |
| completed_lessons | INT | DEFAULT 0 | 已完成课时数 |
| total_lessons | INT | DEFAULT 0 | 课程总课时数 |
| last_study_at | DATETIME | NULL | 最后学习时间 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 购买时间 |
| updated_at | DATETIME | ON UPDATE CURRENT_TIMESTAMP | |

索引：`uk_user_course (user_id, course_id)`、`idx_user_last_study (user_id, last_study_at DESC)`

#### Scenario: 学习中心首页
- **WHEN** 用户进入学习中心
- **THEN** 后端按 `last_study_at DESC` 取第一条作为"继续学习"，取所有 `status IN (0,1,2)` 作为"我的课程"

---

### Requirement: 课时进度表（lesson_progress）
系统 SHALL 提供 `lesson_progress` 表记录单课时学习状态，用于大纲打勾与播放页切换。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK | |
| user_id | BIGINT | NOT NULL, FK→users.id | |
| lesson_id | BIGINT | NOT NULL, FK→lessons.id | |
| course_id | BIGINT | NOT NULL, FK→courses.id | |
| completed | TINYINT(1) | DEFAULT 0 | 是否完成 |
| watched_seconds | INT | DEFAULT 0 | 已观看秒数 |
| last_position | INT | DEFAULT 0 | 上次断点（秒） |
| updated_at | DATETIME | ON UPDATE CURRENT_TIMESTAMP | |

索引：`uk_user_lesson (user_id, lesson_id)`、`idx_user_course (user_id, course_id)`

---

### Requirement: 收藏表（favorites）与 关注表（follows）
系统 SHALL 提供 `favorites` 记录用户收藏的课程，`follows` 记录用户关注的讲师。

**favorites**

| 字段 | 类型 | 约束 |
|------|------|------|
| id | BIGINT | PK |
| user_id | BIGINT | FK→users.id |
| course_id | BIGINT | FK→courses.id |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP |

索引：`uk_user_course (user_id, course_id)`

**follows**

| 字段 | 类型 | 约束 |
|------|------|------|
| id | BIGINT | PK |
| user_id | BIGINT | FK→users.id |
| instructor_id | BIGINT | FK→instructors.id |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP |

索引：`uk_user_instructor (user_id, instructor_id)`

#### Scenario: 课程详情页收藏
- **WHEN** 用户点击收藏按钮
- **THEN** 前端 `POST /api/favorites` 携带 `course_id`，后端 INSERT；再次点击 `DELETE /api/favorites/{course_id}` 删除

---

### Requirement: 订单表（orders）
系统 SHALL 提供 `orders` 表存储报名/购买记录，对应课程详情"立即报名"与个人中心"我的订单"。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK | |
| order_no | VARCHAR(32) | UNIQUE, NOT NULL | 订单号 |
| user_id | BIGINT | NOT NULL, FK→users.id | |
| course_id | BIGINT | NOT NULL, FK→courses.id | |
| amount | DECIMAL(10,2) | NOT NULL | 实付金额 |
| original_amount | DECIMAL(10,2) | NULL | 原价 |
| coupon_id | BIGINT | NULL, FK→coupons.id | 使用的优惠券 |
| status | TINYINT | NOT NULL | 0=待支付 1=已支付 2=已退款 3=已取消 |
| pay_method | VARCHAR(16) | NULL | wechat |
| paid_at | DATETIME | NULL | |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |

索引：`uk_order_no`、`idx_user_status (user_id, status)`

#### Scenario: 立即报名
- **WHEN** 用户点击"立即报名"
- **THEN** 后端创建 `orders` 行（status=0），支付回调成功后置 status=1 并在 `user_courses` 插入/更新记录

---

### Requirement: 优惠券表（coupons）
系统 SHALL 提供 `coupons` 表存储用户持有的优惠券。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK | |
| user_id | BIGINT | NOT NULL, FK→users.id | |
| code | VARCHAR(32) | NOT NULL | 券码 |
| type | TINYINT | NOT NULL | 1=满减 2=折扣 |
| value | DECIMAL(10,2) | NOT NULL | 减金额或折扣率 |
| min_amount | DECIMAL(10,2) | DEFAULT 0 | 满减门槛 |
| expire_at | DATETIME | NOT NULL | |
| status | TINYINT | NOT NULL | 0=未使用 1=已使用 2=已过期 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |

索引：`idx_user_status (user_id, status)`

---

### Requirement: 邀请记录表（invitations）
系统 SHALL 提供 `invitations` 表存储邀请关系。

| 字段 | 类型 | 约束 |
|------|------|------|
| id | BIGINT | PK |
| inviter_id | BIGINT | FK→users.id |
| invitee_id | BIGINT | FK→users.id |
| reward | DECIMAL(10,2) | DEFAULT 0 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP |

索引：`idx_inviter_id`、`uk_invitee_id`

---

### Requirement: 学习证书表（certificates）
系统 SHALL 提供 `certificates` 表存储课程结业证书。

| 字段 | 类型 | 约束 |
|------|------|------|
| id | BIGINT | PK |
| user_id | BIGINT | FK→users.id |
| course_id | BIGINT | FK→courses.id |
| certificate_no | VARCHAR(32) | UNIQUE, NOT NULL |
| issued_at | DATETIME | DEFAULT CURRENT_TIMESTAMP |

索引：`uk_user_course (user_id, course_id)`

---

### Requirement: 学习记录表（study_records）
系统 SHALL 提供 `study_records` 表存储明细学习日志（用于"学习记录"菜单与统计）。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK | |
| user_id | BIGINT | NOT NULL | |
| course_id | BIGINT | NOT NULL | |
| lesson_id | BIGINT | NOT NULL | |
| duration | INT | DEFAULT 0 | 本次学习秒数 |
| studied_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |

索引：`idx_user_studied (user_id, studied_at DESC)`

---

### Requirement: 意见反馈表（feedbacks）
系统 SHALL 提供 `feedbacks` 表存储用户反馈。

| 字段 | 类型 | 约束 |
|------|------|------|
| id | BIGINT | PK |
| user_id | BIGINT | FK→users.id |
| type | VARCHAR(32) | NOT NULL |
| content | TEXT | NOT NULL |
| contact | VARCHAR(64) | NULL |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP |

---

### Requirement: 帮助文章表（help_articles）
系统 SHALL 提供 `help_articles` 表存储帮助中心文章。

| 字段 | 类型 | 约束 |
|------|------|------|
| id | BIGINT | PK |
| title | VARCHAR(128) | NOT NULL |
| content | TEXT | NOT NULL |
| category | VARCHAR(32) | NOT NULL |
| sort | INT | DEFAULT 0 |

索引：`idx_category_sort (category, sort)`

---

## API 操作流程

### 1. 用户登录
```
小程序 wx.login → code
  → POST /api/auth/login { code }
  → 后端 code2session 拿 openid
  → 查 users，无则 INSERT
  → 签发 token 返回 { token, user }
```

### 2. 首页加载
```
GET /api/courses?hot=1           → courses WHERE is_hot=1
GET /api/categories              → categories ORDER BY sort
GET /api/instructors             → instructors
```

### 3. 课程列表按分类筛选
```
GET /api/courses?category=geo-intro&page=1&size=10
  → JOIN course_categories 过滤
```

### 4. 课程详情
```
GET /api/courses/{id}                  → courses + instructor
GET /api/courses/{id}/lessons          → lessons WHERE course_id
GET /api/courses/{id}/reviews          → reviews WHERE course_id
GET /api/favorites/check?course_id=    → 是否已收藏
GET /api/follows/check?instructor_id=  → 是否已关注
```

### 5. 收藏 / 取消收藏
```
POST   /api/favorites { course_id }   → INSERT favorites
DELETE /api/favorites/{course_id}      → DELETE favorites
```

### 6. 关注 / 取消关注讲师
```
POST   /api/follows { instructor_id }
DELETE /api/follows/{instructor_id}
```

### 7. 报名课程
```
POST /api/orders { course_id, coupon_id? }
  → INSERT orders (status=0)
  → 调微信支付
  → 支付回调
    → UPDATE orders SET status=1, paid_at=NOW()
    → INSERT user_courses (status=0, total_lessons=N)
    → UPDATE users SET bought_courses += 1
```

### 8. 课时播放与进度上报
```
GET /api/lessons/{id}                       → 单课时信息
POST /api/lessons/{id}/progress { watched_seconds, completed, last_position }
  → UPSERT lesson_progress
  → 若 completed: 更新 user_courses.completed_lessons / progress
  → INSERT study_records
  → 若 user_courses.progress=100: status=2，颁发 certificates
```

### 9. 学习中心
```
GET /api/user/learning/summary
  → continueCourse: user_courses ORDER BY last_study_at DESC LIMIT 1
  → myCourses: user_courses WHERE status IN (0,1,2)
  → stats: users.bought_courses / finished_lessons / study_hours
```

### 10. 个人中心菜单
```
GET /api/user                     → 用户信息
GET /api/orders                   → 我的订单
GET /api/coupons                  → 优惠券
GET /api/invitations              → 邀请好友（含统计）
GET /api/certificates             → 学习证书
GET /api/study-records            → 学习记录
POST /api/feedbacks               → 意见反馈
GET /api/help-articles            → 帮助中心
```

## MODIFIED Requirements

### Requirement: services 层契约
现有 `services/*` 中所有 `// TODO: return Taro.request(...)` 占位 SHALL 替换为真实 URL 调用，并通过 `request<T>` 封装统一处理 `code/data/message`。新增的接口（收藏/关注/订单/进度等）SHALL 在对应 service 文件中实现并经 `services/index.ts` re-export。

## REMOVED Requirements
无（不删除任何现有能力，仅从本地静态数据切换为接口数据）。
