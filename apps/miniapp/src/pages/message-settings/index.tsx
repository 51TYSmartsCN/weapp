import { useEffect, useState } from 'react'
import { View, Text, ScrollView, Switch } from '@tarojs/components'
import Taro from '@tarojs/taro'
import NavBar from '../../components/NavBar'
import './index.scss'

const COURSE_UPDATES_KEY = 'geo_message_course_updates'
const ORDER_UPDATES_KEY = 'geo_message_order_updates'

export default function MessageSettings() {
  const [courseUpdatesEnabled, setCourseUpdatesEnabled] = useState(true)
  const [orderUpdatesEnabled, setOrderUpdatesEnabled] = useState(true)

  useEffect(() => {
    setCourseUpdatesEnabled(Taro.getStorageSync(COURSE_UPDATES_KEY) !== false)
    setOrderUpdatesEnabled(Taro.getStorageSync(ORDER_UPDATES_KEY) !== false)
  }, [])

  const handleToggleCourseUpdates = (enabled: boolean) => {
    setCourseUpdatesEnabled(enabled)
    Taro.setStorageSync(COURSE_UPDATES_KEY, enabled)
  }

  const handleToggleOrderUpdates = (enabled: boolean) => {
    setOrderUpdatesEnabled(enabled)
    Taro.setStorageSync(ORDER_UPDATES_KEY, enabled)
  }

  return (
    <View className='message-settings-page'>
      <NavBar title='消息通知' />
      <ScrollView className='message-settings-body' scrollY>
        <View className='message-settings-card'>
          <View className='message-settings-item'>
            <View className='message-settings-copy'>
              <Text className='message-settings-title'>课程更新提醒</Text>
              <Text className='message-settings-desc'>新课上线、课程更新时在当前设备提醒你</Text>
            </View>
            <Switch
              color='#0D9488'
              checked={courseUpdatesEnabled}
              onChange={(e) => handleToggleCourseUpdates(e.detail.value)}
            />
          </View>
          <View className='message-settings-divider' />
          <View className='message-settings-item'>
            <View className='message-settings-copy'>
              <Text className='message-settings-title'>订单状态提醒</Text>
              <Text className='message-settings-desc'>购买成功、退款处理等状态变更提醒</Text>
            </View>
            <Switch
              color='#0D9488'
              checked={orderUpdatesEnabled}
              onChange={(e) => handleToggleOrderUpdates(e.detail.value)}
            />
          </View>
        </View>

        <View className='message-settings-tip'>
          <Text className='message-settings-tip-text'>
            以上设置仅保存在当前设备；清除缓存后会恢复默认开启。
          </Text>
        </View>

        <View className='safe-bottom' />
      </ScrollView>
    </View>
  )
}
