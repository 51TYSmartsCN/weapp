import crypto from 'crypto'
import type { PoolConnection, ResultSetHeader } from 'mysql2/promise'
import { pool } from '../db'
import { fulfillmentConfig } from '../config'
import { generateMiniappUrlLink, generateUnlimitedQRCode } from './wechat-miniapp-api'

export type StoreSourceScene =
  | 'miniapp'
  | 'channels_video'
  | 'channels_live'
  | 'channels_showcase'
  | 'store'
  | 'unknown'

export interface CreateFulfillmentInput {
  storeOrderId: string
  courseId: number
  sourceScene: StoreSourceScene
  storeProductId?: string
  storeSkuId?: string
  buyerOpenid?: string
  buyerUnionid?: string
  paidAt?: string
  rawPayload?: unknown
}

export interface FulfillmentResult {
  storeOrderId: string
  courseId: number
  courseTitle: string
  entitlementId: number
  redeemCode: string
  claimToken: string
  shortCode: string
  urlLink: string
  qrcodeUrl: string | null
  fulfillmentText: string
}

export interface ClaimStatus {
  status: 'active' | 'claimed_current_user' | 'claimed_other_user' | 'revoked' | 'expired' | 'not_found'
  courseId?: number
  courseTitle?: string
  orderStatus?: string
  claimStatus?: string
  requiresLogin: boolean
}

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex')
}

function hashRedeemCode(code: string): string {
  return sha256(`${code}:${fulfillmentConfig.redeemSalt}`)
}

function hashClaimToken(token: string): string {
  return sha256(`${token}:${fulfillmentConfig.claimSalt}`)
}

function randomCode(length: number): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = crypto.randomBytes(length)
  let code = ''
  for (let i = 0; i < length; i++) {
    code += chars[bytes[i] % chars.length]
  }
  return code
}

function generateRedeemCode(): string {
  return `GEO-${randomCode(4)}-${randomCode(4)}`
}

function generateClaimToken(): string {
  return crypto.randomBytes(24).toString('base64url')
}

function generateShortCode(): string {
  return randomCode(20)
}

function toMysqlDate(date: Date): string {
  return date.toISOString().slice(0, 19).replace('T', ' ')
}

function getExpiresAt(days: number): string {
  return toMysqlDate(new Date(Date.now() + days * 24 * 60 * 60 * 1000))
}

async function getCourseTitle(courseId: number): Promise<string> {
  const [rows] = await pool.query('SELECT title FROM courses WHERE id = ? LIMIT 1', [courseId])
  return (rows as any[])[0]?.title || `课程 ${courseId}`
}

async function logFulfillment(
  storeOrderId: string,
  channel: string,
  status: 'success' | 'failed' | 'retrying',
  payload?: unknown,
  errorMessage?: string
) {
  await pool.query(
    `INSERT INTO fulfillment_logs (store_order_id, channel, status, payload, error_message)
     VALUES (?, ?, ?, ?, ?)`,
    [
      storeOrderId,
      channel,
      status,
      payload == null ? null : JSON.stringify(payload),
      errorMessage ? errorMessage.slice(0, 512) : null,
    ]
  )
}

