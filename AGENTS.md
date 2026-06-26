# AGENTS.md — GEO 课程项目约束

## 项目概览

GEO 课程是一个基于 **Taro 4.x + React + TypeScript** 的 **微信小程序**（仅 WeChat）在线教育应用。使用本地静态数据渲染。

## 技术栈约束

| 类别 | 选型 | 说明 |
|------|------|------|
| 框架 | Taro 4.x（React） | 必须使用 Taro 组件 API，不得引入原生 DOM 操作 |
| 语言 | TypeScript | 所有文件必须使用 `.ts` / `.tsx` |
| 样式 | SCSS | 每个组件一个 `index.scss`，组件内 `import './index.scss'` |
| 状态管理 | 组件级 state | 暂不引入全局状态库（Zustand / Redux 等），状态提升或 props 传递 |
| 图标 | 自定义 Icon 组件 | 不使用字体图标或第三方图标库 |
| UI 库 | 无 | 所有 UI 组件自建，不引入 HeroUI / Antd 等 |

## 目录结构与命名约束

```
src/
├── app.config.ts          # 全局路由、TabBar 配置
├── app.scss               # 全局样式（CSS 变量、工具类）
├── app.ts                 # 应用入口
├── assets/                # 静态资源（图片、tab 图标）
│   └── tab/               # TabBar 图标（png 格式）
├── components/            # 公共组件（每个组件一个独立目录）
│   └── ComponentName/
│       ├── index.tsx      # 组件实现
│       └── index.scss     # 组件样式
├── data/                  # 本地静态数据
│   ├── courses.ts         # 课程数据
│   ├── instructors.ts     # 讲师数据
│   ├── reviews.ts         # 评价数据
│   ├── menu.ts            # 个人中心菜单
│   ├── user.ts            # 用户数据
│   ├── lessons.ts         # 课程大纲
│   └── index.ts           # 统一导出
├── hooks/                 # 自定义 hooks
├── pages/                 # 页面
│   └── page-name/
│       ├── index.config.ts  # 页面配置
│       ├── index.tsx        # 页面实现
│       └── index.scss       # 页面样式
├── services/              # API 服务层（统一出口）
│   ├── config.ts          # 数据源切换配置（useLocal / shouldUseLocal）
│   ├── course.ts          # 课程相关 API
│   ├── instructor.ts      # 讲师相关 API
│   ├── lesson.ts          # 课时相关 API
│   ├── review.ts          # 评价相关 API
│   ├── user.ts            # 用户相关 API
│   └── index.ts           # 统一导出
├── styles/
│   ├── variables.scss     # 设计变量（颜色、字号、间距、圆角、阴影）
│   └── mixins.scss        # 通用 mixin
├── types/
│   └── index.ts           # 全局类型定义（Course, Instructor, Lesson, Review, User 等）
└── data/
    └── ...
```

**命名规则：**
- 目录/文件名：全小写 + `-` 分隔（kebab-case）
- 组件名：PascalCase（`CourseCard`）
- props 接口：`组件名 + Props`（`CourseCardProps`）
- 页面组件：默认导出 `export default function PageName()`
- 公共组件：默认导出 `export default function ComponentName()`

## 组件开发规范

### 组件结构
```tsx
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

interface ComponentNameProps {
  // 必需 props 在前，可选在后
}

export default function ComponentName({ ...props }: ComponentNameProps) {
  return (
    <View className='component-name'>
      <Text>...</Text>
    </View>
  )
}
```

### 组件规则
1. **从 `@tarojs/components` 导入**：`View`, `Text`, `Image`, `ScrollView`, `Swiper` 等，**不得使用 `div`、`span` 等 HTML 标签**
2. **自定义类名前缀**：组件类名使用组件名 kebab-case 作为前缀，如 `course-card`、`course-card--list`
3. **尺寸单位**：使用 `rpx`，不直接使用 `px`（字体大小在 `variables.scss` 中用 `rpx` 定义）
4. **非 Tab 页面**使用 `NavBar` 组件提供返回/分享按钮
5. **box-sizing**：所有 `view`、`text` 默认 `box-sizing: border-box`（已在 `app.scss` 全局设置）

## Icon 组件使用

```tsx
import Icon from '../../components/Icon'

// 内联 SVG 图标
<Icon name='star' size={28} color='#F59E0B' />
```

可用的 `name`：`star`, `users`, `book-open`, `megaphone`, `arrow-right`, `heart`, `heart-filled`, `clock`, `play`, `check`, `close`, `share`, `back`

## 样式约束

### SCSS 变量
从 `variables.scss` 导入，使用 `@use` 语法（**不使用 `@import`**）：

```scss
@use '../../styles/variables.scss' as *;

.class-name {
  color: $primary;          // #0D9488
  font-size: $font-base;    // 28rpx
  padding: $md;             // 24rpx
  border-radius: $radius-md; // 16rpx
}
```

