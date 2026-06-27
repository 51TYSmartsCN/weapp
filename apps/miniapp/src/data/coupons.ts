import { CouponStatus, CouponType } from '../types'
import type { Coupon } from '../types'

/** 优惠券列表（覆盖未使用 / 已使用 / 已过期三种状态，以及满减 / 折扣两种类型） */
export const coupons: Coupon[] = [
  {
    id: 1,
    userId: 1,
    code: 'NEWUSER50',
    type: CouponType.Discount,
    value: 50,
    minAmount: 200,
    expireAt: '2026-12-31T23:59:59.000Z',
    status: CouponStatus.Unused,
    createdAt: '2026-04-01T00:00:00.000Z',
  },
  {
    id: 2,
    userId: 1,
    code: 'GEO100',
    type: CouponType.Discount,
    value: 100,
    minAmount: 500,
    expireAt: '2026-12-31T23:59:59.000Z',
    status: CouponStatus.Used,
    createdAt: '2026-04-01T00:00:00.000Z',
  },
  {
    id: 3,
    userId: 1,
    code: 'VIP8',
    type: CouponType.Rate,
    value: 8,
    minAmount: 0,
    expireAt: '2026-12-31T23:59:59.000Z',
    status: CouponStatus.Unused,
    createdAt: '2026-05-10T00:00:00.000Z',
  },
  {
    id: 4,
    userId: 1,
    code: 'EXPIRED20',
    type: CouponType.Discount,
    value: 20,
    minAmount: 100,
    expireAt: '2026-05-31T23:59:59.000Z',
    status: CouponStatus.Expired,
    createdAt: '2026-03-01T00:00:00.000Z',
  },
]
