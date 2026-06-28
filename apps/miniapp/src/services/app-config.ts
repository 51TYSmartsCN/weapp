/**
 * 应用配置服务
 * 包含主题配置获取与缓存
 *
 * 注意：
 * - 主题色通过 app.ts 根节点 inline style 设置 CSS 变量完成
 * - TabBar 颜色通过 Taro.setTabBarStyle 动态设置
 * - TabBar 图标通过 downloadFile 下载到本地缓存 + Taro.setTabBarItem 设置
 */
import Taro from '@tarojs/taro'
import { request, BASE_URL } from './request'

export interface TabItem {
  text: string
  iconUrl: string
  activeIconUrl: string
}

export interface ThemeConfig {
  primary: string
  primaryLight: string
  primaryLighter: string
  primaryLightest: string
  primaryDark: string
  primaryDarker: string
  /** TabBar 选中文字色（默认跟随 primary） */
  tabBarSelectedColor?: string
  /** TabBar 未选中文字色 */
  tabBarColor?: string
  /** TabBar 背景色 */
  tabBarBgColor?: string
  /** TabBar 图标配置（4 个 tab） */
  tabItems?: TabItem[]
}

const THEME_STORAGE_KEY = 'app_theme_config'
const TAB_ICON_CACHE_KEY = 'app_tab_icon_cache' // 缓存图标本地路径映射 { url: localPath }

// 默认蓝紫色主题（接口失败或无缓存时兜底）
const DEFAULT_THEME: ThemeConfig = {
  primary: '#6366F1',
  primaryLight: '#818CF8',
  primaryLighter: '#C7D2FE',
  primaryLightest: '#EEF2FF',
  primaryDark: '#4F46E5',
  primaryDarker: '#4338CA',
  tabBarSelectedColor: '#6366F1',
  tabBarColor: '#94A3B8',
  tabBarBgColor: '#FFFFFF',
  tabItems: [
    { text: '首页', iconUrl: '', activeIconUrl: '' },
    { text: '课程', iconUrl: '', activeIconUrl: '' },
    { text: '学习', iconUrl: '', activeIconUrl: '' },
    { text: '我的', iconUrl: '', activeIconUrl: '' },
  ],
}

/**
 * 把后端返回的相对 URL（/images/tab/xxx.png）转为完整 URL
 */
