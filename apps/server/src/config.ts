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

/** 服务监听地址 */
export const host: string = process.env.HOST || (isProduction ? '127.0.0.1' : '0.0.0.0')

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

/** 微信小店购后承接配置 */
export const fulfillmentConfig = {
  redeemSalt: process.env.FULFILLMENT_REDEEM_SALT || jwtConfig.secret,
  claimSalt: process.env.FULFILLMENT_CLAIM_SALT || jwtConfig.secret,
  claimPage: process.env.FULFILLMENT_CLAIM_PAGE || '/pages/video-unlock/index',
  claimExpireDays: Number(process.env.FULFILLMENT_CLAIM_EXPIRE_DAYS || 90),
  urlLinkExpireDays: Number(process.env.FULFILLMENT_URL_LINK_EXPIRE_DAYS || 30),
}

/** 微信小店订单回调配置(小程序消息推送机制)
 * - callbackToken:在 mp.weixin.qq.com → 开发管理 → 消息推送配置 中设置的 Token
 * - encodingAESKey:消息加密密钥,43位 base64,对应小程序后台 EncodingAESKey
 * - mockMode:仅开发联调时跳过签名校验；不再提供 mock 下单/发货接口
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

/** 视频号小店 Webhook 配置(独立于微信小店消息推送)
 * - 对接指南: 对接.md
 * - token / encodingAESKey: 在微信小店后台「服务市场 → 自研 → 消息推送」中配置
 * - appId / appSecret: 微信小店主体的接口凭证,用于调用 stable_token → access_token → 发货/客服消息等 API
 *   获取入口: 微信小店商家后台(store.weixin.qq.com 或 channels.weixin.qq.com/shop)
 *             → 服务市场 → 自研(右上角)
 *   注意:与小程序 AppID 不同,AppSecret 只在「重置」时显示一次,必须立即保存
 *   IP 白名单:获取 access_token 前需在「自研」页面下方添加服务器公网 IP
 * - mockMode: 非生产环境且未配置 token 时自动开启,跳过签名校验便于本地调试
 *
 * 回调 URL: https://你的域名/api/channels/webhook
 * API 域名: https://api.weixin.qq.com (路径前缀 /channels/ec/... 历史沿用)
 *
 * 注:跳转目标小程序 AppID 直接复用 WECHAT_APPID(本项目小店购买流程即跳转本小程序),
 *    无需单独配置 MINI_PROGRAM_APP_ID。
 */
const channelsToken = process.env.CHANNELS_TOKEN || ''
const channelsEncodingAESKey = process.env.CHANNELS_ENCODING_AES_KEY || ''
export const channelsConfig = {
  token: channelsToken,
  encodingAESKey: channelsEncodingAESKey,
  appId: process.env.CHANNELS_APP_ID || '',
  appSecret: process.env.CHANNELS_APP_SECRET || '',
  confirmDeliveryPath: process.env.CHANNELS_CONFIRM_DELIVERY_PATH || '/order/confirm_delivery',
  mockMode: isProduction ? false : process.env.CHANNELS_MOCK === '1' || !channelsToken,
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
