# 微信小程序后端 API 联调与测试说明

本文档给前端同事直接使用，目标是尽快验证后端是否正常、明确哪些接口可以直接调、哪些接口必须在真实小程序登录链路里调，避免联调阻塞。

## 1. 基本信息

- 线上 API Base URL：`https://ty-server-api.tysmarts.cn`
- 健康检查：`GET /api/health`
- 当前线上已确认的公开数据基线：
  - 课程：至少 `6` 条
  - Banner：至少 `2` 条
  - 讲师：至少 `3` 条
- 当前线上帮助文章：
  - `GET /api/help-articles` 正常返回 `code=0`
  - 当前数据可能为空数组 `[]`

当前公开接口返回的图片 URL 已统一为正式域名：

- `https://ty-server-api.tysmarts.cn/images/...`

## 2. 先做这 4 个快速检查

### 2.1 健康检查

```bash
curl -i https://ty-server-api.tysmarts.cn/api/health
```

预期：

```json
{"code":0,"data":{"status":"ok"}}
```

### 2.2 Banner 列表

```bash
curl -s https://ty-server-api.tysmarts.cn/api/banners
```

预期：

- `code=0`
- 至少返回 `2` 条数据
- `image` 字段应为 `https://ty-server-api.tysmarts.cn/images/...`

### 2.3 课程列表

```bash
curl -s https://ty-server-api.tysmarts.cn/api/courses
```

预期：

- `code=0`
- 当前应至少返回 `6` 条课程
- `cover` 字段应为 `https://ty-server-api.tysmarts.cn/images/...`

### 2.4 管理后台未登录校验

```bash
curl -i https://ty-server-api.tysmarts.cn/api/admin/dashboard
```

预期：

- HTTP 状态码：`401`
- 响应体包含：`{"code":401,"message":"未登录"}`

这一步用于确认 admin 保护已经生效，普通请求不会误进后台接口。

### 2.5 部署后自动化验收

仓库内提供了一条真实线上验收测试：

```bash
node --test apps/server/test/live-api-contract.test.cjs
```

用途：

- 部署完成后，按本文档约定逐项校验线上接口
- 自动验证公开接口、后台未登录保护、后台登录与 dashboard
- 避免只看 `api/health` 就误判发布成功

依赖：

- 根目录 `.env` 里需要提供以下本地测试配置（只供本机验收使用，不提交仓库）：

```ini
live_api_base_url=https://ty-server-api.tysmarts.cn
live_api_admin_username=你的线上管理员账号
live_api_admin_password=你的线上管理员密码
```

## 3. 前端最先可用的公开接口

这些接口不需要登录，可以直接在浏览器插件、Postman、curl、前端页面里先接：

### 3.1 获取 Banner

- `GET /api/banners`

### 3.2 获取课程列表

- `GET /api/courses`
- `GET /api/courses?hot=1`
- `GET /api/courses?category=content-optimization`

### 3.3 获取课程详情

- `GET /api/courses/:id`

示例：

```bash
curl -s https://ty-server-api.tysmarts.cn/api/courses/1
```

### 3.4 获取分类

- `GET /api/categories`

### 3.5 获取课程大纲

- `GET /api/courses/:courseId/lessons`

注意：

- 这个接口不返回 `videoUrl`
- 播放地址要走受保护接口 `GET /api/lessons/:id/play`

### 3.6 获取帮助文章

- `GET /api/help-articles`
- `GET /api/help-articles?category=...`

## 4. 小程序登录后的接口

这些接口依赖小程序真实登录态，建议在微信开发者工具或真机里测，不要只在普通浏览器里测。

### 4.1 登录

- `POST /api/auth/login`

请求体：

```json
{
  "code": "<wx.login() 返回的 code>"
}
```

说明：

- 线上环境已经关闭 mock 登录
- 这里必须传真实的 `wx.login()` code
- 不能用随便写的字符串伪造

返回：

```json
{
  "code": 0,
  "data": {
    "token": "<jwt>",
    "user": {
      "id": 1,
      "name": "微信用户",
      "avatar": "https://ty-server-api.tysmarts.cn/images/avatars/default.png"
    }
  }
}
```

### 4.2 之后所有受保护接口都要带 Header

```http
Authorization: Bearer <token>
```

### 4.3 当前可联调的用户态接口

- `GET /api/user`
- `GET /api/user/learning/summary`
- `GET /api/user/courses`
- `POST /api/auth/logout`
- `POST /api/auth/profile`
- `GET /api/coupons`
- `GET /api/invitations`
- `GET /api/certificates`
- `GET /api/study-records`
- `POST /api/feedbacks`

