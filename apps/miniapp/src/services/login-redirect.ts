export const LOGIN_PAGE_URL = '/pages/login/index'
export const HOME_PAGE_URL = '/pages/index/index'
export const LOGIN_RETURN_URL_KEY = 'geo_login_return_url'

const TAB_PAGE_URLS = new Set([
  '/pages/index/index',
  '/pages/course-list/index',
  '/pages/learning/index',
  '/pages/profile/index',
])

function stripHash(value: string): string {
  return value.split('#')[0] || ''
}

export function sanitizeReturnUrl(value?: string | null): string {
  if (!value) return ''

  const normalized = stripHash(String(value).trim())
  if (!normalized.startsWith('/')) return ''

  const pagePath = normalized.split('?')[0]
  if (pagePath === LOGIN_PAGE_URL) return ''

  return normalized
}

export function buildReturnUrl(
  path?: string | null,
  query?: Record<string, string | number | boolean | undefined | null>
): string {
  const normalizedPath = sanitizeReturnUrl(path)
  if (!normalizedPath) return ''

  if (!query || Object.keys(query).length === 0) return normalizedPath

  const queryString = Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== null && String(value) !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&')

  if (!queryString) return normalizedPath
  return `${normalizedPath}?${queryString}`
}

export function buildLoginPageUrl(returnUrl?: string | null): string {
  const sanitizedReturnUrl = sanitizeReturnUrl(returnUrl)
  if (!sanitizedReturnUrl) return LOGIN_PAGE_URL
  return `${LOGIN_PAGE_URL}?returnUrl=${encodeURIComponent(sanitizedReturnUrl)}`
}

export function resolveDecodedReturnUrl(rawValue?: string | null): string {
  if (!rawValue) return ''
  try {
    return sanitizeReturnUrl(decodeURIComponent(rawValue))
  } catch {
    return sanitizeReturnUrl(rawValue)
  }
}

export function isTabPageUrl(url: string): boolean {
  const pagePath = sanitizeReturnUrl(url).split('?')[0]
  return TAB_PAGE_URLS.has(pagePath)
}
