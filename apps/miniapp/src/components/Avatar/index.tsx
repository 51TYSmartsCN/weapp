import { useState } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { BASE_URL } from '../../services/request'
import './index.scss'

interface AvatarProps {
  text?: string
  src?: string
  size?: number
  color?: string
  bg?: string
  className?: string
}

const DEFAULT_AVATAR_PATH = '/images/avatars/default.png'

function resolveAvatarUrl(src?: string): string {
  if (!src) return ''
  if (/^https?:\/\//.test(src)) return src
  if (src.startsWith('/')) return BASE_URL + src
  return ''
}

function hasImageUrl(src?: string): boolean {
  if (!src) return false
  return /^https?:\/\//.test(src) || src.startsWith('/images/') || src.startsWith('/')
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
  const [primaryFailed, setPrimaryFailed] = useState(false)

  const primaryUrl = resolveAvatarUrl(src)
  const defaultUrl = resolveAvatarUrl(DEFAULT_AVATAR_PATH)

  const hasSrc = hasImageUrl(src)
  const usePrimary = hasSrc && !primaryFailed
  const useDefault = hasSrc && primaryFailed
  const useImage = usePrimary || useDefault

  const currentSrc = usePrimary ? primaryUrl : defaultUrl

  const handleError = () => {
    if (!primaryFailed) setPrimaryFailed(true)
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
          src={currentSrc}
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
