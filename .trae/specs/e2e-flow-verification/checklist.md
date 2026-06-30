# GEO 课程端到端流程验证 - Verification Checklist

## 首页流程
- [ ] Banner 点击跳转逻辑正确（linkType=course / page）
- [ ] 课程卡片点击跳转到课程详情页（带 courseId）
- [ ] 讲师卡片点击跳转到讲师详情页（带 id）
- [ ] "查看全部"课程跳转到课程列表页
- [ ] "查看全部"讲师跳转到讲师列表页
- [ ] 首页 4 个 API 全部正常返回（courses, categories, instructors, banners）

## 课程浏览流程
- [ ] 课程列表页分类切换正常
- [ ] 课程列表页搜索过滤正常
- [ ] 课程列表 → 详情跳转路径正确（/pages/course-detail/index?id=xxx
- [ ] 课程详情页 6 个 API 全部正常（course, lessons, reviews, access, wxshopProduct, wxshopConfig）
- [ ] 课程详情 → 播放页跳转带 courseId 和 lessonId
- [ ] 课时播放页 API 正常（getLessonById, getLessonPlayUrl/content）
- [ ] 上一课/下一课切换功能正常
- [ ] 课时目录展开/收起正常

## 讲师流程
- [ ] 讲师列表页 API 正常（getInstructors）
- [ ] 讲师列表 → 详情跳转路径正确（/pages/instructor-detail/index?id=xxx）
- [ ] 讲师详情页 API 正常（getInstructorById）

## 个人中心流程
- [ ] 个人中心用户信息加载正常（getUser）
- [ ] "我的课程"跳转到学习 Tab 页
- [ ] "学习记录"跳转到 /pages/study-records/index
- [ ] "收藏课程"跳转到 /pages/favorites/index
- [ ] "学习证书"跳转到 /pages/certificates/index
- [ ] "我的订单"跳转到 /pages/orders/index
- [ ] "优惠券"跳转到 /pages/coupons/index
- [ ] "邀请好友"跳转到 /pages/invitations/index
- [ ] "帮助中心"跳转到 /pages/help/index
- [ ] "加企业微信"跳转到 /pages/contact-wx/index
- [ ] "意见反馈"跳转到 /pages/feedback/index
- [ ] "设置"跳转到 /pages/settings/index
- [ ] "编辑资料"跳转到 /pages/edit-profile/index
- [ ] 退出登录功能正常

## 学习页面流程
- [ ] 学习页 API 正常（getLearningSummary, getMyCourses）
- [ ] 继续学习按钮跳转正确
- [ ] 课程卡片点击跳转到播放页

## 购买/微信小店流程
- [ ] 微信小店配置接口正常（fetchWxshopConfig）
- [ ] 商品映射接口正常（getWxshopProduct）
- [ ] 已配置商品时显示微信小店按钮
- [ ] 未配置商品时显示"暂未上架"提示
- [ ] 播放页无权限时显示购买引导
- [ ] store-product 组件属性配置正确

## 整体健康度
- [ ] 所有页面跳转路径正确，无 404
- [ ] 所有 API 接口调用正常
- [ ] 页面间参数传递正确
- [ ] 发现的问题全部修复
- [ ] 修复遵循最小改动原则
