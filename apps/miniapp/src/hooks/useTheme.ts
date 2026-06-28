import { useState, useEffect } from 'react'
import { getThemeConfigSync, refreshTheme, type ThemeConfig } from '../services'

/**
 * 主题 Hook
 * 返回当前主题色配置，支持在组件中动态使用主题色
 *
 * @example
 * const theme = useTheme()
 * <Icon color={theme.primary} />
 */
export function useTheme(): ThemeConfig {
  const [theme, setTheme] = useState<ThemeConfig>(getThemeConfigSync())

  useEffect(() => {
    refreshTheme().then(setTheme)
  }, [])

  return theme
}
