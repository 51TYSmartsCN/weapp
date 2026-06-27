import { OrderStatus } from '../types'
import type { Order } from '../types'

/** 订单列表（覆盖已支付 / 待支付 / 已取消三种状态） */
export const orders: Order[] = [
  {
    id: 1,
    orderNo: 'GEO20260501001',
    userId: 1,
    courseId: 1,
    amount: 199,
    status: OrderStatus.Paid,
    payMethod: 'wechat',
    paidAt: '2026-05-01T10:01:00.000Z',
    createdAt: '2026-05-01T10:00:00.000Z',
  },
  {
    id: 2,
    orderNo: 'GEO20260515002',
    userId: 1,
    courseId: 3,
    amount: 599,
    originalAmount: 799,
    status: OrderStatus.Paid,
    payMethod: 'wechat',
    paidAt: '2026-05-15T14:02:00.000Z',
    createdAt: '2026-05-15T14:00:00.000Z',
  },
  {
    id: 3,
    orderNo: 'GEO20260620003',
    userId: 1,
    courseId: 4,
    amount: 249,
    status: OrderStatus.Pending,
    createdAt: '2026-06-20T11:00:00.000Z',
  },
  {
    id: 4,
    orderNo: 'GEO20260601004',
    userId: 1,
    courseId: 6,
    amount: 399,
    status: OrderStatus.Cancelled,
    createdAt: '2026-06-01T09:00:00.000Z',
  },
]
