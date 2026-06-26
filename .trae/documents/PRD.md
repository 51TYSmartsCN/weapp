# GEO 课程小程序产品需求文档

## 1. 项目概述
基于提供的设计稿，搭建一款名为 **GEO 课程** 的 Taro 多端小程序/应用。核心定位是面向希望掌握 GEO（生成式引擎优化）知识的学习者，提供课程浏览、详情查看与个人中心功能。

## 2. 页面清单

| 页面 | 路由 | 功能描述 |
|------|------|----------|
| 首页 | `/pages/index/index` | Banner、搜索、课程分类、热门课程、明星讲师、平台数据展示 |
| 课程列表 | `/pages/course-list/index` | 课程筛选、课程列表展示、加载更多 |
| 课程详情 | `/pages/course-detail/index` | 课程封面、基本信息、讲师、课程大纲、学员评价、底部报名 |
| 我的 | `/pages/profile/index` | 用户信息、学习统计、继续学习、菜单列表 |

## 3. 设计系统

### 3.1 颜色
- 主色：`#0D9488`
- 主色浅：`#14B8A6`
- 主色更浅：`#99F6E4`
- 主色最浅：`#F0FDFA`
- 主色深：`#0F766E`
- 主色更深：`#115E59`
- 背景：`#FFFFFF`
- 背景二级：`#F8FAFB`
- 背景三级：`#F1F5F9`
- 文字主色：`#0F172A`
- 文字次色：`#475569`
- 文字辅助：`#94A3B8`
- 反色文字：`#FFFFFF`
- 边框：`#E2E8F0`
- 成功：`#10B981`、警告：`#F59E0B`、错误：`#EF4444`

### 3.2 字体
使用系统默认字体栈：`-apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif`。

### 3.3 字号
- xs: 10px；sm: 12px；base: 14px；md: 16px；lg: 18px；xl: 22px；2xl: 26px

### 3.4 间距与圆角
- 间距：4px、8px、12px、16px、20px、24px
- 圆角：4px、8px、12px、16px、9999px

## 4. 公共组件
- `TabBar`：底部导航，首页/课程/学习/我的
- `NavBar`：顶部导航栏，带返回与分享按钮
- `SearchBar`：搜索输入框
- `SectionHeader`：带“查看全部”的区块标题
- `CourseCard`：课程卡片（网格/列表两种形态）
- `InstructorCard`：讲师卡片
- `StatsCard`：平台数据/用户数据卡片
- `MenuItem`：个人中心菜单项
- `ReviewCard`：评价卡片
- `LessonItem`：课程大纲条目
- `Avatar`：文字头像

## 5. 交互说明
- 底部 TabBar 点击切换页面，当前页高亮主色并加粗文字。
- 首页 Banner 与“立即探索”按钮点击跳转课程列表。
- 课程卡片点击跳转课程详情。
- 课程列表分类可横向滚动；筛选 Tab 点击切换高亮。
- 课程详情页“立即报名”按钮点击弹出 Taro.showToast 提示。
- 收藏/关注按钮点击切换状态并提示。
- 搜索框输入时支持回车触发搜索提示。
- 页面滚动到底部触发“加载更多”。

## 6. 多端适配
- 使用 Taro 跨端能力，默认编译微信小程序与 H5。
- 使用 `rpx` + `Taro.pxTransform` 保证各端尺寸一致。
- 处理安全区：`safe-area-inset-bottom`、`safe-area-inset-top`。
- 底部 TabBar 与详情页底部操作栏预留安全区高度。
- 课程列表在 H5/大屏上可展示两列网格，小程序保持单列。

## 7. 数据说明
当前阶段使用本地静态数据渲染；课程、讲师、评价、菜单均通过循环读取配置数组生成，便于后续接入接口。
