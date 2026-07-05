const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')

const channelsApiModulePath = path.resolve(__dirname, '../dist/services/channels-api.js')
const wxshopModulePath = path.resolve(__dirname, '../dist/routes/wxshop.js')
const channelsWebhookModulePath = path.resolve(__dirname, '../dist/routes/channels-webhook.js')

function loadModule(modulePath) {
  delete require.cache[modulePath]
  return require(modulePath)
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
