import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import SafeTop from '../../components/SafeTop'
import Icon from '../../components/Icon'
import { login, showApiError } from '../../services'
import './index.scss'

export default function Login() {
  const [loading, setLoading] = useState(false)
  const [agreed, setAgreed] = useState(false)

  const handleLogin = async () => {
    if (!agreed) {
      Taro.showToast({ title: '请先同意用户协议与隐私政策', icon: 'none' })
      return
    }
    if (loading) return

    setLoading(true)
    try {
      await login()
      Taro.showToast({ title: '登录成功', icon: 'success' })
      // 登录成功后进入首页 Tab
      setTimeout(() => {
        Taro.switchTab({ url: '/pages/index/index' })
      }, 300)
    } catch (err) {
      showApiError(err, '登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const toggleAgree = () => setAgreed((v) => !v)

  return (
    <View className='login-page'>
      <SafeTop />

      {/* 品牌 */}
      <View className='login-brand'>
        <View className='login-logo'>
          <Icon name='book-open' size={72} color='#FFFFFF' />
        </View>
        <Text className='login-title'>GEO 课程</Text>
        <Text className='login-subtitle'>专注 GEO 领域的实战学习平台</Text>
      </View>

      {/* 特性 */}
      <View className='login-features'>
        <View className='login-feature'>
          <View className='login-feature-icon'>
            <Icon name='play-circle' size={36} color='#0D9488' />
          </View>
          <View className='login-feature-text'>
            <Text className='login-feature-title'>体系化课程</Text>
            <Text className='login-feature-desc'>从入门到精通，循序渐进</Text>
          </View>
        </View>
        <View className='login-feature'>
          <View className='login-feature-icon'>
            <Icon name='users' size={36} color='#0D9488' />
          </View>
          <View className='login-feature-text'>
            <Text className='login-feature-title'>资深讲师</Text>
            <Text className='login-feature-desc'>一线实战经验倾囊相授</Text>
          </View>
        </View>
        <View className='login-feature'>
          <View className='login-feature-icon'>
            <Icon name='award' size={36} color='#0D9488' />
          </View>
          <View className='login-feature-text'>
            <Text className='login-feature-title'>学习证书</Text>
            <Text className='login-feature-desc'>完成课程获得权威认证</Text>
          </View>
        </View>
      </View>

      {/* 底部登录区 */}
      <View className='login-footer'>
        <View className='login-agreement'>
          <View
            className={`login-checkbox ${agreed ? 'login-checkbox--checked' : ''}`}
            onClick={toggleAgree}
          >
            {agreed && <Icon name='check' size={20} color='#FFFFFF' />}
          </View>
          <Text className='login-agreement-text'>
            我已阅读并同意《用户协议》和《隐私政策》
          </Text>
        </View>

        <View
          className={`login-btn ${loading ? 'login-btn--loading' : ''} ${!agreed ? 'login-btn--disabled' : ''}`}
          onClick={handleLogin}
        >
          <Icon name='user' size={32} color='#FFFFFF' />
          <Text className='login-btn-text'>
            {loading ? '登录中...' : '微信一键登录'}
          </Text>
        </View>
      </View>

      <View className='login-bottom-space' />
    </View>
  )
}
