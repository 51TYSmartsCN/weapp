import crypto from 'crypto'

/**
 * 微信消息加解密工具类（视频号小店 Webhook）
 *
 * 对应对接.md 中的 src/server/utils/crypto.ts，使用 Node 内置 crypto 模块实现
 * （不引入 crypto-js，与项目现有 wxshop.ts 风格保持一致）。
 *
 * - GET 验签：sha1(sort(token, timestamp, nonce))
 * - POST 验签：HMAC-SHA256(timestamp + nonce + body, token)
 * - 解密：AES-256-CBC，密钥 = EncodingAESKey 的 base64 解码（32 字节），IV = 密钥前 16 字节
 *   明文结构：16 字节随机串 + 4 字节 msg_len(大端) + msg + appid
 *
 * 类型说明：密钥用 crypto.createSecretKey() 包装为 KeyObject 传入 createDecipheriv，
 * 避免 @types/node v20+ 中 Buffer(Uint8Array<ArrayBufferLike>) 与 CipherKey(Uint8Array<ArrayBuffer>)
 * 的类型不兼容问题。KeyObject 在所有 @types/node 版本中都是合法的 CipherKey。
 */
export class WechatCrypto {
  private token: string
  private encodingAESKey: string
  private key: crypto.KeyObject
  private iv: Buffer

  constructor(token: string, encodingAESKey: string) {
    this.token = token
    this.encodingAESKey = encodingAESKey
    // EncodingAESKey 为 43 位 base64（不含尾部 '='），补齐后解码得到 32 字节密钥
    const keyBytes = Buffer.from(encodingAESKey + '=', 'base64')
    // 用 KeyObject 包装密钥，兼容新旧 @types/node 类型签名
    this.key = crypto.createSecretKey(keyBytes)
    // IV 是密钥的前 16 字节；拷贝一份避免与 key 共享底层 buffer
    this.iv = Buffer.from(keyBytes.subarray(0, 16))
  }

  /**
   * 验证 GET 请求签名（消息推送 URL 校验）
   * 签名算法：sha1(sort([token, timestamp, nonce]).join(''))
   */
  checkSignature(signature: string, timestamp: string, nonce: string): boolean {
    const arr = [this.token, timestamp, nonce].sort()
    const hash = crypto.createHash('sha1').update(arr.join('')).digest('hex')
    return hash === signature
  }

  /**
   * 解密 POST 请求的加密数据（AES-256-CBC）
   * @returns { text: 消息明文, appid: 收件小程序 appid }
   *
   * 明文结构：16 字节随机串 + 4 字节 msg_len(大端) + msg + appid
   * 填充方式：PKCS#7
   *
   * 异常处理：
   * - base64 解码失败 → 抛出"无效的加密数据"
   * - AES 解密失败 → 抛出"解密失败"（密钥/AESKey 错误或数据被篡改）
   * - 明文长度不足 → 抛出"明文长度不足"（数据被截断）
   */
  decrypt(encryptedData: string): { text: string; appid: string } {
    // 1. base64 解码
    let ciphertext: Buffer
    try {
      ciphertext = Buffer.from(encryptedData, 'base64')
    } catch {
      throw new Error('无效的加密数据：base64 解码失败')
    }
    if (ciphertext.length === 0) {
      throw new Error('无效的加密数据：解密后为空')
    }

    // 2. AES-256-CBC 解密（关闭自动 padding，手动处理 PKCS#7）
    let decrypted: Buffer
    try {
      const decipher = crypto.createDecipheriv('aes-256-cbc', this.key, this.iv)
      decipher.setAutoPadding(false)
      const chunks: Buffer[] = []
      const updateRes = decipher.update(ciphertext)
      const finalRes = decipher.final()
      if (Buffer.isBuffer(updateRes)) chunks.push(updateRes)
      if (Buffer.isBuffer(finalRes)) chunks.push(finalRes)
      decrypted = Buffer.concat(chunks)
    } catch (err) {
      throw new Error(`解密失败：${err instanceof Error ? err.message : String(err)}`)
    }

    // 3. 移除 PKCS#7 填充
    const padByte = decrypted[decrypted.length - 1]
    if (padByte >= 1 && padByte <= 32) {
      decrypted = decrypted.subarray(0, decrypted.length - padByte)
    }

    // 4. 解析明文结构：16 字节随机串 + 4 字节 msg_len(大端) + msg + appid
    if (decrypted.length < 20) {
      throw new Error(`明文长度不足：${decrypted.length} < 20`)
    }
    const msgLen = decrypted.readUInt32BE(16)
    if (20 + msgLen > decrypted.length) {
      throw new Error(`明文长度字段异常：msgLen=${msgLen}, 总长=${decrypted.length}`)
    }
    const text = decrypted.subarray(20, 20 + msgLen).toString('utf8')
    const appid = decrypted.subarray(20 + msgLen).toString('utf8')
    return { text, appid }
  }

  /**
   * 生成 POST 请求的 HMAC-SHA256 签名
   * 签名算法：hmac_sha256(timestamp + nonce + body, token).hexdigest()
   *
   * 视频号小店 Webhook 通过 headers 携带 x-wx-timestamp / x-wx-nonce / x-wx-signature，
   * 服务端用同样算法计算并比对。
   */
  generatePostSignature(timestamp: string, nonce: string, body: string): string {
    const message = timestamp + nonce + body
    return crypto.createHmac('sha256', this.token).update(message).digest('hex')
  }
}
