# GEO 课程端到端流程验证 - The Implementation Plan (Decomposed and Prioritized Task List)

## [ ] Task 1: 首页流程验证（Banner、课程、讲师跳转）
- **Priority**: high
- **Depends On**: None
- **Description**: 
  - 验证首页所有跳转目标路径正确性
  - 验证 Banner 点击跳转逻辑（课程跳转、页面跳转）
  - 验证课程卡片跳转到课程详情
  - 验证讲师卡片跳转到讲师详情
  - 验证"查看全部"跳转到列表页
- **Acceptance Criteria Addressed**: AC-1, AC-7
- **Test Requirements**:
  - `programmatic` TR-1.1: Banner linkType=course 时跳转路径为 /pages/course-detail/index?id=xxx
  - `programmatic` TR-1.2: Banner linkType=page 时 TabBar 页面用 switchTab，其他用 navigateTo
  - `programmatic` TR-1.3: 课程卡片点击跳转路径正确，带 courseId 参数
  - `programmatic` TR-1.4: 讲师卡片点击跳转路径正确，带讲师 id 参数
  - `human-judgement` TR-1.5: 首页所有 API（getAllCourses、getCategories、getInstructors、getBanners）正常返回
- **Notes**: 检查 pages/index/index.tsx 中的所有跳转逻辑

## [ ] Task 2: 课程浏览流程验证（列表→详情→播放）
- **Priority**: high
- **Depends On**: None
- **Description**: 
  - 验证课程列表 → 课程详情 → 课时播放的完整链路
  - 验证分类筛选、搜索功能
  - 验证 courseId、lessonId 参数传递
  - 验证各页面 API 接口调用
- **Acceptance Criteria Addressed**: AC-2, AC-7
- **Test Requirements**:
  - `programmatic` TR-2.1: 课程列表页 API（getCategories、getAllCourses、getCoursesByCategory）正常
  - `programmatic` TR-2.2: 课程列表 → 详情跳转路径为 /pages/course-detail/index?id=xxx
  - `programmatic` TR-2.3: 课程详情页 API（getCourseById、getLessons、getReviews、getCourseAccess）正常
  - `programmatic` TR-2.4: 详情 → 播放页跳转带 courseId 和 lessonId 参数
  - `programmatic` TR-2.5: 播放页 API（getLessonById、getLessonPlayUrl、getLessonContent）正常
  - `human-judgement` TR-2.6: 上一课/下一课切换逻辑正确
- **Notes**: 这是核心用户流程，需重点验证

## [ ] Task 3: 讲师流程验证（列表→详情）
- **Priority**: medium
- **Depends On**: None
- **Description**: 
  - 验证讲师列表 → 讲师详情链路
  - 验证讲师详情页数据加载
- **Acceptance Criteria Addressed**: AC-3, AC-7
- **Test Requirements**:
  - `programmatic` TR-3.1: 讲师列表页 getInstructors 接口正常
  - `programmatic` TR-3.2: 列表 → 详情跳转路径为 /pages/instructor-detail/index?id=xxx
  - `programmatic` TR-3.3: 讲师详情页 getInstructorById 接口正常
- **Notes**: 检查讲师详情页是否存在

## [ ] Task 4: 个人中心流程验证（各菜单跳转）
- **Priority**: high
- **Depends On**: None
- **Description**: 
  - 验证个人中心所有菜单项跳转
  - 验证用户信息加载
  - 验证每个子页面的 API 调用
- **Acceptance Criteria Addressed**: AC-4, AC-7
- **Test Requirements**:
  - `programmatic` TR-4.1: 个人中心 getUser 接口正常
  - `programmatic` TR-4.2: 所有菜单项跳转路径全部正确（12+ 个菜单）
  - `programmatic` TR-4.3: 学习记录页 getStudyRecords 接口正常
  - `programmatic` TR-4.4: 收藏页 getMyFavorites 接口正常
  - `programmatic` TR-4.5: 订单页 getOrders 接口正常
  - `programmatic` TR-4.6: 优惠券/证书/邀请等页面接口正常
  - `human-judgement` TR-4.7: 设置页、帮助页、反馈页等静态页面正常
- **Notes**: 菜单数量多，需逐一核对每个跳转路径

## [ ] Task 5: 学习页面流程验证
- **Priority**: medium
- **Depends On**: None
- **Description**: 
  - 验证学习 Tab 页数据加载
  - 验证继续学习跳转
  - 验证我的课程列表
- **Acceptance Criteria Addressed**: AC-5, AC-7
- **Test Requirements**:
  - `programmatic` TR-5.1: 学习页 getLearningSummary、getMyCourses 接口正常
  - `programmatic` TR-5.2: 继续学习按钮跳转路径正确
  - `programmatic` TR-5.3: 课程卡片点击跳转到播放页
- **Notes**: 检查 pages/learning/index.tsx

## [ ] Task 6: 购买/微信小店流程验证
- **Priority**: medium
- **Depends On**: None
- **Description**: 
  - 验证课程详情页购买按钮逻辑
  - 验证播放页无权限时的购买引导
  - 验证微信小店配置获取
  - 验证商品映射获取
- **Acceptance Criteria Addressed**: AC-6, AC-7
- **Test Requirements**:
  - `programmatic` TR-6.1: fetchWxshopConfig 接口正常返回 appid
  - `programmatic` TR-6.2: getWxshopProduct 接口正常返回 productId
  - `programmatic` TR-6.3: 已配置商品映射时显示微信小店组件
  - `programmatic` TR-6.4: 未配置时显示"暂未上架"提示
  - `human-judgement` TR-6.5: store-product 组件使用正确
- **Notes**: 微信小店组件需要微信开发者工具才能完整验证

## [ ] Task 7: 问题修复与回归验证
- **Priority**: high
- **Depends On**: Task 1, Task 2, Task 3, Task 4, Task 5, Task 6
- **Description**: 
  - 收集前面步骤发现的所有流程断裂问题
  - 逐一修复跳转路径错误、接口调用错误、参数传递错误
  - 回归验证修复效果
- **Acceptance Criteria Addressed**: AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7
- **Test Requirements**:
  - `programmatic` TR-7.1: 所有发现的问题均已修复
  - `programmatic` TR-7.2: 修复后相关流程可正常串联
  - `human-judgement` TR-7.3: 修复方案合理，未引入新问题
- **Notes**: 最小化改动，不修改业务逻辑
