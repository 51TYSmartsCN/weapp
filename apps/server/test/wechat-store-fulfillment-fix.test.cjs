const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')

const channelsApiModulePath = path.resolve(__dirname, '../dist/services/channels-api.js')
const wxshopModulePath = path.resolve(__dirname, '../dist/routes/wxshop.js')

function loadModule(modulePath) {
  delete require.cache[modulePath]
  return require(modulePath)
}

test('course delivery payload includes product infos and miniapp course path', () => {
  const channelsApi = loadModule(channelsApiModulePath)

  const payload = channelsApi.buildCourseDeliveryRequest({
    orderId: 'wx-order-1',
    productInfos: [{ product_id: 'p1', sku_id: 'sku1' }],
    miniappAppId: 'wx123',
    miniappPath: 'pages/video-unlock/index?token=abc',
  })

  assert.deepEqual(payload, {
    order_id: 'wx-order-1',
    delivery_list: [
      {
        deliver_type: 3,
        product_infos: [{ product_id: 'p1', sku_id: 'sku1' }],
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
})
