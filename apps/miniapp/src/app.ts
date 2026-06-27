import { PropsWithChildren } from 'react'
import Taro from '@tarojs/taro'
import { useLaunch } from '@tarojs/taro'
import { isLoggedIn } from './services'
import './app.scss'

function App({ children }: PropsWithChildren<any>) {
  useLaunch(() => {
    // 启动时校验登录态：本地无 token 则跳转登录页
    // 已登录用户直接进入首页 Tab（pages 数组首项）
    if (!isLoggedIn()) {
      Taro.reLaunch({ url: '/pages/login/index' })
    }
  })

  return children
}

export default App
