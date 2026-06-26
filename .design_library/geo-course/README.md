# GEO Course 设计系统

GEO Course 在线教育品牌的设计系统重建 —— 面向微信小程序的教育类移动端产品，基于 Taro 4.x + React + TypeScript 技术栈，使用 SCSS 变量驱动视觉规范。

### 来源：结构化设计规范（Taro 微信小程序 SCSS 变量提取）

### 涵盖范围：视觉基础（颜色、字体、间距、圆角、阴影），6 个核心组件模式，附 HTML 预览文件。

---

## 内容基础

### 语气与风格

GEO Course 的文案风格直接、专业、面向学习场景。界面文案偏向行动引导（"开始学习"、"免费试看"），而非品牌自述。整体语气克制且友好，不使用表情符号，不堆砌形容词，信息密度适中。作为教育产品，信任感和清晰度优先于视觉花哨。

### 文案示例

- "热门课程" —— 首页课程区标题
- "加入学习" —— 课程详情页 CTA
- "搜索课程、讲师" —— 搜索栏占位文案
- "免费试看" —— 课时列表试听标识
- "我的收藏" —— 个人中心菜单项

### 文案生成规则

1. 使用动词开头的行为召唤（CTA），如"开始学习"、"立即报名"，而非名词短语
2. 数字信息优先展示：课时数、学员数、评分星级等量化指标放在显眼位置
3. 状态文案简洁统一：使用"已完成"、"进行中"、"未开始"等标准状态词
4. 不使用表情符号和感叹号，保持专业教育的可信基调

---

## 视觉基础

### 颜色

品牌主色 `--primary: #0D9488` 是一个偏冷的青绿色（teal），沉稳而专业，契合教育产品的可信赖感。色阶共 6 级，从最深 `--primary-darker: #115E59` 到最浅 `--primary-lightest: #F0FDFA`，覆盖深色按压态、常规态、亮态高亮和极浅底色等场景。

背景系统分三级纯白梯度：`--bg: #FFFFFF`（主背景）、`--bg-secondary: #F8FAFB`（卡片背景/区块分隔）、`--bg-tertiary: #F1F5F9`（更深的区块底色）。Surface 层与背景共享白色基调，`--surface-hover: #F8FAFB` 提供微妙的交互反馈。

文字色分四级深度：`--text-primary: #0F172A`（近黑标题）、`--text-secondary: #475569`（正文阅读）、`--text-tertiary: #94A3B8`（辅助提示/占位符）、`--text-inverse: #FFFFFF`（反色文字）。链接色复用主色 `--text-link: #0D9488`。

语义色采用直觉映射：成功 `--success: #10B981`（绿色）、警告 `--warning: #F59E0B`（琥珀色）、错误 `--error: #EF4444`（红色）、信息 `--info: #0D9488`（与主色同源）。

边框系统极轻：`--border: #E2E8F0` 为常规分隔线，`--border-light: #F1F5F9` 用于更柔和的视觉分区，`--divider: #F1F5F9` 同理。整体视觉倾向于"无框"设计，靠间距和底色差异划分层级，而非实线边框。

### 字体

主字体栈以 PingFang SC 为中文首选，回退至系统字体族：`-apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif`。无额外 Web 字体加载，依赖系统字体确保小程序包体积和渲染性能。

字号共 8 级，从 `--font-size-xs: 10px` 到 `--font-size-3xl: 30px`。常用区间集中在 12–18px（对应小程序 rpx 下的 24–36rpx）：标签/辅助用 10–12px，正文 14px，小标题 16–18px，大标题 22–26px，页面主标题 30px。行高遵循自然行高，不设硬性行高变量。

### 间距

基准单元 4px（`--space-xs`），整体采用 4px 倍数网格。间距变量从 `--space-xs: 4px` 到 `--space-3xl: 40px` 共 8 级。组件内边距常用 12px（`--space-md`）和 16px（`--space-base`），卡片外间距多为 16–20px，页面级留白 24–32px。TabBar 高度固定 50px（`--tab-bar-height`）。