### 关键变量速查
- 主色：`$primary` (#0D9488)、`$primary-light` (#14B8A6)、`$primary-lighter` (#99F6E4)、`$primary-lightest` (#F0FDFA)
- 文字：`$text-primary` (#0F172A)、`$text-secondary` (#475569)、`$text-tertiary` (#94A3B8)、`$text-inverse` (#FFFFFF)
- 字号：`$font-xs` (20rpx)、`$font-sm` (24rpx)、`$font-base` (28rpx)、`$font-md` (32rpx)、`$font-lg` (36rpx)、`$font-xl` (44rpx)、`$font-2xl` (52rpx)
- 间距：`$xs` (8rpx)、`$sm` (16rpx)、`$md` (24rpx)、`$base` (32rpx)、`$lg` (40rpx)
- 圆角：`$radius-sm` (8rpx)、`$radius-md` (16rpx)、`$radius-lg` (24rpx)、`$radius-full` (9999rpx)

### 全局工具类（已在 app.scss 定义）
- `.ellipsis` — 单行文本截断
- `.ellipsis-2` — 两行文本截断
- `.no-scrollbar` — 隐藏滚动条
- `.safe-bottom` — 底部安全区 padding
- `.safe-top` — 顶部安全区 padding

### ScrollView 横向滚动
必须同时设置以下属性才能生效：
```tsx
<ScrollView className='no-scrollbar' scrollX enableFlex scrollWithAnimation style={{ width: '100%' }}>
```

## 交互约束

| 场景 | 方式 | 示例 |
|------|------|------|
| Tab 页面跳转 | `Taro.switchTab` | `Taro.switchTab({ url: '/pages/course-list/index' })` |
| 非 Tab 页面跳转 | `Taro.navigateTo` | `Taro.navigateTo({ url: '/pages/course-detail/index?id=1' })` |
| 返回上一页 | `Taro.navigateBack` | `Taro.navigateBack()` |
| 轻提示 | `Taro.showToast` | `Taro.showToast({ title: '已收藏', icon: 'none' })` |
| 收藏/关注切换 | `useState` 控制，切换时 `showToast` 提示 | — |
| 加载更多 | 页面级 `onReachBottom` + `useState(page, hasMore)` | — |
| 搜索 | 回车触发 `onConfirm` 回调，显示 `showToast` | — |

## 前端 API 对接规范

### 架构概览

所有数据请求统一走 `src/services/` 服务层，**不允许**在页面/组件中直接 import `src/data/` 或调用 `Taro.request`。

```
页面/组件 → src/services/index.ts → 各领域 service → 本地数据 / 后端 API
```

### 数据源切换机制

`src/services/config.ts` 通过 `useLocal` 全局开关控制数据来源：

```ts
// src/services/config.ts
export const apiConfig = {
  useLocal: true,   // true = 本地静态数据（开发）; false = 后端 API（联调/生产）
}
```

每个 service 函数通过 `shouldUseLocal()` 判断走哪条链路：

```ts
import { shouldUseLocal } from './config'

export async function getAllCourses(options?: RequestOptions): Promise<Course[]> {
  if (shouldUseLocal(options)) return allCourses        // 本地
  // TODO: return Taro.request({ url: '/api/courses' }) // 后端
  return allCourses
}
```

### 服务函数编写规范

每个 service 函数必须：
1. 接收 `options?: RequestOptions` 参数（可选，用于单请求覆盖全局 `useLocal`）
2. 返回 `Promise<T>` 类型
3. 本地分支→后端分支的 TODO 注释保留，格式：`// TODO: return Taro.request({ url: '...' })`

```ts
// src/services/course.ts
import { allCourses } from '../data'
import type { Course } from '../types'
import type { RequestOptions } from './config'
import { shouldUseLocal } from './config'

export async function getAllCourses(options?: RequestOptions): Promise<Course[]> {
  if (shouldUseLocal(options)) return allCourses
  // TODO: return Taro.request({ url: '/api/courses' })
  return allCourses
}

export async function getCourseById(id: number, options?: RequestOptions): Promise<Course | undefined> {
  if (shouldUseLocal(options)) return allCourses.find((c) => c.id === id)
  // TODO: return Taro.request({ url: `/api/courses/${id}` })
  return allCourses.find((c) => c.id === id)
}
```

### 统一导出

`src/services/index.ts` 是唯一对外入口，所有 service 函数通过它 re-export：

```ts
// src/services/index.ts
export { apiConfig, shouldUseLocal } from './config'
export type { RequestOptions } from './config'

export { getHotCourses, getAllCourses, getCourseById, getCategories, getCoursesByCategory } from './course'
export { getInstructors, getInstructorById } from './instructor'
export { getLessons } from './lesson'
export { getReviews } from './review'
export { getUser, menuGroups } from './user'
```

### 页面中消费服务

页面通过 `useEffect` + `useState` 调用 service，**不直接 import `src/data/`**：

```tsx
import { useEffect, useState } from 'react'
import { getAllCourses, getCourseById, getLessons, getReviews } from '../../services'
import type { Course, Lesson, Review } from '../../types'

export default function CourseDetail() {
  const [course, setCourse] = useState<Course | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [reviews, setReviews] = useState<Review[]>([])

  useEffect(() => {
    getCourseById(courseId).then((c) => setCourse(c ?? null))
    getLessons().then(setLessons)
    getReviews().then(setReviews)
  }, [courseId])

  // ...
}
```

### 已有 API 清单

| 函数 | 文件 | 返回类型 | 说明 |
|------|------|----------|------|
| `getHotCourses` | `course.ts` | `Promise<Course[]>` | 热门课程列表 |
| `getAllCourses` | `course.ts` | `Promise<Course[]>` | 全部课程列表 |
| `getCourseById(id)` | `course.ts` | `Promise<Course \| undefined>` | 课程详情 |
| `getCategories` | `course.ts` | `Promise<Category[]>` | 课程分类枚举 |
| `getCoursesByCategory(cat)` | `course.ts` | `Promise<Course[]>` | 按分类筛选 |
| `getInstructors` | `instructor.ts` | `Promise<Instructor[]>` | 讲师列表 |
| `getInstructorById(id)` | `instructor.ts` | `Promise<Instructor \| undefined>` | 讲师详情 |
| `getLessons` | `lesson.ts` | `Promise<Lesson[]>` | 课时列表 |
| `getReviews` | `review.ts` | `Promise<Review[]>` | 评价列表 |
| `getUser` | `user.ts` | `Promise<User>` | 用户信息 |
| `menuGroups` | `user.ts` | `MenuGroup[]` | 菜单配置（同步） |

### 新增服务

当需要新增 API 时，按以下流程：

1. 在 `src/types/index.ts` 中定义接口类型
2. 在 `src/data/` 中添加本地 mock 数据
3. 在 `src/services/` 中创建或扩展现有 service 文件，遵循 `shouldUseLocal` 模式
4. 在 `src/services/index.ts` 中 re-export
5. 页面中从 `../../services` 导入使用

### 后端对接时机

当需要切换为真实 API 时：
1. 将 `src/services/config.ts` 中的 `useLocal` 改为 `false`
2. 将每个 service 函数中的 `// TODO: return Taro.request(...)` 取消注释，替换本地数据返回
3. 移除 `src/data/` 的 import（可保留文件作为 mock 参考）

### 禁止事项

1. ❌ **页面/组件中直接 import `src/data/`** — 必须通过 `src/services/` 中转
2. ❌ **页面/组件中直接调用 `Taro.request`** — 封装在 service 层
3. ❌ **在 service 函数中硬编码 URL** — 后端 URL 统一在 `config.ts` 中管理
4. ❌ **service 函数不处理 loading/error 状态** — loading/error 由页面组件自行管理

## 仅微信小程序特有约束

1. **TabBar 图标**：只支持 `png` 格式，不支持 SVG。图标尺寸建议 81x81px（会自动缩放到 48x48px）
2. **预览方式**：运行 `npm run dev:weapp` 后，用微信开发者工具导入项目根目录的 `dist/` 文件夹
3. **包大小限制**：微信小程序主包不超过 2MB，注意控制静态资源体积
4. **API 限制**：不使用微信小程序不支持的 Web API（如 `document`、`window`、`localStorage`），使用 `Taro.getStorage` / `Taro.setStorage` 替代
5. **导航栏**：`app.config.ts` 已设置 `navigationStyle: 'custom'`，所有页面使用自定义 `NavBar` 组件
6. **安全区**：使用 `safe-area-inset-bottom` / `safe-area-inset-top` 适配刘海屏，对应 `.safe-bottom` / `.safe-top` 工具类
7. **不兼容其他小程序平台**：不使用支付宝、百度、字节跳动等小程序平台的私有 API 或差异化特性。Taro 编译目标固定为 `--type weapp`

## 项目启动

```bash
# 微信小程序开发（带 watch）
npm run dev:weapp

# 微信小程序构建
npm run build:weapp
```

## 常见陷阱

1. ❌ **不要使用 HTML 标签**（`div`、`span`、`p`、`button`、`img`、`a`）。全部使用 Taro 组件（`View`、`Text`、`Image`、`Button`、`Navigator`）
2. ❌ **不要使用 `@import` 导入 SCSS**。使用 `@use '...' as *`
3. ❌ **不要直接使用 `px`**。使用 `rpx` 作为响应式单位
4. ❌ **不要引入第三方 UI 库**。所有 UI 组件自建
5. ❌ **不要直接操作 DOM**。使用 Taro API 和 React state
6. ❌ **不要使用 `font-icon` 或第三方图标库**。使用项目自带的 `Icon` 组件
7. ✅ 横向 `ScrollView` 必须设置 `enableFlex` + `scrollWithAnimation` + `style={{ width: '100%' }}`
8. ✅ 组件 SCSS 文件必须与组件文件同一目录，命名 `index.scss`
9. ✅ 所有数据通过 `src/services/` 服务层获取，不在页面/组件中直接 import `src/data/`