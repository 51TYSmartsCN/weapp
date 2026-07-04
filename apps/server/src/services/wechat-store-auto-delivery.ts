import {
  createPostPurchaseFulfillment,
  markStoreDelivery,
  type CreateFulfillmentInput,
  type FulfillmentResult,
} from './wechat-store-fulfillment'
import { fulfillmentConfig } from '../config'
import { deliverVirtualOrder } from './channels-api'

export interface AutoDeliveryResult {
  fulfillment: FulfillmentResult
  delivered: boolean
  deliveryError?: string
}

function buildClaimScenePath(shortCode: string): string {
  const scene = encodeURIComponent(shortCode)
  return `${fulfillmentConfig.claimPage}?scene=${scene}`
}

/**
 * 支付成功后的自动履约入口：
 * 1. 为订单生成兑换码、每单唯一小程序入口和小程序码
 * 2. 调用微信小店课程发货接口，把课程入口绑定到订单商品明细
 *
 * 发货失败默认不抛出，避免微信回调反复重试导致重复噪音；失败状态会写入 fulfillment_logs。
 */
export async function createAndDeliverPostPurchaseFulfillment(input: CreateFulfillmentInput): Promise<AutoDeliveryResult> {
  const fulfillment = await createPostPurchaseFulfillment(input)

  try {
    const delivered = await deliverVirtualOrder({
      orderId: fulfillment.storeOrderId,
      productInfos: input.storeProductInfos && input.storeProductInfos.length > 0
        ? input.storeProductInfos
        : [
          {
            product_id: input.storeProductId || `course:${input.courseId}`,
            sku_id: input.storeSkuId || undefined,
          },
        ],
      miniappPath: buildClaimScenePath(fulfillment.shortCode),
    })
    await markStoreDelivery(fulfillment.storeOrderId, delivered ? 'success' : 'failed', {
      autoDelivery: true,
      deliveryMode: 'course_path',
      shortCode: fulfillment.shortCode,
      sourceScene: input.sourceScene,
    })
    return { fulfillment, delivered }
  } catch (err) {
    const deliveryError = err instanceof Error ? err.message : String(err)
    await markStoreDelivery(
      fulfillment.storeOrderId,
      'failed',
      {
        autoDelivery: true,
        deliveryMode: 'course_path',
        shortCode: fulfillment.shortCode,
        sourceScene: input.sourceScene,
      },
      deliveryError
    )
    return { fulfillment, delivered: false, deliveryError }
  }
}
