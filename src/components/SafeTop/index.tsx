import { View } from '@tarojs/components'
import { useNavBarRect } from '../../hooks/useNavBarRect'
import './index.scss'

interface SafeTopProps {
  /**
   * 是否只占位状态栏高度。
   * - false（默认）：占位状态栏 + 胶囊按钮区域，确保后续内容不被胶囊遮挡，适用于常规页面。
   * - true：只占位状态栏高度，适用于顶部是全宽 banner/图片、希望胶囊浮在图片上的页面。
   */
  statusBarOnly?: boolean
}

export default function SafeTop({ statusBarOnly = false }: SafeTopProps) {
  const { statusBarHeight, totalHeight } = useNavBarRect()
  const height = statusBarOnly ? statusBarHeight : totalHeight

  return <View className='safe-top' style={{ height: `${height}px` }} />
}
