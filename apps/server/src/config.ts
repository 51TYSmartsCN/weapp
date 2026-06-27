import dotenv from 'dotenv'

// 加载 .env 环境变量
dotenv.config()

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
