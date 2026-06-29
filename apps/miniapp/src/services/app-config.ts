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
const TAB_ICON_CACHE_KEY = 'app_tab_icon_cache'

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

// 内存中的主题色值缓存（同步可读，用于 Icon 等无法使用 CSS 变量的场景）
// CSS 变量（var(--theme-xxx)）在 SVG data URL / base64 图像内不生效，
// 需要把实际 hex 色值写进 SVG 才能正确渲染。
let cachedThemeColors: ThemeConfig = DEFAULT_THEME

function syncThemeCache(config: ThemeConfig) {
  cachedThemeColors = { ...DEFAULT_THEME, ...config }
}

const THEME_VAR_MAP: Record<string, keyof ThemeConfig> = {
  '--theme-primary': 'primary',
  '--theme-primary-light': 'primaryLight',
  '--theme-primary-lighter': 'primaryLighter',
  '--theme-primary-lightest': 'primaryLightest',
  '--theme-primary-dark': 'primaryDark',
  '--theme-primary-darker': 'primaryDarker',
}

/**
 * 把 CSS 变量颜色字符串解析为实际 hex 色值
 * - 普通 hex / rgb 色值直接返回
 * - var(--theme-xxx, #fallback) 形式：从内存缓存取实际值，取不到用 fallback
 *
 * 用途：Icon 组件（SVG base64）、Avatar 背景色等无法通过 CSS 继承变量的场景
 */
export function resolveColor(color: string): string {
  if (!color) return color
  if (!color.startsWith('var(')) return color

  const match = color.match(/var\(\s*([^,\s]+)\s*(?:,\s*(.+))?\s*\)/)
  if (!match) return color

  const varName = match[1]
  const fallback = match[2]?.trim() || '#0D9488'
  const key = THEME_VAR_MAP[varName]
  if (!key) return fallback

  return (cachedThemeColors[key] as string) || fallback
}

/**
 * 同步更新内存中的主题色缓存（给 Icon 等组件用）
 * 在 initTheme / refreshTheme 成功后调用
 */
export function syncThemeColors(config: ThemeConfig): void {
  syncThemeCache(config)
}

// 首次加载时同步本地缓存到内存
try {
  const cached = Taro.getStorageSync(THEME_STORAGE_KEY)
  if (cached) syncThemeCache(cached)
} catch {
  // ignore
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
    syncThemeCache(config)
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

// ==================== 应用信息配置 ====================

export interface AppInfo {
  /** 应用名称 */
  appName: string
  /** 应用 Logo 图片 URL（相对路径，如 /images/logo/xxx.png） */
  appLogo?: string
  /** 应用描述/副标题 */
  appDescription?: string
}

const APP_INFO_STORAGE_KEY = 'app_info_config'

// 默认应用信息（接口失败或无缓存时兜底）
const DEFAULT_APP_INFO: AppInfo = {
  appName: 'GEO 课程',
  appDescription: '专注 GEO 领域的实战学习平台',
}

/**
 * 把后端返回的相对 URL（/images/xxx）转为完整 URL
 * 公共导出，供消费方拼接 logo 等图片地址
 */
export function resolveUrl(url: string): string {
  if (!url) return ''
  if (/^https?:\/\//.test(url)) return url
  return `${BASE_URL}${url}`
}

/**
 * 从服务端获取最新应用信息
 * 走 /api/app-configs/app-info（无需登录）
 */
export async function fetchAppInfo(): Promise<AppInfo> {
  try {
    const data = await request<AppInfo>({
      url: '/api/app-configs/app-info',
      method: 'GET',
      skipAuth: true,
    })
    return { ...DEFAULT_APP_INFO, ...(data || {}) }
  } catch {
    const cached = await Taro.getStorage({ key: APP_INFO_STORAGE_KEY }).catch(() => null)
    return (cached?.data as AppInfo) || DEFAULT_APP_INFO
  }
}

/**
 * 读取本地缓存的应用信息（同步，用于首屏秒开）
 */
export function getAppInfoSync(): AppInfo {
  try {
    const cached = Taro.getStorageSync(APP_INFO_STORAGE_KEY)
    if (cached) return { ...DEFAULT_APP_INFO, ...cached }
  } catch {
    // ignore
  }
  return DEFAULT_APP_INFO
}

/**
 * 缓存应用信息到本地
 */
export async function cacheAppInfo(info: AppInfo): Promise<void> {
  try {
    await Taro.setStorage({ key: APP_INFO_STORAGE_KEY, data: info })
  } catch {
    // ignore
  }
}

/**
 * 刷新应用信息：从服务端拉取最新值并缓存
 * - 冷启动时调用
 * - 切前台时调用
 * 返回最新配置
 */
export async function refreshAppInfo(): Promise<AppInfo> {
  const info = await fetchAppInfo()
  await cacheAppInfo(info)
  return info
}

/**
 * 初始化应用信息（拉取最新配置并缓存）
 * 在 app.ts 的 useLaunch 中调用
 */
export async function initAppInfo(): Promise<AppInfo> {
  return refreshAppInfo()
}
