import dotenv from 'dotenv'
import path from 'path'

/**
 * 多环境变量加载策略：
 * 1. 先加载 .env（共享基础配置）
 * 2. 再按 NODE_ENV 加载 .env.development / .env.production（覆盖同名项）
 *
 * NODE_ENV 未设置时默认按 'development' 处理，确保本地直接 ts-node-dev 启动
 * 也能拿到 NODE_TLS_REJECT_UNAUTHORIZED=0 等开发期 override。
 */
const NODE_ENV = process.env.NODE_ENV || 'development'
const envOverrideFile = `.env.${NODE_ENV}`

if (process.env.GEO_SERVER_SKIP_DOTENV !== '1') {
  dotenv.config({ path: path.resolve(__dirname, '..', '.env') })
  dotenv.config({ path: path.resolve(__dirname, '..', envOverrideFile) })
}

/** 当前运行环境（便于日志/调试） */
export const env: string = NODE_ENV
export const isProduction = env === 'production'

/** 服务端口 */
export const port: number = Number(process.env.PORT) || 4000

/** 服务对外访问地址(用于拼接图片 URL 等完整链接) */
export const baseUrl: string = process.env.BASE_URL || `http://localhost:${port}`

/** MySQL 数据库连接配置 */
export const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'geo_course',
  waitForConnections: true,
  connectionLimit: 10,
}

/** JWT 配置 */
export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'geo_course_dev_secret_change_me',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
}

/** 微信小程序配置 */
export const wechatConfig = {
  appid: process.env.WECHAT_APPID || '',
  secret: process.env.WECHAT_SECRET || '',
}

/** 微信小店订单回调配置(小程序消息推送机制)
 * - callbackToken:在 mp.weixin.qq.com → 开发管理 → 消息推送配置 中设置的 Token
 * - encodingAESKey:消息加密密钥,43位 base64,对应小程序后台 EncodingAESKey
 * - mockMode:仅 WXSHOP_MOCK=1 时开启,跳过签名校验+允许 mock 接口
 */
const wxshopCallbackToken = process.env.WXSHOP_CALLBACK_TOKEN || ''
const wxshopEncodingAESKey = process.env.WXSHOP_ENCODING_AES_KEY || ''
export const wxshopConfig = {
  callbackToken: wxshopCallbackToken,
  encodingAESKey: wxshopEncodingAESKey,
  mockMode: isProduction
    ? false
    : process.env.WXSHOP_MOCK === '1' || !wxshopCallbackToken,
}

/** CORS 白名单（生产环境使用） */
export const corsOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

function requireEnv(name: string) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`[config] 缺少生产环境必填变量: ${name}`)
  }
  return value
}

if (isProduction) {
  requireEnv('JWT_SECRET')
  requireEnv('WECHAT_APPID')
  requireEnv('WECHAT_SECRET')
  requireEnv('WXSHOP_CALLBACK_TOKEN')
  requireEnv('WXSHOP_ENCODING_AES_KEY')
  requireEnv('ADMIN_USERNAME')
  requireEnv('ADMIN_PASSWORD')
  requireEnv('CORS_ORIGINS')
}

/** 后台管理员账号配置
 * - 开发环境:使用默认写死的 admin / admin123
 * - 其他环境:必须通过环境变量 ADMIN_USERNAME / ADMIN_PASSWORD 配置
 */
export const adminConfig = {
  username: process.env.ADMIN_USERNAME || (NODE_ENV === 'development' ? 'admin' : ''),
  password: process.env.ADMIN_PASSWORD || (NODE_ENV === 'development' ? 'admin123' : ''),
}
