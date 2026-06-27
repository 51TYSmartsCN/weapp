import { View } from '@tarojs/components'
import './index.scss'

interface LoadingProps {
  text?: string
}

export default function Loading({ text = '加载中...' }: LoadingProps) {
  return (
    <View className='loading'>
      <View className='loading-spinner' />
      <View className='loading-text'>{text}</View>
    </View>
  )
}
