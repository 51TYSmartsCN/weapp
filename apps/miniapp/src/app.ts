import { PropsWithChildren, useState, CSSProperties, createElement } from 'react'
import { View } from '@tarojs/components'
import Taro, { useLaunch } from '@tarojs/taro'
import {
  buildLoginPageUrl,
  buildReturnUrl,
  LOGIN_PAGE_URL,
  LOGIN_RETURN_URL_KEY,
  isLoggedIn,
  initTheme,
  refreshTheme,
  getThemeConfigSync,
  initModuleModes,
  refreshModuleModes,
  initAppInfo,
  refreshAppInfo,
  initWxshopConfig,
  refreshWxshopConfig,
  type ThemeConfig,
} from './services'
import './app.scss'

function App({ children }: PropsWithChildren<any>) {
  const [theme, setTheme] = useState<ThemeConfig>(getThemeConfigSync())

  useLaunch(async (options) => {
    // 初始化主题：先用缓存秒开，再异步拉取最新值
    await initTheme()
    setTheme(getThemeConfigSync())

    // 初始化模块展示模式（控制视频/图文切换，后台改动后下次冷启动或切前台生效）
    initModuleModes().catch(() => {})

    // 初始化应用信息（名称、描述、Logo，后台改动后下次冷启动或切前台生效）
    initAppInfo().catch(() => {})

    // 初始化微信小店配置（appid、商品路径等）
    initWxshopConfig().catch(() => {})

    // 监听切回前台：每次回到小程序都刷新主题、模块模式与应用信息，确保后台改动及时生效
    Taro.onAppShow(() => {
      refreshTheme().then((config) => setTheme(config))
      refreshModuleModes().catch(() => {})
      refreshAppInfo().catch(() => {})
      refreshWxshopConfig().catch(() => {})
    })

    // 启动时校验登录态：本地无 token 则跳转登录页
    if (!isLoggedIn()) {
      const returnUrl = buildReturnUrl(
        options?.path ? `/${options.path}` : '',
        options?.query as Record<string, string> | undefined
      )
      if (returnUrl && returnUrl !== LOGIN_PAGE_URL) {
        Taro.setStorageSync(LOGIN_RETURN_URL_KEY, returnUrl)
      }
      Taro.reLaunch({ url: buildLoginPageUrl(returnUrl) })
    }
  })

  // 通过根节点 inline style 设置 CSS 变量，所有子页面/组件继承
  // className='app-root' 配合 app.scss 的 display:contents，避免影响页面布局
  const rootStyle: CSSProperties = {
    '--theme-primary': theme.primary,
    '--theme-primary-light': theme.primaryLight,
    '--theme-primary-lighter': theme.primaryLighter,
    '--theme-primary-lightest': theme.primaryLightest,
    '--theme-primary-dark': theme.primaryDark,
    '--theme-primary-darker': theme.primaryDarker,
  } as CSSProperties

  return createElement(View, { className: 'app-root', style: rootStyle }, children)
}

export default App