async function createOrderAndItem(input: CreateFulfillmentInput): Promise<number> {
  const productId = input.storeProductId || `course:${input.courseId}`
  const skuId = input.storeSkuId || ''

  await pool.query(
    `INSERT INTO wechat_store_orders
       (store_order_id, source_scene, buyer_openid, buyer_unionid, pay_status, fulfillment_status, raw_payload, paid_at)
     VALUES (?, ?, ?, ?, 'paid', 'pending', ?, ?)
     ON DUPLICATE KEY UPDATE
       source_scene = VALUES(source_scene),
       buyer_openid = COALESCE(VALUES(buyer_openid), buyer_openid),
       buyer_unionid = COALESCE(VALUES(buyer_unionid), buyer_unionid),
       pay_status = 'paid',
       raw_payload = COALESCE(VALUES(raw_payload), raw_payload),
       paid_at = COALESCE(VALUES(paid_at), paid_at)`,
    [
      input.storeOrderId,
      input.sourceScene,
      input.buyerOpenid || null,
      input.buyerUnionid || null,
      input.rawPayload == null ? null : JSON.stringify(input.rawPayload),
      input.paidAt || null,
    ]
  )

  await pool.query(
    `INSERT INTO wechat_store_order_items
       (store_order_id, store_product_id, store_sku_id, course_id, quantity, item_status)
     VALUES (?, ?, ?, ?, 1, 'paid')
     ON DUPLICATE KEY UPDATE course_id = VALUES(course_id), item_status = 'paid'`,
    [input.storeOrderId, productId, skuId, input.courseId]
  )

  const [itemRows] = await pool.query(
    `SELECT id FROM wechat_store_order_items
     WHERE store_order_id = ? AND store_product_id = ? AND store_sku_id = ?
     LIMIT 1`,
    [input.storeOrderId, productId, skuId]
  )
  return Number((itemRows as any[])[0].id)
}

async function getOrCreateEntitlement(input: CreateFulfillmentInput, itemId: number): Promise<number> {
  await pool.query(
    `INSERT INTO course_entitlements
       (course_id, source_type, source_order_id, source_order_item_id, status)
     VALUES (?, 'wechat_store', ?, ?, 'unclaimed')
     ON DUPLICATE KEY UPDATE course_id = VALUES(course_id)`,
    [input.courseId, input.storeOrderId, itemId]
  )

  const [rows] = await pool.query(
    `SELECT id FROM course_entitlements
     WHERE source_type = 'wechat_store' AND source_order_item_id = ?
     LIMIT 1`,
    [itemId]
  )
  return Number((rows as any[])[0].id)
}

