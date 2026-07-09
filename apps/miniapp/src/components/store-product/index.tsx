import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

interface StoreProductProps {
  appid?: string
  productId?: string
  productPath?: string
  customContent?: boolean
  openPage?: string
  logoPosition?: string
  customStyle?: Record<string, unknown>
  className?: string
  class?: string
  onEnterSuccess?: (event: any) => void
  onEnterError?: (event: any) => void
  bindentersuccess?: (event: any) => void
  bindentererror?: (event: any) => void
  children?: any
}

/** kebab-case → camelCase 转换 */
function toCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
}

export default function StoreProduct({
  appid,
  productId,
  productPath,
  customStyle,
  className,
  class: legacyClassName,
  onEnterSuccess,
  onEnterError,
  bindentersuccess,
  bindentererror,
}: StoreProductProps) {
  const handleClick = async () => {
    if (!appid || !productId) {
      const event = { detail: { errMsg: 'missing appid or productId' } }
      onEnterError?.(event)
      bindentererror?.(event)
      return
    }

    const basePath = productPath || '/pages/product/detail/index'
    const path = basePath + (basePath.includes('?') ? '&' : '?') + `productId=${encodeURIComponent(productId)}`

    try {
      await Taro.navigateToMiniProgram({
        appId: appid,
        path,
        envVersion: 'release',
      })
      const event = { detail: { appid, productId, path } }
      onEnterSuccess?.(event)
      bindentersuccess?.(event)
    } catch (err) {
      const event = { detail: err }
      onEnterError?.(event)
      bindentererror?.(event)
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
      className={`store-product ${className || legacyClassName || ''}`}
      style={buttonStyle}
      onClick={handleClick}
    >
      <Text>去微信小店购买</Text>
    </View>
  )
}
