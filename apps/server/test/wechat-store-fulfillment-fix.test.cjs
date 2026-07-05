const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')

const channelsApiModulePath = path.resolve(__dirname, '../dist/services/channels-api.js')
const dbModulePath = path.resolve(__dirname, '../dist/db.js')
const wxshopModulePath = path.resolve(__dirname, '../dist/routes/wxshop.js')
const channelsWebhookModulePath = path.resolve(__dirname, '../dist/routes/channels-webhook.js')
const autoDeliveryModulePath = path.resolve(__dirname, '../dist/services/wechat-store-auto-delivery.js')
const fulfillmentModulePath = path.resolve(__dirname, '../dist/services/wechat-store-fulfillment.js')

function loadModule(modulePath) {
  delete require.cache[modulePath]
  return require(modulePath)
}

function loadWxshopWithMockPool(pool) {
  delete require.cache[wxshopModulePath]
  require.cache[dbModulePath] = {
    id: dbModulePath,
    filename: dbModulePath,
    loaded: true,
    exports: { pool },
  }
  return require(wxshopModulePath)
}

function loadAutoDeliveryWithMocks({ fulfillmentModule, channelsApiModule }) {
  delete require.cache[autoDeliveryModulePath]
  require.cache[fulfillmentModulePath] = {
    id: fulfillmentModulePath,
    filename: fulfillmentModulePath,
    loaded: true,
    exports: fulfillmentModule,
  }
  require.cache[channelsApiModulePath] = {
    id: channelsApiModulePath,
    filename: channelsApiModulePath,
    loaded: true,
    exports: channelsApiModule,
  }
  return require(autoDeliveryModulePath)
}

function loadFulfillmentWithMockPool(pool) {
  delete require.cache[fulfillmentModulePath]
  require.cache[dbModulePath] = {
    id: dbModulePath,
    filename: dbModulePath,
    loaded: true,
    exports: { pool },
  }
  return require(fulfillmentModulePath)
}

test('course delivery payload includes product infos and miniapp course path', () => {
  const channelsApi = loadModule(channelsApiModulePath)

  const payload = channelsApi.buildCourseDeliveryRequest({
    orderId: 'wx-order-1',
    productInfos: [{ product_id: 'p1', sku_id: 'sku1', sku_cnt: 2 }],
    miniappAppId: 'wx123',
    miniappPath: 'pages/video-unlock/index?token=abc',
  })

  assert.deepEqual(payload, {
    order_id: 'wx-order-1',
    delivery_list: [
      {
        deliver_type: 3,
        product_infos: [{ product_id: 'p1', sku_id: 'sku1', product_cnt: 2 }],
        course_info: {
          course_path: {
            type: 0,
            wxa_appid: 'wx123',
            wxa_path: 'pages/video-unlock/index?token=abc',
          },
        },
      },
    ],
  })
})

test('channels webhook recognizes official wxshop message push query signatures', () => {
  const channelsWebhook = loadModule(channelsWebhookModulePath)

  assert.equal(
    channelsWebhook.isOfficialWxshopMessagePushRequest({
      query: {
        signature: 'plain-signature',
        timestamp: '1783235777',
        nonce: '1849150504',
        encrypt_type: 'aes',
        msg_signature: 'encrypted-signature',
      },
      headers: {},
    }),
    true
  )
  assert.equal(
    channelsWebhook.generateOfficialWxshopMessageSignature(
      'token',
      '1714112445',
      '415670741',
      'EncryptValue'
    ),
    '03de89c50e642c93033dd7f4ef86a8356e80e345'
  )
})

test('channels webhook accepts official wxshop order paid event name', () => {
  const channelsWebhook = loadModule(channelsWebhookModulePath)

  const event = channelsWebhook.extractOfficialWxshopPaidEvent({
    ToUserName: 'gh_store',
    FromUserName: 'buyer-openid',
    CreateTime: 1783235777,
    MsgType: 'event',
    Event: 'channels_ec_order_pay',
    order_info: {
      order_id: 3737550999277696000,
      pay_time: 1783235777,
    },
  })

  assert.deepEqual(event, {
    orderId: '3737550999277696000',
    buyerOpenid: 'buyer-openid',
    payTime: 1783235777,
  })
})

test('channels webhook preserves large numeric wxshop order ids from JSON text', () => {
  const channelsWebhook = loadModule(channelsWebhookModulePath)

  const payload = channelsWebhook.parseWxshopJsonPreservingLargeIntegers(
    '{"Event":"channels_ec_order_pay","order_info":{"order_id":3737552192816962560,"pay_time":1783240349}}'
  )
  const event = channelsWebhook.extractOfficialWxshopPaidEvent(payload)

  assert.equal(payload.order_info.order_id, '3737552192816962560')
  assert.equal(event.orderId, '3737552192816962560')
})

