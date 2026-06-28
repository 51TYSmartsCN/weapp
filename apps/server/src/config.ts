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

dotenv.config({ path: path.resolve(__dirname, '..', '.env') })
dotenv.config({ path: path.resolve(__dirname, '..', envOverrideFile) })

/** 当前运行环境（便于日志/调试） */
export const env: string = NODE_ENV

/** 服务端口 */
export const port: number = Number(process.env.PORT) || 4000

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

/** 微信小店订单回调配置
 * - callbackToken:在小店后台「开发配置 → 订单更新回调」设置的 Token,用于校验签名
 * - callbackSalt:落库订单号时拼接的盐值(可选,增强订单号不可预测性)
 * - mockMode:未配置 callbackToken 或显式设置 WXSHOP_MOCK=1 时,回调接口降级为不校验签名(仅供本地联调)
 */
export const wxshopConfig = {
  callbackToken: process.env.WXSHOP_CALLBACK_TOKEN || '',
  callbackSalt: process.env.WXSHOP_CALLBACK_SALT || 'geo_wxshop_salt',
  mockMode: process.env.WXSHOP_MOCK === '1' || !process.env.WXSHOP_CALLBACK_TOKEN,
}
