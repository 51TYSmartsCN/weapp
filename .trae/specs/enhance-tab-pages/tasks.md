# Tasks

## 阶段一：本地 mock 数据与 service 修复（无依赖，可并行）

- [x] Task 1: 新增学习相关 mock 数据
  - [x] SubTask 1.1: 新建 `apps/miniapp/src/data/user-courses.ts`，导出 `myCourses: UserCourse[]`（3-4 条，覆盖学习中/已完成/未开始三种 status，courseId 对应 courses.ts 中的 id）
  - [x] SubTask 1.2: 新建 `apps/miniapp/src/data/study-records.ts`，导出 `studyRecords: StudyRecord[]`（4-5 条，courseId/lessonId 对应已有数据，studiedAt 用近期 ISO 字符串）
  - [x] SubTask 1.3: 新建 `apps/miniapp/src/data/certificates.ts`，导出 `certificates: Certificate[]`（2 条，courseId 对应已完成课程）
  - [x] SubTask 1.4: 在 `apps/miniapp/src/data/index.ts` 中 re-export 上述三个数据源

- [x] Task 2: 新增我的页相关 mock 数据
  - [x] SubTask 2.1: 新建 `apps/miniapp/src/data/favorites.ts`，导出 `favorites: Favorite[]`（2-3 条，courseId 对应已有课程）
  - [x] SubTask 2.2: 新建 `apps/miniapp/src/data/orders.ts`，导出 `orders: Order[]`（3 条，覆盖 Paid/Pending/Cancelled 三种 status）
  - [x] SubTask 2.3: 新建 `apps/miniapp/src/data/coupons.ts`，导出 `coupons: Coupon[]`（3 条，覆盖 Unused/Used/Expired 三种 status，含 Discount 与 Rate 两种 type）
  - [x] SubTask 2.4: 新建 `apps/miniapp/src/data/invitations.ts`，导出 `invitationsSummary: InvitationSummary`（invitedCount 3、rewardTotal 60、invitations 3 条）
  - [x] SubTask 2.5: 新建 `apps/miniapp/src/data/help-articles.ts`，导出 `helpArticles: HelpArticle[]`（4-5 条，分 2 个 category）
  - [x] SubTask 2.6: 在 `apps/miniapp/src/data/index.ts` 中 re-export 上述五个数据源

- [x] Task 3: 修复 service 本地分支返回真实 mock
  - [x] SubTask 3.1: `services/learning.ts` 的 `getMyCourses` 本地分支改为 `return myCourses`（import 自 data），`getLearningSummary` 的 myCourses 字段改用 `myCourses` 数据
  - [x] SubTask 3.2: `services/favorite.ts` 的 `getMyFavorites` 本地分支改为 `return favorites`
  - [x] SubTask 3.3: `services/order.ts` 的 `getOrders` 本地分支改为 `return orders`
  - [x] SubTask 3.4: `services/profile.ts` 的 `getCoupons`/`getCertificates`/`getStudyRecords`/`getInvitations`/`getHelpArticles` 本地分支改为返回对应 mock 数据

## 阶段二：三个 Tab 页增强（依赖阶段一的 mock 数据）

- [x] Task 4: 课程页（course-list）搜索 + 排序 + 空状态 + 计数
  - [x] SubTask 4.1: 顶部新增 `SearchBar`，value 受控，按 title/instructor/tags 过滤 courses
  - [x] SubTask 4.2: 筛选按钮改为打开排序 ActionSheet（综合/最新/价格升序/价格降序/评分），选中后对 courses 排序并显示当前排序文案
  - [x] SubTask 4.3: 左侧分类标签显示该分类课程数量（如「GEO 入门 2」）
  - [x] SubTask 4.4: 列表为空时显示空状态（Icon + 提示文案）
  - [x] SubTask 4.5: 移除底部「加载更多」按钮，改用页面级 `onReachBottom` + `useState(visibleCount)` 分页，到底提示「没有更多了」
  - [x] SubTask 4.6: 同步更新 `index.scss`（搜索栏、排序文案、空状态、计数样式）

