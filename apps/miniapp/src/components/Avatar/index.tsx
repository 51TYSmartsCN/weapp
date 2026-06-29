import { useState } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { BASE_URL } from '../../services/request'
import './index.scss'

interface AvatarProps {
  /** 单字头像文本（当未提供 src 或图片加载失败时使用） */
  text?: string
  /** 头像图片 URL；提供时优先渲染图片，加载失败自动回退到默认头像，再失败才显示文字 */
  src?: string
  size?: number
  color?: string
  bg?: string
  className?: string
}

/** 默认头像路径（相对于后端静态资源根目录） */
const DEFAULT_AVATAR_PATH = '/images/avatars/default.png'
const DEFAULT_AVATAR = BASE_URL + DEFAULT_AVATAR_PATH

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
  bg = 'var(--theme-primary, #0D9488)',
  className = ''
}: AvatarProps) {
  const sizePx = Taro.pxTransform(size)
  const fontSizePx = Taro.pxTransform(Math.round(size * 0.45))
  // 失败阶段：0=未失败 1=主图失败，正在尝试默认图 2=全部失败，回退文字
  const [failStage, setFailStage] = useState<0 | 1 | 2>(0)

  const hasPrimarySrc = isImageUrl(src) && failStage < 1
  const hasDefaultSrc = failStage === 1 && isImageUrl(DEFAULT_AVATAR)

  const currentSrc = hasPrimarySrc ? src : (hasDefaultSrc ? DEFAULT_AVATAR : '')
  const useImage = !!currentSrc

  const handleError = () => {
    if (failStage === 0 && isImageUrl(src)) {
      // 主图失败 → 切到默认头像
      setFailStage(1)
    } else if (failStage <= 1) {
      // 默认头像也失败 → 最终回退文字
      setFailStage(2)
    }
  }

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
          src={currentSrc as string}
          mode='aspectFill'
          style={{ width: sizePx, height: sizePx }}
          onError={handleError}
        />
      ) : (
        <Text className='avatar-text' style={{ fontSize: fontSizePx }}>
          {text || ''}
        </Text>
      )}
    </View>
  )
}