### 圆角

圆角分 5 级：`--radius-sm: 4px` 用于小型元素（标签、输入框），`--radius-md: 8px` 用于按钮和常规卡片，`--radius-lg: 12px` 用于大卡片和弹窗，`--radius-xl: 16px` 用于全宽面板级容器，`--radius-full: 9999px` 专用于胶囊形元素（标签药丸、头像、Tab 指示器）。整体趋势是中等偏柔和，没有直角元素。

### 阴影 / 层级

阴影仅 3 级，整体极其克制：`--shadow-sm: 0 1px 2px rgba(0,0,0,0.04)` 用于悬浮提示或轻微抬起，`--shadow-md: 0 2px 8px rgba(0,0,0,0.04)` 用于卡片默认态，`--shadow-lg: 0 4px 16px rgba(0,0,0,0.05)` 用于弹窗或模态层。所有阴影的透明度都不超过 5%，视觉上呈现"呼吸感"而非压迫感。

### 边框与背景

- 边框宽度隐含在 `--border` 色值中，默认 1px solid，不设独立宽度变量
- 背景色与 Surface 系统共用白色系，组件不使用渐变背景或纹理图案
- 分隔线统一使用 `--divider: #F1F5F9`，视觉上极轻，接近"无分隔线"体验

---

## 组件模式

| 组件 | 文件 | 设计要点 |
|------|------|----------|
| SearchBar | `components/search-bar.json` | 圆角输入框，`--radius-full` 胶囊形态，内嵌搜索图标，浅色背景区分内容区 |
| CourseCardGrid | `components/course-card-grid.json` | 网格布局课程卡片，封面图 + 标题 + 元信息（评分/学员/价格），8px 圆角 |
| CourseCardList | `components/course-card-list.json` | 列表布局横向排列，封面左置 + 右侧信息区，适合浏览效率优先场景 |
| InstructorCard | `components/instructor-card.json` | 讲师展示卡片，头像 + 姓名 + 职称 + 关注按钮，12px 圆角 |
| TagPill | `components/tag-pill.json` | 胶囊标签，full 圆角，用于分类筛选和课程标签，支持主色/中性两种变体 |
| TabBar | `components/tab-bar.json` | 底部导航栏，固定 50px 高度，图标 + 文字双行排列，主色激活态 |

---

## 文件索引

| 文件 | 说明 |
|------|------|
| `colors_and_type.css` | CSS 自定义属性：颜色、字体、间距、圆角、阴影，可直接引入项目 |
| `css.json` | 结构化 token 数据（JSON 格式），供工具链读取 |
| `components.css` | 组件级样式聚合文件，包含所有组件的 CSS 类定义 |
| `components/index.json` | 组件索引，6 个核心组件的 slug 和名称 |
| `components/*.json` | 各组件独立的样式规范文件 |
| `preview/component-*.html` | 6 个组件的独立 HTML 预览页，浏览器直接打开即可查看 |

---

## 已知限制与替代说明

1. **字体回退**：设计中依赖 PingFang SC（iOS/macOS 原生），Android 设备将回退至 Microsoft YaHei 或系统默认中文字体，字号和字重表现可能存在轻微差异。
2. **图标方案**：本项目使用自定义 SVG Icon 组件（star、users、book-open、megaphone 等），设计系统中不包含独立图标资源文件，图标需从 Taro 组件层获取。
3. **仅浅色主题**：当前 `colors_and_type.css` 仅包含浅色（light-only）变量，深色模式 token 未覆盖。
4. **单位换算**：原始 SCSS 变量使用 `rpx` 单位（微信小程序响应式），导出的 CSS 变量已换算为 `px`，在实际小程序开发中需注意 `rpx` 与 `px` 的对应关系。
5. **阴影精度**：微信小程序对 `rgba` 阴影的支持与浏览器存在差异，部分低端安卓设备上阴影可能显示为纯黑色。
