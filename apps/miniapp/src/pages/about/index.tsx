import { useEffect, useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import NavBar from '../../components/NavBar'
import Icon from '../../components/Icon'
import MenuItem from '../../components/MenuItem'
import { fetchAppInfo, getAppInfoSync, type AppInfo } from '../../services'
import './index.scss'

const VERSION_TEXT = 'v1.0.0'

export default function About() {
  const [appInfo, setAppInfo] = useState<AppInfo>(getAppInfoSync())

  useEffect(() => {
    fetchAppInfo().then(setAppInfo).catch(() => {})
  }, [])

  return (
    <View className='about-page'>
      <NavBar title='关于我们' />
      <ScrollView className='about-body' scrollY>
        <View className='about-hero'>
          <View className='about-hero-icon'>
            <Icon name='book-open' size={60} color='#FFFFFF' />
          </View>
          <Text className='about-title'>{appInfo.appName}</Text>
          <Text className='about-version'>{VERSION_TEXT}</Text>
          <Text className='about-desc'>
            {appInfo.appDescription || '专注 GEO 领域的实战学习平台'}
          </Text>
        </View>

        <View className='about-card'>
          <MenuItem
            icon='help-circle'
            label='帮助中心'
            onClick={() => Taro.navigateTo({ url: '/pages/help/index' })}
          />
          <View className='about-divider' />
          <MenuItem
            icon='message-circle'
            label='联系客服'
            onClick={() => Taro.navigateTo({ url: '/pages/contact-wx/index' })}
          />
          <View className='about-divider' />
          <MenuItem
            icon='book-open'
            label='用户协议'
            onClick={() => Taro.navigateTo({ url: '/pages/agreement/index' })}
          />
          <View className='about-divider' />
          <MenuItem
            icon='lock'
            label='隐私政策'
            onClick={() => Taro.navigateTo({ url: '/pages/privacy/index' })}
          />
        </View>

        <View className='about-footnote'>
          <Text className='about-footnote-text'>
            GEO 课程聚焦生成式搜索优化与 AI 内容增长，提供课程学习、讲师介绍、购课与学习记录等核心能力。
          </Text>
        </View>

        <View className='safe-bottom' />
      </ScrollView>
    </View>
  )
}
