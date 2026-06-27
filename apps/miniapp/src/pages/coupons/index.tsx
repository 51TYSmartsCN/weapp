import { useEffect, useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import NavBar from '../../components/NavBar'
import Skeleton from '../../components/Skeleton'
import Icon from '../../components/Icon'
import { getCoupons, showApiError } from '../../services'
import { CouponStatus, CouponType } from '../../types'
import type { Coupon } from '../../types'
import './index.scss'

const COUPON_STATUS_LABEL: Record<CouponStatus, string> = {
  [CouponStatus.Unused]: '可使用',
  [CouponStatus.Used]: '已使用',
  [CouponStatus.Expired]: '已过期',
}

function formatValue(coupon: Coupon): string {
  if (coupon.type === CouponType.Discount) return `¥${coupon.value}`
  return `${coupon.value}折`
}

function formatMinAmount(coupon: Coupon): string {
  if (coupon.minAmount > 0) return `满 ${coupon.minAmount} 可用`
  return '无门槛'
}

function formatDate(iso: string): string {
  return iso.slice(0, 10)
}

export default function Coupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getCoupons()
      .then(setCoupons)
      .catch((err) => showApiError(err, '优惠券加载失败'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <View className='coupons-page'>
      <NavBar title='优惠券' />
      <ScrollView className='coupons-body' scrollY>
        {loading ? (
          <>
            <Skeleton rows={2} horizontal />
            <Skeleton rows={2} horizontal />
            <Skeleton rows={2} horizontal />
          </>
        ) : coupons.length === 0 ? (
          <View className='coupons-empty'>
            <Icon name='ticket' size={96} color='#94A3B8' />
            <Text className='coupons-empty-text'>暂无优惠券</Text>
          </View>
        ) : (
          <View className='coupons-list'>
            {coupons.map((coupon) => {
              const dimmed = coupon.status !== CouponStatus.Unused
              return (
                <View
                  key={coupon.id}
                  className={`coupon-card${dimmed ? ' coupon-card--dimmed' : ''}`}
                >
                  <View className='coupon-left'>
                    <Text className='coupon-value'>{formatValue(coupon)}</Text>
                    <Text className='coupon-type-desc'>
                      {coupon.type === CouponType.Discount ? '满减券' : '折扣券'}
                    </Text>
                  </View>
                  <View className='coupon-right'>
                    <Text className='coupon-code'>{coupon.code}</Text>
                    <Text className='coupon-min'>{formatMinAmount(coupon)}</Text>
                    <Text className='coupon-expire'>有效期至 {formatDate(coupon.expireAt)}</Text>
                    <View
                      className={`coupon-status-tag${
                        dimmed ? ' coupon-status-tag--gray' : ''
                      }`}
                    >
                      <Text>{COUPON_STATUS_LABEL[coupon.status]}</Text>
                    </View>
                  </View>
                </View>
              )
            })}
          </View>
        )}
        <View className='safe-bottom' />
      </ScrollView>
    </View>
  )
}
