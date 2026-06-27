import { View } from '@tarojs/components'
import './index.scss'

interface SkeletonProps {
  /** 骨架屏行数（文本条） */
  rows?: number
  /** 是否显示头像/圆形占位 */
  avatar?: boolean
  /** 是否显示标题条 */
  title?: boolean
  /** 是否横向卡片布局 */
  horizontal?: boolean
}

export default function Skeleton({
  rows = 2,
  avatar = false,
  title = true,
  horizontal = false,
}: SkeletonProps) {
  return (
    <View className={`skeleton ${horizontal ? 'skeleton--horizontal' : ''}`}>
      {avatar && <View className='skeleton-avatar' />}
      <View className='skeleton-body'>
        {title && <View className='skeleton-title' />}
        {Array.from({ length: rows }).map((_, i) => (
          <View
            key={i}
            className='skeleton-row'
            style={{ width: `${[100, 75, 50][i % 3]}%` }}
          />
        ))}
      </View>
    </View>
  )
}
