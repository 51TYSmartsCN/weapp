import { useMemo } from 'react'
import Taro from '@tarojs/taro'

export interface NavBarRect {
  /** 状态栏高度（px） */
  statusBarHeight: number
  /** 导航栏内容区高度（px），与胶囊按钮垂直居中对齐 */
  contentHeight: number
  /** NavBar 总高度（px） = statusBarHeight + contentHeight */
  totalHeight: number
  /** 胶囊按钮宽度（px），用于 NavBar 右侧占位避开胶囊 */
  menuWidth: number
  /** 胶囊按钮距右屏幕距离（px），用于左右对称留白 */
  menuRightGap: number
}

/**
 * 获取自定义导航栏的尺寸信息。
 * 微信小程序：基于胶囊按钮位置精确计算，保证 NavBar 内容与胶囊按钮垂直居中对齐。
 * H5 / 其他端：fallback 到固定值。
 */
export function useNavBarRect(): NavBarRect {
  return useMemo(() => {
    try {
      const sys = Taro.getSystemInfoSync()
      const statusBarHeight = sys.statusBarHeight ?? 0
      const screenWidth = sys.screenWidth ?? 375

      // 微信小程序：用胶囊按钮位置对齐
      // @ts-ignore getMenuButtonBoundingClientRect 仅在微信小程序环境存在
      if (typeof Taro.getMenuButtonBoundingClientRect === 'function') {
        // @ts-ignore
        const menu = Taro.getMenuButtonBoundingClientRect()
        if (menu && menu.height > 0) {
          // 胶囊按钮上下间距（相对状态栏底部）
          const gap = menu.top - statusBarHeight
          const contentHeight = gap * 2 + menu.height
          return {
            statusBarHeight,
            contentHeight,
            totalHeight: statusBarHeight + contentHeight,
            menuWidth: menu.width,
            menuRightGap: screenWidth - menu.right,
          }
        }
      }

      // H5 fallback：状态栏 0，内容区 44px
      return {
        statusBarHeight: 0,
        contentHeight: 44,
        totalHeight: 44,
        menuWidth: 0,
        menuRightGap: 0,
      }
    } catch {
      return {
        statusBarHeight: 0,
        contentHeight: 44,
        totalHeight: 44,
        menuWidth: 0,
        menuRightGap: 0,
      }
    }
  }, [])
}
