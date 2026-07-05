import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import NavBar from '../../components/NavBar'
import MenuItem from '../../components/MenuItem'
import { getAppInfoSync, logout } from '../../services'
import './index.scss'

const SETTINGS = [
  { icon: 'message-circle', label: '消息通知' },
  { icon: 'rotate-ccw', label: '清除缓存' },
  { icon: 'help-circle', label: '关于我们' },
]

export default function Settings() {
  const handleMenuClick = (label: string) => {
    switch (label) {
      case '消息通知':
        Taro.showToast({ title: '消息通知设置', icon: 'none' })
        break
      case '清除缓存':
        Taro.showToast({ title: '清理完成', icon: 'success' })
        break
      case '关于我们': {
        const appInfo = getAppInfoSync()
        Taro.showToast({ title: `${appInfo.appName} v1.0.0`, icon: 'none' })
        break
      }
      default:
        break
    }
  }

  const handleLogout = () => {
    Taro.showModal({
      title: '退出登录',
      content: '确定要退出当前账号吗？',
      confirmText: '退出',
      confirmColor: '#EF4444',
      success: async (res) => {
        if (!res.confirm) return
        Taro.showLoading({ title: '退出中...', mask: true })
        try {
          await logout()
        } finally {
          Taro.hideLoading()
        }
        Taro.switchTab({ url: '/pages/profile/index' })
      },
    })
  }

  return (
    <View className='settings-page'>
      <NavBar title='设置' />
      <ScrollView className='settings-body' scrollY>
        <View className='settings-card'>
          {SETTINGS.map((item, index) => (
            <View key={item.label}>
              <MenuItem
                icon={item.icon}
                label={item.label}
                onClick={() => handleMenuClick(item.label)}
              />
              {index < SETTINGS.length - 1 && <View className='settings-divider' />}
            </View>
          ))}
        </View>

        <View className='settings-logout' onClick={handleLogout}>
          <Text className='settings-logout-text'>退出登录</Text>
        </View>

        <View className='safe-bottom' />
      </ScrollView>
    </View>
  )
}
