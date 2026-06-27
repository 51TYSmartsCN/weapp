import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

interface AvatarProps {
  /** 单字头像文本（当未提供 src 时使用） */
  text?: string
  /** 头像图片 URL；提供时优先渲染图片 */
  src?: string
  size?: number
  color?: string
  bg?: string
  className?: string
}

/** 判断字符串是否为图片 URL（http/https 或后端静态路径） */
function isImageUrl(s?: string): boolean {
  if (!s) return false
  return /^https?:\/\//.test(s) || s.startsWith('/images/')
}

export default function Avatar({
  text,
  src,
  size = 96,
  color = '#fff',
  bg = '#0D9488',
  className = ''
}: AvatarProps) {
  const sizePx = Taro.pxTransform(size)
  const fontSizePx = Taro.pxTransform(Math.round(size * 0.45))
  const useImage = isImageUrl(src)

  return (
    <View
      className={`avatar ${className}`}
      style={{
        width: sizePx,
        height: sizePx,
        backgroundColor: useImage ? 'transparent' : bg,
        color,
        overflow: 'hidden'
      }}
    >
      {useImage ? (
        <Image
          className='avatar-image'
          src={src as string}
          mode='aspectFill'
          style={{ width: sizePx, height: sizePx }}
        />
      ) : (
        <Text className='avatar-text' style={{ fontSize: fontSizePx }}>
          {text || ''}
        </Text>
      )}
    </View>
  )
}
