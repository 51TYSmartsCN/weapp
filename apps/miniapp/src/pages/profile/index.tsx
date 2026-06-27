import { useEffect, useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import SafeTop from '../../components/SafeTop'
import Avatar from '../../components/Avatar'
import MenuItem from '../../components/MenuItem'
import Skeleton from '../../components/Skeleton'
import Icon from '../../components/Icon'
import { getUser, menuGroups, showApiError, logout } from '../../services'
import type { User, MenuGroup } from '../../types'
import './index.scss'

export default function Profile() {
  const [user, setUser] = useState<User | null>(null)
  const [groups] = useState<MenuGroup[]>(menuGroups)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getUser()
      .then(setUser)
      .catch((err) => showApiError(err, '用户信息加载失败'))
      .finally(() => setLoading(false))
  }, [])

  const handleMenuClick = (label: string) => {
    switch (label) {
      case '我的课程':
        Taro.switchTab({ url: '/pages/learning/index' })
        break
      case '学习记录':
        Taro.navigateTo({ url: '/pages/study-records/index' })
        break
      case '收藏课程':
        Taro.navigateTo({ url: '/pages/favorites/index' })
        break
      case '学习证书':
        Taro.navigateTo({ url: '/pages/certificates/index' })
        break
      case '我的订单':
        Taro.navigateTo({ url: '/pages/orders/index' })
        break
      case '优惠券':
        Taro.navigateTo({ url: '/pages/coupons/index' })
        break
      case '邀请好友':
        Taro.navigateTo({ url: '/pages/invitations/index' })
        break
      case '帮助中心':
        Taro.navigateTo({ url: '/pages/help/index' })
        break
      case '意见反馈':
        Taro.navigateTo({ url: '/pages/feedback/index' })
        break
      case '设置':
        Taro.navigateTo({ url: '/pages/settings/index' })
        break
      default:
        break
    }
  }

  const handleContinue = () => {
    Taro.switchTab({ url: '/pages/course-list/index' })
  }

  const handleLogout = () => {
    Taro.showModal({
      title: '退出登录',
      content: '确定要退出当前账号吗？',
      confirmText: '退出',
      confirmColor: '#EF4444',
      success: (res) => {
        if (res.confirm) {
          logout()
          Taro.reLaunch({ url: '/pages/login/index' })
        }
      },
    })
  }

  if (!user && !loading) return null

  return (
    <ScrollView className='profile-page' scrollY>
      <SafeTop />

      {loading ? (
        <>
          <View className='profile-header'>
            <View className='profile-header-card skeleton-profile-header'>
              <Skeleton rows={2} horizontal avatar />
            </View>
          </View>
          <View className='profile-stats skeleton-profile-stats'>
            <View className='stats-row'>
              <View className='stat-item'><View className='skeleton-stat' /></View>
              <View className='stat-divider' />
              <View className='stat-item'><View className='skeleton-stat' /></View>
              <View className='stat-divider' />
              <View className='stat-item'><View className='skeleton-stat' /></View>
            </View>
          </View>
          <View className='profile-progress'>
            <View className='progress-card'>
              <Skeleton rows={2} title={false} />
            </View>
          </View>
        </>
      ) : (
        <>
          {/* Header */}
          <View className='profile-header'>
            <View className='profile-header-card'>
              <View className='profile-user'>
                <Avatar
                  src={user?.avatar}
                  text={user?.name?.charAt(0) ?? ''}
                  size={120}
                />
                <View className='profile-name-wrap'>
                  <View className='profile-name'>{user?.name}</View>
                  {user?.vip && <Text className='profile-vip'>VIP 会员</Text>}
                </View>
                <View className='settings-btn' onClick={() => handleMenuClick('设置')}>
                  <Icon name='settings' size={32} color='#475569' />
                </View>
              </View>
            </View>
          </View>

          {/* Stats */}
          <View className='profile-stats'>
            <View className='stats-row'>
              <View className='stat-item'>
                <Text className='stat-value'>{user?.boughtCourses}</Text>
                <Text className='stat-label'>已购课程</Text>
              </View>
              <View className='stat-divider' />
              <View className='stat-item'>
                <Text className='stat-value'>{user?.finishedLessons}</Text>
                <Text className='stat-label'>已完成课时</Text>
              </View>
              <View className='stat-divider' />
              <View className='stat-item'>
                <Text className='stat-value'>{user?.studyHours}h</Text>
                <Text className='stat-label'>学习时长</Text>
              </View>
            </View>
          </View>

          {/* Continue Learning */}
          <View className='profile-progress'>
            <View className='progress-card'>
              <Text className='progress-title'>继续学习</Text>
              {user?.continueCourse ? (
                <View className='progress-content'>
                  <View className='progress-info'>
                    <View className='progress-course'>{user.continueCourse.title}</View>
                    <View className='progress-bar'>
                      <View
                        className='progress-fill'
                        style={{ width: `${user.continueCourse.progress}%` }}
                      />
                    </View>
                    <View className='progress-desc'>
                      已完成 {user.continueCourse.completed}/{user.continueCourse.total} 节 · 上次学习：{user.continueCourse.lastStudy}
                    </View>
                  </View>
                  <View className='continue-btn' onClick={handleContinue}>
                    继续学习
                  </View>
                </View>
              ) : (
                <View className='progress-content'>
                  <View className='progress-info'>
                    <View className='progress-course'>还没有开始学习</View>
                    <View className='progress-desc'>去挑选一门感兴趣的课程吧</View>
                  </View>
                  <View className='continue-btn' onClick={handleContinue}>
                    去看看
                  </View>
                </View>
              )}
            </View>
          </View>
        </>
      )}

      {/* Menu Groups */}
      {groups.map((group, groupIndex) => (
        <View key={groupIndex} className='profile-menu-group'>
          <View className='menu-card'>
            {group.items.map((item, index) => (
              <View key={item.label}>
                <MenuItem
                  icon={item.icon}
                  label={item.label}
                  onClick={() => handleMenuClick(item.label)}
                />
                {index < group.items.length - 1 && <View className='menu-divider' />}
              </View>
            ))}
          </View>
        </View>
      ))}

      {/* 退出登录 */}
      <View className='profile-logout' onClick={handleLogout}>
        <Text className='profile-logout-text'>退出登录</Text>
      </View>

      <View className='profile-bottom-space' />
    </ScrollView>
  )
}