import { PropsWithChildren, useState, CSSProperties, createElement } from 'react'
import { View } from '@tarojs/components'
import Taro, { useLaunch } from '@tarojs/taro'
import {
  isLoggedIn,
  initTheme,
  refreshTheme,
  getThemeConfigSync,
  initModuleModes,
  refreshModuleModes,
  type ThemeConfig,
} from './services'
import './app.scss'

function App({ children }: PropsWithChildren<any>) {
  const [theme, setTheme] = useState<ThemeConfig>(getThemeConfigSync())

  useLaunch(async () => {
    // 初始化主题：先用缓存秒开，再异步拉取最新值
    await initTheme()
    setTheme(getThemeConfigSync())

    // 初始化模块展示模式（控制视频/图文切换，后台改动后下次冷启动或切前台生效）
    initModuleModes().catch(() => {})

    // 监听切回前台：每次回到小程序都刷新主题与模块模式，确保后台改动及时生效
    Taro.onAppShow(() => {
      refreshTheme().then((config) => setTheme(config))
      refreshModuleModes().catch(() => {})
    })

    // 启动时校验登录态：本地无 token 则跳转登录页
    if (!isLoggedIn()) {
      Taro.reLaunch({ url: '/pages/login/index' })
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
