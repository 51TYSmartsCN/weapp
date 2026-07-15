import { useEffect, useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import NavBar from '../../components/NavBar'
import Avatar from '../../components/Avatar'
import Skeleton from '../../components/Skeleton'
import Icon from '../../components/Icon'
import {
  buildLoginPageUrl,
  getMyFollows,
  isLoggedIn,
  resolveColor,
  showApiError,
} from '../../services'
import type { Follow } from '../../types'
import './index.scss'

export default function Follows() {
  const [follows, setFollows] = useState<Follow[]>([])
  const [loading, setLoading] = useState(true)
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    const hasLogin = isLoggedIn()
    setLoggedIn(hasLogin)
    if (!hasLogin) {
      setFollows([])
      setLoading(false)
      return
    }

    setLoading(true)
    getMyFollows()
      .then(setFollows)
      .catch((err) => showApiError(err, '关注列表加载失败'))
      .finally(() => setLoading(false))
  }, [])

  const handleLogin = () => {
    Taro.navigateTo({ url: buildLoginPageUrl('/pages/follows/index') })
  }

  const handleBrowseInstructors = () => {
    Taro.navigateTo({ url: '/pages/instructor-list/index' })
  }

  return (
    <View className='follows-page'>
      <NavBar title='关注讲师' />
      <ScrollView className='follows-body' scrollY>
        {!loggedIn ? (
          <View className='follows-guest-card'>
            <View className='follows-guest-icon'>
              <Icon name='users' size={56} color='var(--theme-primary, #0D9488)' />
            </View>
            <Text className='follows-guest-title'>登录后可同步关注讲师</Text>
            <Text className='follows-guest-desc'>
              你可以先浏览讲师详情，登录后再保存关注列表，后续在这里统一查看。
            </Text>
            <View className='follows-guest-primary' onClick={handleLogin}>
              <Text className='follows-guest-primary-text'>微信授权登录</Text>
            </View>
            <View className='follows-guest-secondary' onClick={handleBrowseInstructors}>
              <Text className='follows-guest-secondary-text'>先去看讲师</Text>
            </View>
          </View>
        ) : loading ? (
          <>
            <Skeleton rows={2} horizontal avatar />
            <Skeleton rows={2} horizontal avatar />
            <Skeleton rows={2} horizontal avatar />
          </>
        ) : follows.length === 0 ? (
          <View className='follows-empty'>
            <Icon name='users' size={96} color='#94A3B8' />
            <Text className='follows-empty-text'>还没有关注讲师</Text>
            <View className='follows-empty-btn' onClick={handleBrowseInstructors}>
              <Text className='follows-empty-btn-text'>去看看</Text>
            </View>
          </View>
        ) : (
          <View className='follows-list'>
            {follows.map((item) => {
              const instructor = item.instructor
              const instructorId = instructor?.id || item.instructorId
              const themeColor = resolveColor(instructor?.color || '#0D9488')
              return (
                <View
                  key={item.id}
                  className='follow-item'
                  onClick={() => Taro.navigateTo({ url: `/pages/instructor-detail/index?id=${instructorId}` })}
                >
                  <Avatar
                    text={instructor?.name?.charAt(0) || '?'}
                    size={100}
                    bg={themeColor}
                    src={instructor?.avatar}
                  />
                  <View className='follow-info'>
                    <View className='follow-head'>
                      <Text className='follow-name'>{instructor?.name || `讲师 ${instructorId}`}</Text>
                      <View className='follow-tag'>
                        <Text className='follow-tag-text'>已关注</Text>
                      </View>
                    </View>
                    <Text className='follow-title'>{instructor?.title || '讲师'}</Text>
                    <Text className='follow-service'>{instructor?.service || '查看讲师详情'}</Text>
                    <Text className='follow-bio ellipsis-2'>{instructor?.bio || '点击查看完整讲师介绍'}</Text>
                  </View>
                  <Icon name='chevron-right' size={28} color='#94A3B8' />
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