function toAbsoluteUrl(url: string): string {
  if (!url) return ''
  if (/^https?:\/\//.test(url)) return url
  return `${BASE_URL}${url}`
}

/**
 * 从服务端获取最新主题配置
 * 走 /api/app-configs/theme（无需登录）
 */
export async function fetchThemeConfig(): Promise<ThemeConfig> {
  try {
    const data = await request<ThemeConfig>({
      url: '/api/app-configs/theme',
      method: 'GET',
      skipAuth: true, // 主题接口无需登录
    })
    return { ...DEFAULT_THEME, ...(data || {}) }
  } catch {
    // 请求失败时返回缓存或默认值
    const cached = await Taro.getStorage({ key: THEME_STORAGE_KEY }).catch(() => null)
    return (cached?.data as ThemeConfig) || DEFAULT_THEME
  }
}

/**
 * 读取本地缓存的主题配置（同步，用于首屏秒开）
 */
export function getThemeConfigSync(): ThemeConfig {
  try {
    const cached = Taro.getStorageSync(THEME_STORAGE_KEY)
    if (cached) return { ...DEFAULT_THEME, ...cached }
  } catch {
    // ignore
  }
  return DEFAULT_THEME
}

/**
 * 缓存主题配置到本地
 */
export async function cacheThemeConfig(config: ThemeConfig): Promise<void> {
  try {
    await Taro.setStorage({ key: THEME_STORAGE_KEY, data: config })
  } catch {
    // ignore
  }
}

/**
 * 应用 TabBar 颜色配置
 * 通过 Taro.setTabBarStyle 动态修改 TabBar 样式
 */
export function applyTabBarTheme(config: ThemeConfig): void {
  try {
    Taro.setTabBarStyle({
      color: config.tabBarColor || DEFAULT_THEME.tabBarColor!,
      selectedColor: config.tabBarSelectedColor || config.primary,
      backgroundColor: config.tabBarBgColor || DEFAULT_THEME.tabBarBgColor!,
      borderStyle: 'white',
    })
  } catch {
    // 某些场景（如非 TabBar 页面）调用可能失败，忽略
  }
}

/**
 * 下载网络图片到本地临时文件，返回本地路径
 * 已下载过的（按 URL 缓存）直接返回缓存路径
 */
async function downloadIcon(url: string): Promise<string> {
  if (!url) return ''

  // 检查缓存
  const cache = Taro.getStorageSync(TAB_ICON_CACHE_KEY) || {}
  if (cache[url]) {
    // 校验本地文件是否还存在（Taro.getFileSystemManager 不可用则直接用）
    return cache[url]
  }

  try {
    const res = await Taro.downloadFile({ url: toAbsoluteUrl(url) })
    if (res.statusCode === 200) {
      // 缓存映射
      cache[url] = res.tempFilePath
      Taro.setStorageSync(TAB_ICON_CACHE_KEY, cache)
      return res.tempFilePath
    }
  } catch {
    // ignore
  }
  return ''
}

/**
 * 应用 TabBar 图标配置
 * 下载每个 tab 的图标到本地，再调用 setTabBarItem 设置
 */
export async function applyTabBarIcons(config: ThemeConfig): Promise<void> {
  const items = config.tabItems
  if (!items || items.length === 0) return

  // 并行下载所有图标
  const downloadTasks = items.map((item) =>
    Promise.all([
      downloadIcon(item.iconUrl),
      downloadIcon(item.activeIconUrl),
    ])
  )
  const results = await Promise.all(downloadTasks)

  // 依次设置每个 tab item（含图标和文字）
  for (let i = 0; i < items.length; i++) {
    const [iconPath, selectedIconPath] = results[i]
    try {
      await Taro.setTabBarItem({
        index: i,
        text: items[i].text,
        iconPath: iconPath || undefined,
        selectedIconPath: selectedIconPath || undefined,
      })
    } catch {
      // 单个设置失败不影响其他
    }
  }
}

/**
 * 刷新主题配置：从服务端拉取最新值并缓存
 * - 冷启动时调用
 * - 切前台时调用
 * - 后台修改主题后，用户下次刷新即可生效
 * 返回最新配置，由调用方 setTheme 触发 UI 更新
 */
export async function refreshTheme(): Promise<ThemeConfig> {
  const config = await fetchThemeConfig()
  await cacheThemeConfig(config)
  applyTabBarTheme(config)
  // 图标下载较慢，异步执行不阻塞主流程
  applyTabBarIcons(config).catch(() => {})
  return config
}

/**
 * 初始化主题（拉取最新配置并缓存）
 * 在 app.ts 的 useLaunch 中调用
 */
export async function initTheme(): Promise<ThemeConfig> {
  // 先用缓存设置 TabBar 颜色，避免冷启动闪烁
  applyTabBarTheme(getThemeConfigSync())
  return refreshTheme()
}

// ==================== 模块展示模式配置 ====================

export interface ModuleDisplayModes {
  /** 课时播放页：内容展示模式 */
  lessonPlayer: {
    /** 'video' = 视频播放; 'text-image' = 图文教程 */
    contentMode: 'video' | 'text-image'
  }
  /** 课程详情页封面：展示模式 */
  courseDetailCover: {
    /** 'image' = 静态封面图; 'video' = 视频预览 */
    mode: 'image' | 'video'
    /** 当 mode=video 时使用的视频 URL（为空则回退到 image） */
    videoUrl?: string
  }
}

const MODULE_MODES_STORAGE_KEY = 'app_module_modes'

// 默认：课时播放走视频、详情封面走图片
const DEFAULT_MODULE_MODES: ModuleDisplayModes = {
  lessonPlayer: { contentMode: 'video' },
  courseDetailCover: { mode: 'image' },
}

/**
 * 从服务端获取最新模块展示模式
 * 走 /api/app-configs/module-modes（无需登录）
 */
export async function fetchModuleModes(): Promise<ModuleDisplayModes> {
  try {
    const data = await request<ModuleDisplayModes>({
      url: '/api/app-configs/module-modes',
      method: 'GET',
      skipAuth: true,
    })
    return { ...DEFAULT_MODULE_MODES, ...(data || {}) }
  } catch {
    const cached = await Taro.getStorage({ key: MODULE_MODES_STORAGE_KEY }).catch(() => null)
    return (cached?.data as ModuleDisplayModes) || DEFAULT_MODULE_MODES
  }
}

/**
 * 读取本地缓存的模块展示模式（同步，用于首屏秒开）
 */
export function getModuleModesSync(): ModuleDisplayModes {
  try {
    const cached = Taro.getStorageSync(MODULE_MODES_STORAGE_KEY)
    if (cached) return { ...DEFAULT_MODULE_MODES, ...cached }
  } catch {
    // ignore
  }
  return DEFAULT_MODULE_MODES
}

/**
 * 缓存模块展示模式到本地
 */
export async function cacheModuleModes(modes: ModuleDisplayModes): Promise<void> {
  try {
    await Taro.setStorage({ key: MODULE_MODES_STORAGE_KEY, data: modes })
  } catch {
    // ignore
  }
}

/**
 * 刷新模块展示模式：从服务端拉取最新值并缓存
 * 返回最新配置，由调用方触发 UI 更新
 */
export async function refreshModuleModes(): Promise<ModuleDisplayModes> {
  const modes = await fetchModuleModes()
  await cacheModuleModes(modes)
  return modes
}

/**
 * 初始化模块展示模式（拉取最新配置并缓存）
 * 在 app.ts 的 useLaunch 中调用
 */
export async function initModuleModes(): Promise<ModuleDisplayModes> {
  return refreshModuleModes()
}
