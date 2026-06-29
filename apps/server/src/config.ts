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
  secret: process.env.JWT_SECRET!,
  expiresIn: process.env.JWT_EXPIRES_IN!,
}

/** Admin 登录配置 */
export const adminConfig = {
  username: process.env.ADMIN_USERNAME || 'admin',
  password: process.env.ADMIN_PASSWORD || 'admin123',
}

/** 微信小程序配置 */
export const wechatConfig = {
  appid: process.env.WECHAT_APPID!,
  secret: process.env.WECHAT_SECRET!,
}

/** 微信小店订单回调配置(小程序消息推送机制)
 * - callbackToken:在 mp.weixin.qq.com → 开发管理 → 消息推送配置 中设置的 Token
 * - encodingAESKey:消息加密密钥,43位 base64,对应小程序后台 EncodingAESKey
 * - mockMode:仅 WXSHOP_MOCK=1 时开启,跳过签名校验+允许 mock 接口
 */
export const wxshopConfig = {
  callbackToken: process.env.WXSHOP_CALLBACK_TOKEN!,
  encodingAESKey: process.env.WXSHOP_ENCODING_AES_KEY!,
  mockMode: process.env.WXSHOP_MOCK === '1',
}

/** 后台管理员账号配置
 * - 开发环境:使用默认写死的 admin / admin123
 * - 其他环境:必须通过环境变量 ADMIN_USERNAME / ADMIN_PASSWORD 配置
 */
export const adminConfig = {
  username: process.env.ADMIN_USERNAME || (NODE_ENV === 'development' ? 'admin' : ''),
  password: process.env.ADMIN_PASSWORD || (NODE_ENV === 'development' ? 'admin123' : ''),
}
