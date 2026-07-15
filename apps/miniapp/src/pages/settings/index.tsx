import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import NavBar from '../../components/NavBar'
import MenuItem from '../../components/MenuItem'
import { getToken, logout, setToken } from '../../services'
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
        Taro.navigateTo({ url: '/pages/message-settings/index' })
        break
      case '清除缓存':
        void handleClearCache()
        break
      case '关于我们':
        Taro.navigateTo({ url: '/pages/about/index' })
        break
      default:
        break
    }
  }

  const handleClearCache = async () => {
    const result = await Taro.showModal({
      title: '清除缓存',
      content: '会清理本地缓存的主题、页面配置和临时记录，但会保留当前登录状态，是否继续？',
      confirmText: '清理',
      confirmColor: '#EF4444',
    })
    if (!result.confirm) return

    Taro.showLoading({ title: '清理中...', mask: true })
    try {
      const preservedToken = getToken()
      const storageInfo = Taro.getStorageInfoSync()
      const removableKeys = storageInfo.keys.filter((key) => key !== 'geo_token')

      for (const key of removableKeys) {
        await Taro.removeStorage({ key }).catch(() => {
          Taro.removeStorageSync(key)
        })
      }

      if (preservedToken) {
        setToken(preservedToken)
      }

      Taro.showToast({
        title: removableKeys.length > 0 ? `已清理 ${removableKeys.length} 项缓存` : '暂无可清理缓存',
        icon: 'success',
      })
    } finally {
      Taro.hideLoading()
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