- [x] Task 5: 学习页（learning）服务接入 + 状态 Tab + 学习记录 + 证书入口
  - [x] SubTask 5.1: useEffect 改为调用 `getLearningSummary`，并行调用 `getCertificates`、`getStudyRecords`
  - [x] SubTask 5.2: 「我的课程」改用 summary.myCourses，渲染课程封面/标题/进度，点击跳 course-detail
  - [x] SubTask 5.3: 「我的课程」上方新增状态 Tab（全部/学习中/已完成/未开始），按 `UserCourse.status` 过滤
  - [x] SubTask 5.4: 新增「学习记录」模块，列表展示课程名 + 课节 + 时长（秒转分）+ 相对时间，空状态
  - [x] SubTask 5.5: 新增「学习证书」入口卡片，显示证书数量 + 「查看全部」跳转 certificates 子页面
  - [x] SubTask 5.6: 同步更新 `index.scss`（状态 Tab、学习记录项、证书入口样式）

- [x] Task 6: 我的页（profile）菜单跳转分发
  - [x] SubTask 6.1: 重写 `handleMenuClick`，按 label 映射跳转：我的课程→switchTab learning；其余→navigateTo 对应子页面
  - [x] SubTask 6.2: 验证所有菜单项均有跳转目标，不再 showToast

## 阶段三：子页面实现（依赖阶段一 mock 数据与 service；可与阶段二并行）

- [x] Task 7: 收藏课程子页面 favorites
  - [x] SubTask 7.1: 新建 `pages/favorites/index.config.ts`、`index.tsx`、`index.scss`
  - [x] SubTask 7.2: 通过 `getMyFavorites` + `getCourseById` 拼装收藏课程列表，复用 `CourseCard`（list 模式）；空状态
- [x] Task 8: 我的订单子页面 orders
  - [x] SubTask 8.1: 新建 `pages/orders/index.*`，通过 `getOrders` 渲染订单列表（订单号 + 课程名 + 金额 + 状态标签 + 时间）；空状态
- [x] Task 9: 优惠券子页面 coupons
  - [x] SubTask 9.1: 新建 `pages/coupons/index.*`，通过 `getCoupons` 渲染优惠券卡片（类型/面额/门槛/有效期/状态）；空状态
- [x] Task 10: 学习证书子页面 certificates
  - [x] SubTask 10.1: 新建 `pages/certificates/index.*`，通过 `getCertificates` + `getCourseById` 渲染证书卡片（证书号 + 课程名 + 颁发时间）；空状态
- [x] Task 11: 学习记录子页面 study-records
  - [x] SubTask 11.1: 新建 `pages/study-records/index.*`，通过 `getStudyRecords` + `getCourseById` 渲染学习记录列表（课程名 + 课节 + 时长 + 时间）；空状态
- [x] Task 12: 邀请好友子页面 invitations
  - [x] SubTask 12.1: 新建 `pages/invitations/index.*`，通过 `getInvitations` 渲染汇总卡片（邀请数 + 奖励总额）+ 邀请记录列表；空状态
- [x] Task 13: 帮助中心子页面 help
  - [x] SubTask 13.1: 新建 `pages/help/index.*`，通过 `getHelpArticles` 渲染文章列表（按 category 分组或排序），点击展开内容；空状态
- [x] Task 14: 意见反馈子页面 feedback
  - [x] SubTask 14.1: 新建 `pages/feedback/index.*`，表单含 类型选择 + 内容多行输入 + 联系方式，提交调用 `createFeedback`，成功后 toast 并返回
- [x] Task 15: 设置子页面 settings
  - [x] SubTask 15.1: 新建 `pages/settings/index.*`，使用 MenuItem 列出 消息通知/清除缓存/关于我们 等基础项，点击 toast；底部保留退出登录入口

## 阶段四：路由注册与收尾

- [x] Task 16: 注册新页面路由
  - [x] SubTask 16.1: 在 `apps/miniapp/src/app.config.ts` 的 pages 数组注册 favorites/orders/coupons/certificates/study-records/invitations/help/feedback/settings 九个新页面
- [x] Task 17: 类型与编译校验
  - [x] SubTask 17.1: 运行 `pnpm --filter @geo/miniapp build`（或 tsc）确认无类型错误
  - [x] SubTask 17.2: 检查所有新页面/数据/service 遵循 AGENTS.md 约束（Taro 组件、rpx、@use、不直接 import data 于页面）

# Task Dependencies
- Task 4、5、6 依赖 Task 1、2、3（mock 数据与 service 修复）
- Task 7-15 依赖 Task 1、2、3（mock 数据与 service 修复）
- Task 7-15 与 Task 4、5、6 可并行
- Task 16 依赖 Task 7-15（页面文件存在后再注册）
- Task 17 依赖全部前置任务
