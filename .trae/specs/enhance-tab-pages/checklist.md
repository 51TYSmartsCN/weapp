# Checklist

## 阶段一：mock 数据与 service
- [x] `data/user-courses.ts` 导出 myCourses，覆盖三种 UserCourseStatus
- [x] `data/study-records.ts` 导出 studyRecords，courseId/lessonId 对应已有数据
- [x] `data/certificates.ts` 导出 certificates，courseId 对应已完成课程
- [x] `data/favorites.ts` 导出 favorites，courseId 对应已有课程
- [x] `data/orders.ts` 导出 orders，覆盖 Paid/Pending/Cancelled
- [x] `data/coupons.ts` 导出 coupons，覆盖 Unused/Used/Expired 与 Discount/Rate
- [x] `data/invitations.ts` 导出 invitationsSummary（含 invitedCount/rewardTotal/invitations）
- [x] `data/help-articles.ts` 导出 helpArticles，分 2 个 category
- [x] `data/index.ts` re-export 所有新增数据源
- [x] `services/learning.ts` getMyCourses 与 getLearningSummary 本地分支返回真实 mock
- [x] `services/favorite.ts` getMyFavorites 本地分支返回 favorites
- [x] `services/order.ts` getOrders 本地分支返回 orders
- [x] `services/profile.ts` getCoupons/getCertificates/getStudyRecords/getInvitations/getHelpArticles 本地分支返回真实 mock

## 阶段二：Tab 页增强
- [x] 课程页顶部 SearchBar 可按 title/instructor/tags 过滤，清空恢复
- [x] 课程页筛选按钮打开排序面板（综合/最新/价格升序/价格降序/评分），选中后列表重排并显示当前排序
- [x] 课程页左侧分类标签显示课程数量
- [x] 课程页无结果时显示空状态
- [x] 课程页改用 onReachBottom 分页，移除「加载更多」按钮
- [x] 学习页使用 getLearningSummary 获取数据，不再拼接 getUser+getAllCourses
- [x] 学习页「我的课程」有状态 Tab（全部/学习中/已完成/未开始）可过滤
- [x] 学习页新增「学习记录」模块，展示课程/课节/时长/时间，含空状态
- [x] 学习页新增「学习证书」入口卡片，显示数量并可跳转 certificates 子页面
- [x] 我的页菜单项按 label 跳转，不再统一 showToast
- [x] 我的页「我的课程」switchTab 到 learning

## 阶段三：子页面
- [x] favorites 子页面：NavBar + 收藏课程列表（复用 CourseCard）+ 空状态
- [x] orders 子页面：NavBar + 订单列表（订单号/课程/金额/状态/时间）+ 空状态
- [x] coupons 子页面：NavBar + 优惠券卡片（类型/面额/门槛/有效期/状态）+ 空状态
- [x] certificates 子页面：NavBar + 证书卡片（证书号/课程/颁发时间）+ 空状态
- [x] study-records 子页面：NavBar + 学习记录列表（课程/课节/时长/时间）+ 空状态
- [x] invitations 子页面：NavBar + 汇总卡片 + 邀请记录列表 + 空状态
- [x] help 子页面：NavBar + 文章列表（可展开内容）+ 空状态
- [x] feedback 子页面：NavBar + 表单（类型/内容/联系方式）+ 提交调用 createFeedback + 成功返回
- [x] settings 子页面：NavBar + MenuItem 基础项 + 退出登录入口
- [x] 所有子页面通过 services 获取数据，不直接 import data/
- [x] 所有子页面使用 Taro 组件（无 HTML 标签）、rpx、@use SCSS 变量

## 阶段四：路由与校验
- [x] app.config.ts 注册 favorites/orders/coupons/certificates/study-records/invitations/help/feedback/settings
- [x] TypeScript 编译无错误
- [x] 无页面直接 import data/（统一走 services）
- [x] 无 HTML 标签、无 px、无 @import、无第三方 UI 库
