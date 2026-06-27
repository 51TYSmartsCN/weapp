import { orders } from '../data'
import { OrderStatus } from '../types'
import type { CreateOrderPayload, Order } from '../types'
import type { RequestOptions } from './config'
import { shouldUseLocal } from './config'
import { request } from './request'

/** 创建订单 */
export async function createOrder(payload: CreateOrderPayload, options?: RequestOptions): Promise<Order> {
  if (shouldUseLocal(options)) {
    return {
      id: Date.now(),
      orderNo: `GEO${Date.now()}`,
      userId: 0,
      courseId: payload.courseId,
      amount: 0,
      couponId: payload.couponId,
      status: OrderStatus.Pending,
      createdAt: new Date().toISOString(),
    }
  }
  // TODO: return Taro.request({ url: '/api/orders', method: 'POST', data: payload })
  return request<Order>({ url: '/api/orders', method: 'POST', data: payload })
}

/** 获取当前用户订单列表 */
export async function getOrders(options?: RequestOptions): Promise<Order[]> {
  if (shouldUseLocal(options)) return orders
  // TODO: return Taro.request({ url: '/api/orders' })
  return request<Order[]>({ url: '/api/orders', method: 'GET' })
}

/** 根据 ID 获取订单详情 */
export async function getOrderById(id: number, options?: RequestOptions): Promise<Order | undefined> {
  if (shouldUseLocal(options)) return undefined
  // TODO: return Taro.request({ url: `/api/orders/${id}` })
  return request<Order | undefined>({ url: `/api/orders/${id}`, method: 'GET' })
}
