import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

interface AvatarProps {
  text: string
  size?: number
  color?: string
  bg?: string
  className?: string
}

export default function Avatar({
  text,
  size = 96,
  color = '#fff',
  bg = '#0D9488',
  className = ''
}: AvatarProps) {
  const sizePx = Taro.pxTransform(size)
  const fontSizePx = Taro.pxTransform(Math.round(size * 0.45))
  return (
    <View
      className={`avatar ${className}`}
      style={{
        width: sizePx,
        height: sizePx,
        backgroundColor: bg,
        color
      }}
    >
      <Text className='avatar-text' style={{ fontSize: fontSizePx }}>
        {text}
      </Text>
    </View>
  )
}
