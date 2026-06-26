# GEO 课程小程序技术架构文档

## 1. 技术栈
- 框架：Taro 4.x（React）
- 语言：TypeScript
- 样式：SCSS / CSS Modules（全局变量文件统一管理）
- 路由：Taro 默认路由，底部 TabBar 通过 `app.config.ts` 配置
- 状态：当前以组件级 state 与本地静态数据为主
- 图标：内联 SVG / 自定义 Icon 组件（不依赖小程序字体图标）

## 2. 目录结构

```
c:\Users\Administrator\Desktop\mini
├── .trae
│   └── documents              # 产品/技术文档
├── config
│   ├── dev.ts
│   ├── index.ts
│   ├── prod.ts
│   └── index.js               # 默认配置
├── src
│   ├── app.config.ts          # 全局配置、页面路由、TabBar
│   ├── app.scss               # 全局样式、CSS 变量
│   ├── app.ts                 # 应用入口
│   ├── components             # 公共组件
│   │   ├── Avatar
│   │   ├── CourseCard
│   │   ├── InstructorCard
│   │   ├── LessonItem
│   │   ├── MenuItem
│   │   ├── NavBar
│   │   ├── ReviewCard
│   │   ├── SearchBar
│   │   ├── SectionHeader
│   │   ├── StatsCard
│   │   └── TabBar
│   ├── data                   # 静态数据
│   │   ├── courses.ts
│   │   ├── instructors.ts
│   │   ├── menu.ts
│   │   └── reviews.ts
│   ├── pages
│   │   ├── index
│   │   ├── course-list
│   │   ├── course-detail
│   │   └── profile
│   ├── styles
│   │   ├── variables.scss     # 设计变量
│   │   └── mixins.scss        # 常用 mixin
│   └── utils
│       └── index.ts           # 通用工具函数
├── package.json
├── tsconfig.json
└── project.config.json
```

## 3. 路由配置

```ts
pages: [
  'pages/index/index',
  'pages/course-list/index',
  'pages/course-detail/index',
  'pages/profile/index',
]

tabBar: {
  list: [
    { pagePath: 'pages/index/index', text: '首页' },
    { pagePath: 'pages/course-list/index', text: '课程' },
    { pagePath: 'pages/index/index', text: '学习' },  // 临时复用首页
    { pagePath: 'pages/profile/index', text: '我的' },
  ]
}
```

## 4. 核心组件设计

### 4.1 TabBar
- 接收 `active` 索引，渲染 4 个 Tab。
- 点击调用 `Taro.switchTab` 切换。

### 4.2 CourseCard
- Props：`mode: 'grid' | 'list'`，`course: Course`
- 网格模式：封面 + 标题 + 简介 + 评分 + 价格 + 学习人数
- 列表模式：横向布局，标题两行截断，显示讲师名

### 4.3 NavBar
- 用于非 Tab 页面（课程详情），返回按钮调用 `Taro.navigateBack`。

### 4.4 SearchBar / SectionHeader / StatsCard / MenuItem / ReviewCard / LessonItem / Avatar / InstructorCard
- 均通过 Props 接收数据，内部尽量只负责展示。

## 5. 样式策略
- `variables.scss` 统一定义颜色、字号、间距、阴影、圆角。
- `app.scss` 引入变量并设置全局 CSS 变量（用于小程序与 H5）。
- 组件样式使用 SCSS，尺寸使用 `rpx`；在 H5 中 Taro 会自动转换。
- 隐藏滚动条、文本截断、安全区 padding 等作为工具类放在全局。

## 6. 交互实现
- 页面跳转：`Taro.navigateTo` / `Taro.switchTab`
- 轻提示：`Taro.showToast`
- 状态切换：React `useState` 管理收藏、关注、筛选 Tab、搜索关键词
- 加载更多：`useState` 控制 `page` 与 `hasMore`，滚动触底触发 `onReachBottom`

## 7. 多端编译目标
- 微信小程序：`npm run dev:weapp`
- H5：`npm run dev:h5`
- 构建命令：`npm run build:weapp`、`npm run build:h5`

## 8. 扩展建议
- 后续将 `src/data` 替换为 API 请求层。
- 如需全局状态，可引入 Zustand 或 Redux Toolkit。
