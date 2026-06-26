import { useEffect, useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import SafeTop from '../../components/SafeTop'
import Avatar from '../../components/Avatar'
import MenuItem from '../../components/MenuItem'
import Skeleton from '../../components/Skeleton'
import Icon from '../../components/Icon'
import { getUser, menuGroups, showApiError } from '../../services'
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
    Taro.showToast({ title: label, icon: 'none' })
  }

  const handleContinue = () => {
    Taro.switchTab({ url: '/pages/course-list/index' })
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
                <Avatar text={user?.avatar ?? ''} size={120} />
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
              <View className='progress-content'>
                <View className='progress-info'>
                  <View className='progress-course'>{user?.continueCourse.title}</View>
                  <View className='progress-bar'>
                    <View
                      className='progress-fill'
                      style={{ width: `${user?.continueCourse.progress}%` }}
                    />
                  </View>
                  <View className='progress-desc'>
                    已完成 {user?.continueCourse.completed}/{user?.continueCourse.total} 节 · 上次学习：{user?.continueCourse.lastStudy}
                  </View>
                </View>
                <View className='continue-btn' onClick={handleContinue}>
                  继续学习
                </View>
              </View>
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

      <View className='profile-bottom-space' />
    </ScrollView>
  )
}