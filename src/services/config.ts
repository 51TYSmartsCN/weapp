/**
 * 数据源全局配置
 * useLocal = true  → 使用本地静态数据（开发调试）
 * useLocal = false → 调后端 API（联调/生产）
 */
export const apiConfig = {
  useLocal: true,
}

/** 单个请求的选项，覆盖全局配置 */
export interface RequestOptions {
  /** 强制指定该请求走本地还是后端，不传则跟随 apiConfig.useLocal */
  local?: boolean
}

/** 判断当前请求应使用本地数据还是调 API */
export function shouldUseLocal(options?: RequestOptions): boolean {
  return options?.local ?? apiConfig.useLocal
}