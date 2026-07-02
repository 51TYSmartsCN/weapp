import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

interface StoreProductProps {
  appid?: string
  productId?: string
  customContent?: boolean
  openPage?: string
  logoPosition?: string
  customStyle?: Record<string, unknown>
  className?: string
  onEnterSuccess?: (event: any) => void
  onEnterError?: (event: any) => void
  children?: any
}

/** kebab-case → camelCase 转换 */
function toCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
}

export default function StoreProduct({
  appid,
  productId,
  customStyle,
  className,
  onEnterSuccess,
  onEnterError,
}: StoreProductProps) {
  const handleClick = async () => {
    if (!appid || !productId) {
      onEnterError?.({ detail: { errMsg: 'missing appid or productId' } })
      return
    }

    try {
      await Taro.navigateToMiniProgram({
        appId: appid,
        path: `/pages/product/detail/index?productId=${productId}`,
        envVersion: 'release',
      })
      onEnterSuccess?.({})
    } catch (err) {
      onEnterError?.({ detail: err })
    }
  }

  // 将 custom-style 中 buy-button 的 kebab-case 样式转 camelCase
  const rawStyle = (customStyle?.['buy-button'] || {}) as Record<string, string>
  const buttonStyle: Record<string, string> = {}
  for (const key of Object.keys(rawStyle)) {
    buttonStyle[toCamelCase(key)] = rawStyle[key]
  }

  return (
    <View
      className={`store-product ${className || ''}`}
      style={buttonStyle}
      onClick={handleClick}
    >
      <Text>去微信小店购买</Text>
    </View>
  )
}
