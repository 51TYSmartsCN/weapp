import { Response } from 'express'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

/** 成功响应：{ code: 0, data } */
export function ok<T>(res: Response, data: T) {
  return res.json({ code: 0, data })
}

/** 失败响应：{ code, message }，HTTP 200 */
export function fail(res: Response, code: number, message: string) {
  return res.json({ code, message })
}

/** 未认证：HTTP 401 */
export function unauthorized(res: Response, message = '未登录') {
  return res.status(401).json({ code: 401, message })
}

/** 无权限：HTTP 403 */
export function forbidden(res: Response, message = '无权限') {
  return res.status(403).json({ code: 403, message })
}

// ==================== URL 签名工具（视频防盗链） ====================

const SIGN_SECRET = process.env.URL_SIGN_SECRET || 'geo-course-sign-secret-2026'
const DEFAULT_SIGN_TTL = 2 * 60 * 60 * 1000 // 2小时

/**
 * 生成带签名的安全参数（用于视频播放等临时授权）
 * @param payload 要签名的参数对象
 * @param ttlMs 有效期（毫秒），默认2小时
 */
export function signUrlPayload(payload: Record<string, any>, ttlMs = DEFAULT_SIGN_TTL): string {
  const expires = Date.now() + ttlMs
  const data = { ...payload, e: expires } as Record<string, any>
  const queryString = Object.keys(data)
    .sort()
    .map((k) => `${k}=${data[k]}`)
    .join('&')
  const sign = crypto.createHmac('sha256', SIGN_SECRET).update(queryString).digest('hex')
  const token = Buffer.from(JSON.stringify({ ...data, s: sign })).toString('base64url')
  return token
}

/**
 * 验证 URL 签名 token
 * @returns 合法则返回 payload（含 expires），非法返回 null
 */
export function verifyUrlToken(token: string): Record<string, any> | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64url').toString('utf-8'))
    const { s: sign, ...payload } = decoded
    if (!sign || typeof sign !== 'string') return null

    const queryString = Object.keys(payload)
      .sort()
      .map((k) => `${k}=${payload[k]}`)
      .join('&')
    const expected = crypto.createHmac('sha256', SIGN_SECRET).update(queryString).digest('hex')

    const sigMatch = crypto.timingSafeEqual(Buffer.from(sign), Buffer.from(expected))
    if (!sigMatch) return null

    if (payload.e && Number(payload.e) < Date.now()) return null

    return payload
  } catch {
    return null
  }
}

// ==================== 图片安全校验工具 ====================

const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png']
const ALLOWED_IMAGE_EXT = ['jpg', 'jpeg', 'png']
const MAX_AVATAR_SIZE = 2 * 1024 * 1024 // 2MB

/**
 * 通过 magic number 判断图片真实类型
 * 支持 JPEG (FF D8 FF)、PNG (89 50 4E 47 0D 0A 1A 0A)
 */
export function detectImageMime(buffer: Buffer): string | null {
  if (buffer.length < 8) return null
  // JPEG
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg'
  }
  // PNG
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png'
  }
  return null
}

/**
 * 校验头像文件安全性
 * @returns { valid: boolean; mime?: string; error?: string }
 */
export function validateAvatarBuffer(
  buffer: Buffer,
  maxSize = MAX_AVATAR_SIZE
): { valid: boolean; mime?: string; error?: string } {
  if (buffer.length > maxSize) {
    return { valid: false, error: `头像大小不能超过 ${maxSize / 1024 / 1024}MB` }
  }
  if (buffer.length < 100) {
    return { valid: false, error: '头像文件过小，可能已损坏' }
  }
  const mime = detectImageMime(buffer)
  if (!mime || !ALLOWED_IMAGE_MIMES.includes(mime)) {
    return { valid: false, error: '仅支持 JPG、PNG 格式的头像图片' }
  }
  return { valid: true, mime }
}

/**
 * 从头像 URL 提取本地文件名（用于清理旧头像）
 */
export function extractAvatarFilename(avatarUrl: string): string | null {
  if (!avatarUrl) return null
  try {
    const url = new URL(avatarUrl)
    const parts = url.pathname.split('/')
    const filename = parts[parts.length - 1]
    if (filename && filename.startsWith('avatar-')) {
      return filename
    }
  } catch {
    // 不是完整 URL 的情况
    const parts = avatarUrl.split('/')
    const filename = parts[parts.length - 1]
    if (filename && filename.startsWith('avatar-')) {
      return filename
    }
  }
  return null
}

/**
 * 安全删除旧头像文件（仅删除 avatars 目录下、avatar- 前缀的文件）
 */
export function safeDeleteAvatar(avatarDir: string, avatarUrl: string) {
  const filename = extractAvatarFilename(avatarUrl)
  if (!filename) return
  const filepath = path.join(avatarDir, filename)
  const resolved = path.resolve(filepath)
  const resolvedDir = path.resolve(avatarDir)
  if (!resolved.startsWith(resolvedDir)) return
  try {
    if (fs.existsSync(resolved)) {
      fs.unlinkSync(resolved)
    }
  } catch (err) {
    console.warn('[utils] 清理旧头像失败:', filename, err)
  }
}
