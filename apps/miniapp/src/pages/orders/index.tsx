import { useEffect, useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import NavBar from '../../components/NavBar'
import Skeleton from '../../components/Skeleton'
import Icon from '../../components/Icon'
import { getOrders, getCourseById, showApiError } from '../../services'
import { OrderStatus } from '../../types'
import type { Course, Order } from '../../types'
import './index.scss'

const ORDER_STATUS_META: Record<OrderStatus, { label: string; color: string }> = {
  [OrderStatus.Pending]: { label: '待支付', color: '#F59E0B' },
  [OrderStatus.Paid]: { label: '已支付', color: '#0D9488' },
  [OrderStatus.Refunded]: { label: '已退款', color: '#64748B' },
  [OrderStatus.Cancelled]: { label: '已取消', color: '#94A3B8' },
}

function formatDate(iso: string): string {
  return iso.slice(0, 10)
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [courseMap, setCourseMap] = useState<Record<number, Course>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getOrders()
      .then(async (list) => {
        setOrders(list)
        const distinctIds = Array.from(new Set(list.map((o) => o.courseId)))
        const courses = await Promise.all(distinctIds.map((id) => getCourseById(id)))
        const map: Record<number, Course> = {}
        courses.forEach((c) => {
          if (c) map[c.id] = c
        })
        setCourseMap(map)
      })
      .catch((err) => showApiError(err, '订单列表加载失败'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <View className='orders-page'>
      <NavBar title='我的订单' />
      <ScrollView className='orders-body' scrollY>
        {loading ? (
          <>
            <Skeleton rows={2} horizontal />
            <Skeleton rows={2} horizontal />
            <Skeleton rows={2} horizontal />
          </>
        ) : orders.length === 0 ? (
          <View className='orders-empty'>
            <Icon name='receipt' size={96} color='#94A3B8' />
            <Text className='orders-empty-text'>暂无订单</Text>
          </View>
        ) : (
          <View className='orders-list'>
            {orders.map((order) => {
              const course = courseMap[order.courseId]
              const meta = ORDER_STATUS_META[order.status]
              return (
                <View key={order.id} className='order-card'>
                  <View className='order-header'>
                    <Text className='order-course-title ellipsis'>
                      {course ? course.title : '课程'}
                    </Text>
                    <View
                      className='order-status-tag'
                      style={{ backgroundColor: `${meta.color}1A` }}
                    >
                      <Text style={{ color: meta.color }}>{meta.label}</Text>
                    </View>
                  </View>
                  <Text className='order-no'>订单号：{order.orderNo}</Text>
                  <View className='order-footer'>
                    <Text className='order-date'>{formatDate(order.createdAt)}</Text>
                    <View className='order-amount-row'>
                      {order.originalAmount ? (
                        <Text className='order-original-amount'>¥{order.originalAmount}</Text>
                      ) : null}
                      <Text className='order-amount'>¥{order.amount}</Text>
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
