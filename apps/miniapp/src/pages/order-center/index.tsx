import { useEffect, useState } from 'react'
import { View, Text } from '@tarojs/components'
import { useRouter } from '@tarojs/taro'
import Taro from '@tarojs/taro'
import NavBar from '../../components/NavBar'
import Icon from '../../components/Icon'
import { getOrderById, getOrders, showApiError } from '../../services'
import { OrderStatus, OrderSource } from '../../types'
import type { Order } from '../../types'
import './index.scss'

/**
 * 订单中心页
 *
 * 用途:微信小店下单后,订单详情页的「查看详情」按钮会跳转到此页面。
 * 通过 query 接收 orderId / out_trade_no,定位到具体订单并展示。
 *
 * 微信小店配置:小程序后台「设置 → 基本设置 → 订单中心 path」填入
 *   pages/order-center/index
 *
 * 安全:此页面会调用受保护的 /api/orders 接口,后端会校验订单 user_id 是否匹配当前登录用户
 */
export default function OrderCenter() {
  const router = useRouter()
  const targetOrderId = Number(router.params.orderId || router.params.out_trade_no || 0)

  const [order, setOrder] = useState<Order | null>(null)
  const [orderList, setOrderList] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    // 拉取订单列表(用于展示历史订单)
    const tasks: Promise<unknown>[] = [getOrders().then(setOrderList).catch((err) => showApiError(err, '订单列表加载失败'))]

    // 若有指定 orderId,同时拉取该订单详情
    if (targetOrderId > 0) {
      tasks.push(
        getOrderById(targetOrderId)
          .then((o) => setOrder(o ?? null))
          .catch((err) => showApiError(err, '订单详情加载失败'))
      )
    }

    Promise.all(tasks).finally(() => setLoading(false))
  }, [targetOrderId])

  /** 跳转课程详情 */
  const handleGoToCourse = (courseId: number) => {
    Taro.navigateTo({ url: `/pages/course-detail/index?id=${courseId}` })
  }

  /** 渲染单条订单 */
  const renderOrder = (o: Order) => {
    const statusText = (() => {
      switch (o.status) {
        case OrderStatus.Pending: return '待支付'
        case OrderStatus.Paid: return '已支付'
        case OrderStatus.Refunded: return '已退款'
        case OrderStatus.Cancelled: return '已取消'
        default: return '未知'
      }
    })()
    const sourceText = o.source === OrderSource.WxShop ? '微信小店' : '小程序'
    const isPaid = o.status === OrderStatus.Paid

    return (
      <View key={o.id} className='oc-order-card' onClick={() => handleGoToCourse(o.courseId)}>
        <View className='oc-order-header'>
          <Text className='oc-order-no'>订单号:{o.orderNo}</Text>
          <Text className={`oc-order-status oc-order-status--${o.status}`}>{statusText}</Text>
        </View>
        <View className='oc-order-body'>
          <View className='oc-order-info'>
            <Text className='oc-order-source'>来源:{sourceText}</Text>
            {o.paidAt && <Text className='oc-order-time'>支付时间:{o.paidAt.slice(0, 10)}</Text>}
          </View>
          <View className='oc-order-amount-row'>
            <Text className='oc-order-amount'>¥{o.amount}</Text>
            {o.originalAmount && o.originalAmount !== o.amount && (
              <Text className='oc-order-original'>¥{o.originalAmount}</Text>
            )}
          </View>
        </View>
        {isPaid && (
          <View className='oc-order-actions'>
            <View className='oc-order-btn'>开始学习</View>
          </View>
        )}
      </View>
    )
  }

  /** 渲染微信小店跳转过来的目标订单(顶部突出展示) */
  const renderTargetOrder = () => {
    if (!order) return null
    return (
      <View className='oc-target-section'>
        <View className='oc-target-title'>
          <Icon name='check-circle' size={36} color='#10B981' />
          <Text className='oc-target-title-text'>购买成功</Text>
        </View>
        {renderOrder(order)}
      </View>
    )
  }

  return (
    <View className='order-center-page'>
      <NavBar title='订单中心' />

      {loading ? (
        <View className='oc-loading'>
          <Text>加载中...</Text>
        </View>
      ) : (
        <View className='oc-content'>
          {renderTargetOrder()}

          <View className='oc-list-section'>
            <Text className='oc-list-title'>全部订单</Text>
            {orderList.length === 0 ? (
              <View className='oc-empty'>
                <Text>暂无订单</Text>
              </View>
            ) : (
              orderList.map(renderOrder)
            )}
          </View>
        </View>
      )}

      <View className='oc-bottom-safe safe-bottom' />
    </View>
  )
}