test('course resolution prefers order detail product infos', async () => {
  const wxshop = loadModule(wxshopModulePath)
  let seenProductId = null

  const courseId = await wxshop.resolveCourseIdFromProductInfos(
    [
      {
        product_id: 'prod-301',
        sku_id: 'sku-1',
      },
    ],
    async (productId) => {
      seenProductId = productId
      return 301
    }
  )

  assert.equal(courseId, 301)
  assert.equal(seenProductId, 'prod-301')
})

test('order detail helpers normalize buyer and pay time', () => {
  const channelsApi = loadModule(channelsApiModulePath)

  assert.equal(
    channelsApi.pickBuyerOpenidFromOrderDetail({ openid: 'buyer-openid' }),
    'buyer-openid'
  )
  assert.equal(
    channelsApi.pickPaidAtFromOrderDetail({ pay_time: 1720000000 }),
    '2024-07-03 09:46:40'
  )
  assert.equal(
    channelsApi.pickAmountFromOrderDetail({
      order_detail: {
        product_infos: [
          { real_price: 990 },
        ],
      },
    }),
    9.9
  )
})

test('wxshop auto-created users use a non-null placeholder avatar', async () => {
  const queries = []
  const pool = {
    async query(sql, params) {
      queries.push({ sql, params })
      if (String(sql).startsWith('SELECT id FROM users')) {
        return queries.length === 1 ? [[]] : [[{ id: 123 }]]
      }
      if (String(sql).startsWith('INSERT INTO users')) {
        return [{ affectedRows: 1 }]
      }
      throw new Error(`unexpected query: ${sql}`)
    },
  }
  const wxshop = loadWxshopWithMockPool(pool)

  const userId = await wxshop.findOrCreateUserByOpenid('buyer-openid')

  const insertQuery = queries.find((query) => String(query.sql).startsWith('INSERT INTO users'))
  assert.equal(userId, 123)
  assert.ok(insertQuery, 'expected user insert query')
  assert.equal(typeof insertQuery.params[2], 'string')
  assert.notEqual(insertQuery.params[2], '')
})

test('auto delivery treats wxshop already-delivered response as idempotent success', async () => {
  const deliveryLogCalls = []
  const autoDelivery = loadAutoDeliveryWithMocks({
    fulfillmentModule: {
      async createPostPurchaseFulfillment() {
        return {
          storeOrderId: '3737552406199290368',
          courseId: 7,
          courseTitle: '中小企业GEO优化2天课',
          entitlementId: 1,
          redeemCode: 'GEO-TEST-0001',
          claimToken: 'token',
          shortCode: 'SHORTCODE',
          urlLink: 'https://example.com/claim',
          qrcodeUrl: null,
          fulfillmentText: 'text',
        }
      },
      async markStoreDelivery(...args) {
        deliveryLogCalls.push(args)
      },
    },
    channelsApiModule: {
      async deliverVirtualOrder() {
        throw Object.assign(
          new Error('发货失败: errcode=109001 errmsg=当前订单已经发货完成，不能重复发货'),
          { errcode: 109001 }
        )
      },
    },
  })

  const result = await autoDelivery.createAndDeliverPostPurchaseFulfillment({
    storeOrderId: '3737552406199290368',
    courseId: 7,
    sourceScene: 'store',
  })

  assert.equal(result.delivered, true)
  assert.equal(result.deliveryError, undefined)
  assert.equal(deliveryLogCalls.length, 1)
  assert.equal(deliveryLogCalls[0][0], '3737552406199290368')
  assert.equal(deliveryLogCalls[0][1], 'success')
})

test('markStoreDelivery does not downgrade a delivered store order to failed', async () => {
  let fulfillmentStatus = 'delivered'
  const queries = []
  const pool = {
    async query(sql, params) {
      queries.push({ sql, params })
      if (String(sql).startsWith('INSERT INTO fulfillment_logs')) {
        return [{ affectedRows: 1 }]
      }
      if (String(sql).startsWith('UPDATE wechat_store_orders')) {
        if (fulfillmentStatus === 'delivered' && params.includes('failed')) {
          fulfillmentStatus = 'failed'
        }
        return [{ affectedRows: 1 }]
      }
      throw new Error(`unexpected query: ${sql}`)
    },
  }
  const fulfillment = loadFulfillmentWithMockPool(pool)

  await fulfillment.markStoreDelivery(
    '3737552406199290368',
    'failed',
    { autoDelivery: true },
    '发货失败: errcode=109001 errmsg=当前订单已经发货完成，不能重复发货'
  )

  const updateQuery = queries.find((query) => String(query.sql).startsWith('UPDATE wechat_store_orders'))
  assert.ok(updateQuery, 'expected store order update query')
  assert.match(updateQuery.sql, /fulfillment_status <> 'delivered'/)
  assert.equal(fulfillmentStatus, 'delivered')
})
