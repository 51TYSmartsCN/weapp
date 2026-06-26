import { useCallback, useState } from 'react'
import Taro from '@tarojs/taro'

/**
 * useAutoFill — 一键填写表单的开发辅助 hook
 *
 * 用法：
 * ```ts
 * const { fill, showFillButton, filled } = useAutoFill({
 *   label: '示例搜索',
 *   fields: { searchValue: 'GEO 实战入门' },
 *   onFill: (fields) => {
 *     setSearchValue(fields.searchValue)
 *     handleSearch(fields.searchValue)
 *   }
 * })
 * ```
 *
 * - showFillButton: dev 环境为 true，prod 为 false
 * - fill(): 触发填写
 * - filled: 当前是否已填写
 */
export function useAutoFill(config: {
  label: string
  fields: Record<string, any>
  onFill: (fields: Record<string, any>) => void
}) {
  const [filled, setFilled] = useState(false)
  const isDev = process.env.NODE_ENV === 'development'

  const fill = useCallback(() => {
    if (!isDev) return
    config.onFill(config.fields)
    setFilled(true)
    Taro.showToast({ title: `已填入：${config.label}`, icon: 'none' })
  }, [config, isDev])

  return {
    fill,
    showFillButton: isDev,
    filled,
  }
}