## 5. 课程学习相关接口

### 5.1 获取课时详情

- `GET /api/lessons/:id`

### 5.2 获取播放地址

- `GET /api/lessons/:id/play`

说明：

- 必须登录
- 免费课或开放课可直接返回视频地址
- 付费课要求该用户已购
- 当前线上种子数据里的课程默认都需要权限

### 5.3 上报学习进度

- `POST /api/lessons/:lessonId/progress`

请求体：

```json
{
  "watchedSeconds": 120,
  "completed": false,
  "lastPosition": 120
}
```

## 6. 订单接口说明

### 6.1 创建订单

- `POST /api/orders`

请求体：

```json
{
  "courseId": 1
}
```

### 6.2 查询订单

- `GET /api/orders`
- `GET /api/orders/:id`

重要说明：

- 当前 `POST /api/orders` 是 mock 已支付逻辑
- 调用后会直接写库，并给当前用户开通课程
- 前端联调时可以用它验证“购课后可播放”的链路
- 但不要在页面初始化或误触逻辑里自动调它

## 7. Admin 联调方式

### 7.1 登录

- `POST /api/admin/login`

请求体：

```json
{
  "username": "<管理员账号>",
  "password": "<管理员密码>"
}
```

说明：

- 线上真实账号密码不要写进前端仓库
- 需要时找后端/运维单独拿

### 7.2 登录成功后拿 token 调后台接口

Header：

```http
Authorization: Bearer <admin-token>
```

### 7.3 最先验证的后台接口

- `GET /api/admin/dashboard`

当前线上种子数据预期：

```json
{
  "code": 0,
  "data": {
    "totalCourses": 6,
    "totalUsers": 5,
    "totalOrders": 0,
    "totalInstructors": 3,
    "totalRevenue": 0,
    "todayOrders": 0
  }
}
```

## 8. CORS 与调试方式

需要区分两种情况：

### 8.1 微信小程序请求

- 小程序请求不走浏览器 CORS 这一套
- 重点是微信后台要把 `https://ty-server-api.tysmarts.cn` 配成合法 request 域名

### 8.2 浏览器本地调试

- 浏览器跨域请求会受 `CORS_ORIGINS` 限制
- 如果你在本地 `http://localhost:xxxx` 直接调线上 API，可能被拦截
- 这时优先用：
  - Postman
  - curl
  - 微信开发者工具
- 如果确实需要浏览器直连，再找后端加白你的实际 Origin

## 9. 建议前端联调顺序

建议按这个顺序，不容易卡住：

1. `GET /api/health`
2. `GET /api/banners`
3. `GET /api/courses`
4. `GET /api/courses/:id`
5. `GET /api/courses/:id/lessons`
6. 小程序里走 `wx.login()` → `POST /api/auth/login`
7. 带 token 调 `GET /api/user`
8. 带 token 调 `POST /api/orders`
9. 带 token 调 `GET /api/lessons/:id/play`
10. 带 token 调 `POST /api/lessons/:lessonId/progress`

## 10. 现阶段已确认可用的线上事实

截至当前部署状态，已确认：

- `https://ty-server-api.tysmarts.cn/api/health` 正常
- 公开课程接口正常
- Banner 接口正常
- 图片 URL 使用正式域名
- Admin 登录链路正常
- Admin 未登录保护正常
- `GET /api/help-articles` 正常，但当前可能返回空数组
- `GET /api/lessons/:id/play`、`GET /api/user`、`GET /api/orders` 未登录时返回 `401`

## 11. 部署后建议验收顺序

建议每次发布后按下面顺序做，不要只看健康检查：

1. `curl https://ty-server-api.tysmarts.cn/api/health`
2. `curl https://ty-server-api.tysmarts.cn/api/banners`
3. `curl https://ty-server-api.tysmarts.cn/api/courses`
4. `curl -i https://ty-server-api.tysmarts.cn/api/admin/dashboard`
5. `node --test apps/server/test/live-api-contract.test.cjs`

## 12. 如果前端遇到问题，先带上这几项信息

反馈时请尽量一起带：

- 请求 URL
- 请求方法
- 请求头里是否带了 `Authorization`
- 请求体
- 返回的 HTTP 状态码
- 返回 body
- 是在小程序里、微信开发者工具里、浏览器里还是 Postman 里调的

这样定位会快很多。
