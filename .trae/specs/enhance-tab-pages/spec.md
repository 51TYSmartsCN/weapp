# 课程/学习/我的页面完善 Spec

## Why
当前三个 Tab 页面（课程、学习、我的）仅有基础骨架：
- 课程页筛选按钮是占位 toast，无搜索/排序/空状态；
- 学习页用 `getUser + getAllCourses` 拼接数据，未使用已存在的 `getLearningSummary`，且缺少学习记录、证书等模块；
- 我的页所有菜单项仅弹 toast，无真实跳转目标；收藏/订单/优惠券/证书/学习记录等服务本地分支返回空数组，页面无内容可展示。

本次将补齐这些缺失模块，使三个 Tab 页形成完整可用的闭环。

## What Changes
- **课程页（course-list）**：顶部新增搜索栏（按标题/讲师/标签过滤）；筛选按钮改为排序面板（综合/最新/价格升序/价格降序/评分）；分类下显示课程计数；无结果时显示空状态；分页改为页面级 `onReachBottom`。
- **学习页（learning）**：数据源切换为 `getLearningSummary`；「我的课程」增加状态筛选 Tab（全部/学习中/已完成/未开始）；新增「学习记录」模块（使用 `getStudyRecords`）；新增「学习证书」入口预览（使用 `getCertificates`）；各模块补空状态。
- **我的页（profile）**：菜单项接入真实跳转；我的课程 → switchTab 学习页；其余菜单跳转新建子页面。
- **新增本地 mock 数据**：favorites / orders / coupons / certificates / study-records / invitations / help-articles / user-courses，覆盖各服务本地分支返回。
- **新增子页面**（pages/）：favorites、orders、coupons、certificates、study-records、invitations、help、feedback、settings，均使用 NavBar + 列表/表单 + 空状态的最小实现。
- **路由配置**：app.config.ts 注册新增子页面。

## Impact
- Affected specs: design-database-schema（前端消费侧扩展，不改后端契约）
- Affected code:
  - `apps/miniapp/src/pages/course-list/index.tsx` + `index.scss`
  - `apps/miniapp/src/pages/learning/index.tsx` + `index.scss`
  - `apps/miniapp/src/pages/profile/index.tsx`（菜单跳转）
  - `apps/miniapp/src/app.config.ts`（注册新页面）
  - `apps/miniapp/src/data/*`（新增 mock 数据 + index.ts re-export）
  - `apps/miniapp/src/services/*`（learning/profile/favorite/order 等本地分支返回真实 mock）
  - 新增 `apps/miniapp/src/pages/{favorites,orders,coupons,certificates,study-records,invitations,help,feedback,settings}/`

## ADDED Requirements

### Requirement: 课程页搜索
课程页顶部 SHALL 提供搜索栏，输入关键字后按课程标题/讲师/标签实时过滤右侧列表，清空时恢复当前分类全部课程。

#### Scenario: 关键字过滤
- **WHEN** 用户在搜索栏输入「张」
- **THEN** 右侧列表仅显示讲师名或标题或标签含「张」的课程

#### Scenario: 清空恢复
- **WHEN** 搜索栏被清空
- **THEN** 列表恢复为当前选中分类的全部课程

### Requirement: 课程页排序
筛选按钮 SHALL 打开排序面板，提供 综合排序 / 最新 / 价格升序 / 价格降序 / 评分 五个选项，选中后右侧列表按对应规则重排，并在按钮旁显示当前排序。

#### Scenario: 按价格升序
- **WHEN** 用户选择「价格升序」
- **THEN** 列表按 price 从低到高重排，按钮区域显示「价格升序」

### Requirement: 课程页空状态与计数
当分类或搜索结果为空时 SHALL 显示空状态插画与提示文案；每个分类标签 SHALL 显示该分类下课程数量。

### Requirement: 学习页使用学习汇总服务
学习页 SHALL 通过 `getLearningSummary` 获取继续学习、我的课程、统计三类数据，不再拼接 `getUser + getAllCourses`。

### Requirement: 学习页课程状态筛选
「我的课程」模块 SHALL 提供状态 Tab（全部/学习中/已完成/未开始），切换后列表按 `UserCourse.status` 过滤。

### Requirement: 学习页学习记录模块
学习页 SHALL 新增「学习记录」模块，通过 `getStudyRecords` 获取并展示最近学习记录（课程名 + 课节 + 时长 + 时间），支持空状态。

### Requirement: 学习页学习证书入口
学习页 SHALL 新增「学习证书」预览模块，通过 `getCertificates` 获取证书数量并展示入口卡片，点击跳转证书子页面。

### Requirement: 我的页菜单真实跳转
我的页每个菜单项 SHALL 跳转到对应子页面或 Tab：
- 我的课程 → `switchTab` 学习页
- 学习记录 / 收藏课程 / 学习证书 / 我的订单 / 优惠券 / 邀请好友 / 帮助中心 / 意见反馈 / 设置 → `navigateTo` 对应子页面

### Requirement: 子页面最小实现
新增子页面（favorites/orders/coupons/certificates/study-records/invitations/help/feedback/settings）SHALL：
1. 使用 `NavBar` 组件提供标题与返回
2. 通过 `services` 层获取数据，不直接 import `data/`
3. 提供 loading skeleton 与空状态
4. 遵循 Taro 组件 + rpx + SCSS 变量约束

### Requirement: 本地 mock 数据补全
对应服务本地分支 SHALL 返回真实 mock 数据而非空数组，覆盖：favorites、orders、coupons、certificates、study-records、invitations、help-articles、user-courses。

## MODIFIED Requirements

### Requirement: 学习页数据获取
学习页 useEffect 中 SHALL 调用 `getLearningSummary` 单一接口（内部可并行拉取证书与学习记录），不再调用 `getAllCourses` 取前 3 条作为我的课程。

### Requirement: 我的页菜单点击行为
`handleMenuClick` SHALL 按 label 分发跳转，不再统一 `showToast`。

### Requirement: 课程页加载更多
课程页 SHALL 使用页面级 `onReachBottom` 触发分页，移除底部「加载更多」点击按钮。