async function getOrCreateRedeemCode(entitlementId: number, courseId: number, storeOrderId: string): Promise<string> {
  const [existingRows] = await pool.query(
    'SELECT code FROM redeem_codes WHERE entitlement_id = ? LIMIT 1',
    [entitlementId]
  )
  const existing = (existingRows as any[])[0]
  if (existing?.code) return String(existing.code)

  for (let i = 0; i < 5; i++) {
    const code = generateRedeemCode()
    try {
      await pool.query(
        `INSERT INTO redeem_codes
           (code, code_hash, code_suffix, entitlement_id, course_id, order_no, status, expire_at)
         VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
        [
          code,
          hashRedeemCode(code),
          code.slice(-4),
          entitlementId,
          courseId,
          storeOrderId,
          getExpiresAt(fulfillmentConfig.claimExpireDays),
        ]
      )
      return code
    } catch (err: any) {
      if (err.code === 'ER_DUP_ENTRY') continue
      throw err
    }
  }
  throw new Error('生成兑换码失败：多次重试仍冲突')
}

async function getOrCreateClaimToken(entitlementId: number, storeOrderId: string): Promise<{
  claimToken: string
  shortCode: string
  urlLink: string
  qrcodeUrl: string | null
}> {
  const [existingRows] = await pool.query(
    'SELECT short_code, url_link, qrcode_url FROM claim_tokens WHERE entitlement_id = ? LIMIT 1',
    [entitlementId]
  )
  const existing = (existingRows as any[])[0]
  if (existing?.url_link) {
    return {
      claimToken: '',
      shortCode: String(existing.short_code),
      urlLink: String(existing.url_link),
      qrcodeUrl: existing.qrcode_url || null,
    }
  }

  for (let i = 0; i < 5; i++) {
    const claimToken = generateClaimToken()
    const shortCode = generateShortCode()
    const query = `token=${encodeURIComponent(claimToken)}&source=wechat_store`
    let urlLink = ''
    let qrcodeUrl: string | null = null

    try {
      urlLink = await generateMiniappUrlLink(query)
      await logFulfillment(storeOrderId, 'url_link', 'success', { shortCode })
    } catch (err) {
      await logFulfillment(storeOrderId, 'url_link', 'failed', { shortCode }, err instanceof Error ? err.message : String(err))
      throw err
    }

    try {
      qrcodeUrl = await generateUnlimitedQRCode(shortCode)
      await logFulfillment(storeOrderId, 'qrcode', qrcodeUrl ? 'success' : 'retrying', { shortCode, qrcodeUrl })
    } catch (err) {
      await logFulfillment(storeOrderId, 'qrcode', 'retrying', { shortCode }, err instanceof Error ? err.message : String(err))
    }

    try {
      await pool.query(
        `INSERT INTO claim_tokens
           (token_hash, short_code, entitlement_id, store_order_id, url_link, qrcode_url, status, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`,
        [
          hashClaimToken(claimToken),
          shortCode,
          entitlementId,
          storeOrderId,
          urlLink,
          qrcodeUrl,
          getExpiresAt(fulfillmentConfig.claimExpireDays),
        ]
      )
      return { claimToken, shortCode, urlLink, qrcodeUrl }
    } catch (err: any) {
      if (err.code === 'ER_DUP_ENTRY') continue
      throw err
    }
  }

  throw new Error('生成 claimToken 失败：多次重试仍冲突')
}

function renderFulfillmentText(input: {
  courseTitle: string
  urlLink: string
  redeemCode: string
  qrcodeUrl: string | null
  storeOrderId: string
}): string {
  const note = `您购买的《${input.courseTitle}》已生成学习权益。
兑换码：${input.redeemCode}
点击前往学习：${input.urlLink}
也可打开 GEO 课程小程序，进入「我的 - 兑换课程」输入兑换码。
如已兑换但无法观看，请联系客服并提供订单号：${input.storeOrderId}`

  // 微信小店 delivery_note 当前限制 1000 字符，保留核心入口并做兜底。
  if (note.length <= 1000) return note

  return `兑换码：${input.redeemCode}
点击前往学习：${input.urlLink}
订单号：${input.storeOrderId}`.slice(0, 1000)
}

export async function createPostPurchaseFulfillment(input: CreateFulfillmentInput): Promise<FulfillmentResult> {
  const itemId = await createOrderAndItem(input)
  const entitlementId = await getOrCreateEntitlement(input, itemId)
  const courseTitle = await getCourseTitle(input.courseId)
  const redeemCode = await getOrCreateRedeemCode(entitlementId, input.courseId, input.storeOrderId)
  await logFulfillment(input.storeOrderId, 'redeem_code', 'success', { codeSuffix: redeemCode.slice(-4) })

  const claim = await getOrCreateClaimToken(entitlementId, input.storeOrderId)
  const fulfillmentText = renderFulfillmentText({
    courseTitle,
    urlLink: claim.urlLink,
    redeemCode,
    qrcodeUrl: claim.qrcodeUrl,
    storeOrderId: input.storeOrderId,
  })

  await pool.query(
    `UPDATE wechat_store_orders SET fulfillment_status = 'ready'
     WHERE store_order_id = ? AND fulfillment_status <> 'delivered'`,
    [input.storeOrderId]
  )

  return {
    storeOrderId: input.storeOrderId,
    courseId: input.courseId,
    courseTitle,
    entitlementId,
    redeemCode,
    claimToken: claim.claimToken,
    shortCode: claim.shortCode,
    urlLink: claim.urlLink,
    qrcodeUrl: claim.qrcodeUrl,
    fulfillmentText,
  }
}

async function findClaimByToken(token: string): Promise<any | null> {
  const [rows] = await pool.query(
    `SELECT ct.*, ce.course_id, ce.user_id, ce.status AS entitlement_status,
            c.title AS course_title, wso.pay_status
     FROM claim_tokens ct
     JOIN course_entitlements ce ON ce.id = ct.entitlement_id
     JOIN courses c ON c.id = ce.course_id
     LEFT JOIN wechat_store_orders wso ON wso.store_order_id = ct.store_order_id
     WHERE ct.token_hash = ?
     LIMIT 1`,
    [hashClaimToken(token)]
  )
  return (rows as any[])[0] || null
}

async function findClaimByScene(scene: string): Promise<any | null> {
  const [rows] = await pool.query(
    `SELECT ct.*, ce.course_id, ce.user_id, ce.status AS entitlement_status,
            c.title AS course_title, wso.pay_status
     FROM claim_tokens ct
     JOIN course_entitlements ce ON ce.id = ct.entitlement_id
     JOIN courses c ON c.id = ce.course_id
     LEFT JOIN wechat_store_orders wso ON wso.store_order_id = ct.store_order_id
     WHERE ct.short_code = ?
     LIMIT 1`,
    [scene]
  )
  return (rows as any[])[0] || null
}

function toClaimStatus(row: any | null, userId?: number): ClaimStatus {
  if (!row) return { status: 'not_found', requiresLogin: false }
  if (row.status === 'revoked' || row.entitlement_status === 'revoked' || row.pay_status === 'refunded') {
    return { status: 'revoked', requiresLogin: false, courseId: Number(row.course_id), courseTitle: row.course_title }
  }
  if (
    row.status === 'expired' ||
    row.entitlement_status === 'expired' ||
    (row.expires_at && new Date(row.expires_at).getTime() < Date.now())
  ) {
    return { status: 'expired', requiresLogin: false, courseId: Number(row.course_id), courseTitle: row.course_title }
  }
  if (row.user_id) {
    return {
      status: userId && Number(row.user_id) === userId ? 'claimed_current_user' : 'claimed_other_user',
      courseId: Number(row.course_id),
      courseTitle: row.course_title,
      orderStatus: row.pay_status || 'paid',
      claimStatus: row.entitlement_status,
      requiresLogin: false,
    }
  }
  return {
    status: 'active',
    courseId: Number(row.course_id),
    courseTitle: row.course_title,
    orderStatus: row.pay_status || 'paid',
    claimStatus: row.entitlement_status,
    requiresLogin: !userId,
  }
}

export async function getClaimTokenStatus(token: string, userId?: number): Promise<ClaimStatus> {
  return toClaimStatus(await findClaimByToken(token), userId)
}

export async function getClaimSceneStatus(scene: string, userId?: number): Promise<ClaimStatus> {
  return toClaimStatus(await findClaimByScene(scene), userId)
}

async function unlockCourseForUser(conn: PoolConnection, userId: number, courseId: number): Promise<void> {
  const [lessonCountRows] = await conn.query('SELECT COUNT(*) AS cnt FROM lessons WHERE course_id = ?', [courseId])
  const totalLessons = (lessonCountRows as any[])[0].cnt

  const [ucResult] = await conn.query<ResultSetHeader>(
    `INSERT IGNORE INTO user_courses (user_id, course_id, status, total_lessons, created_at, updated_at)
     VALUES (?, ?, 0, ?, NOW(), NOW())`,
    [userId, courseId, totalLessons]
  )

  if (ucResult.affectedRows > 0) {
    await conn.query('UPDATE users SET bought_courses = bought_courses + 1 WHERE id = ?', [userId])
  }
}

async function claimRow(row: any, userId: number): Promise<ClaimStatus> {
  const current = toClaimStatus(row, userId)
  if (current.status !== 'active') return current

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    const [updateResult] = await conn.query<ResultSetHeader>(
      `UPDATE course_entitlements
       SET user_id = ?, status = 'active', claimed_at = NOW()
       WHERE id = ? AND user_id IS NULL AND status = 'unclaimed'`,
      [userId, row.entitlement_id]
    )

    if (updateResult.affectedRows === 0) {
      await conn.rollback()
      return {
        status: 'claimed_other_user',
        courseId: Number(row.course_id),
        courseTitle: row.course_title,
        orderStatus: row.pay_status || 'paid',
        claimStatus: row.entitlement_status,
        requiresLogin: false,
      }
    }

    await conn.query(
      `UPDATE claim_tokens SET status = 'claimed'
       WHERE id = ? AND status = 'active'`,
      [row.id]
    )
    await conn.query(
      `UPDATE redeem_codes SET status = 1, user_id = ?, used_at = NOW()
       WHERE entitlement_id = ? AND status = 0`,
      [userId, row.entitlement_id]
    )
    await unlockCourseForUser(conn, userId, Number(row.course_id))
    await conn.commit()
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }

  return {
    status: 'claimed_current_user',
    courseId: Number(row.course_id),
    courseTitle: row.course_title,
    orderStatus: row.pay_status || 'paid',
    claimStatus: 'active',
    requiresLogin: false,
  }
}

export async function claimByToken(token: string, userId: number): Promise<ClaimStatus> {
  const row = await findClaimByToken(token)
  if (!row) return { status: 'not_found', requiresLogin: false }
  return claimRow(row, userId)
}

export async function claimByScene(scene: string, userId: number): Promise<ClaimStatus> {
  const row = await findClaimByScene(scene)
  if (!row) return { status: 'not_found', requiresLogin: false }
  return claimRow(row, userId)
}

export async function claimRedeemCode(code: string, userId: number): Promise<ClaimStatus> {
  const codeHash = hashRedeemCode(code)
  const [rows] = await pool.query(
    `SELECT rc.*, ce.id AS entitlement_id, ce.user_id AS entitlement_user_id,
            ce.status AS entitlement_status, c.id AS course_id, c.title AS course_title,
            wso.pay_status
     FROM redeem_codes rc
     LEFT JOIN course_entitlements ce ON ce.id = rc.entitlement_id
     JOIN courses c ON c.id = rc.course_id
     LEFT JOIN wechat_store_orders wso ON wso.store_order_id = rc.order_no
     WHERE rc.code_hash = ? OR rc.code = ?
     LIMIT 1`,
    [codeHash, code]
  )
  const row = (rows as any[])[0]
  if (!row) return { status: 'not_found', requiresLogin: false }
  if (row.status === 1) {
    return {
      status: row.user_id && Number(row.user_id) === userId ? 'claimed_current_user' : 'claimed_other_user',
      courseId: Number(row.course_id),
      courseTitle: row.course_title,
      requiresLogin: false,
    }
  }
  if (row.status === 2 || row.entitlement_status === 'revoked' || row.pay_status === 'refunded') {
    return { status: 'revoked', courseId: Number(row.course_id), courseTitle: row.course_title, requiresLogin: false }
  }
  if (row.expire_at && new Date(row.expire_at).getTime() < Date.now()) {
    return { status: 'expired', courseId: Number(row.course_id), courseTitle: row.course_title, requiresLogin: false }
  }

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    await conn.query(
      'UPDATE redeem_codes SET status = 1, user_id = ?, used_at = NOW() WHERE id = ? AND status = 0',
      [userId, row.id]
    )
    if (row.entitlement_id) {
      await conn.query(
        `UPDATE course_entitlements
         SET user_id = COALESCE(user_id, ?), status = 'active', claimed_at = COALESCE(claimed_at, NOW())
         WHERE id = ? AND status <> 'revoked'`,
        [userId, row.entitlement_id]
      )
      await conn.query(
        `UPDATE claim_tokens SET status = 'claimed'
         WHERE entitlement_id = ? AND status = 'active'`,
        [row.entitlement_id]
      )
    }
    await unlockCourseForUser(conn, userId, Number(row.course_id))
    await conn.commit()
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }

  return {
    status: 'claimed_current_user',
    courseId: Number(row.course_id),
    courseTitle: row.course_title,
    requiresLogin: false,
  }
}

export async function markStoreDelivery(
  storeOrderId: string,
  status: 'success' | 'failed',
  payload?: unknown,
  errorMessage?: string
): Promise<void> {
  await logFulfillment(storeOrderId, 'store_delivery', status, payload, errorMessage)
  await pool.query(
    `UPDATE wechat_store_orders SET fulfillment_status = ?
     WHERE store_order_id = ?`,
    [status === 'success' ? 'delivered' : 'failed', storeOrderId]
  )
}
