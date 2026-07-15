import { useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import SafeTop from '../../components/SafeTop'
import Avatar from '../../components/Avatar'
import MenuItem from '../../components/MenuItem'
import Skeleton from '../../components/Skeleton'
import Icon from '../../components/Icon'
import { buildLoginPageUrl, getUser, isLoggedIn, logout, menuGroups, showApiError } from '../../services'
import type { User, MenuGroup } from '../../types'
import './index.scss'

export default function Profile() {
  const [user, setUser] = useState<User | null>(null)
  const [groups] = useState<MenuGroup[]>(menuGroups)
  const [loading, setLoading] = useState(true)
  const [loggedIn, setLoggedIn] = useState(false)

  useDidShow(() => {
    const hasLogin = isLoggedIn()
    setLoggedIn(hasLogin)
    if (!hasLogin) {
      setUser(null)
      setLoading(false)
      return
    }

    setLoading(true)
    getUser()
      .then(setUser)
      .catch((err) => showApiError(err, '用户信息加载失败'))
      .finally(() => setLoading(false))
  })

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
      case '关注讲师':
        Taro.navigateTo({ url: '/pages/follows/index' })
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
      case '兑换课程':
        Taro.navigateTo({ url: '/pages/video-unlock/index' })
        break
      case '帮助中心':
        Taro.navigateTo({ url: '/pages/help/index' })
        break
      case '加企业微信':
        Taro.navigateTo({ url: '/pages/contact-wx/index' })
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

  const handleEditProfile = () => {
    Taro.navigateTo({
      url: '/pages/edit-profile/index',
      fail: (err) => {
        console.error('[profile] navigateTo edit-profile failed:', err)
        Taro.showToast({ title: '打开修改资料页失败', icon: 'none' })
      },
    })
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
        setLoggedIn(false)
        setUser(null)
        setLoading(false)
        Taro.showToast({ title: '已退出登录', icon: 'success' })
      },
    })
  }

  return (
    <ScrollView className='profile-page' scrollY>
      <SafeTop />

      {!loggedIn ? (
        <>
          <View className='profile-header'>
            <View className='profile-header-card profile-guest-card'>
              <View className='profile-guest-badge'>游客模式</View>
              <Text className='profile-guest-title'>先浏览课程内容，再决定是否登录</Text>
              <Text className='profile-guest-desc'>
                首页、课程列表、课程详情都可直接查看；登录后再同步学习进度、收藏和订单。
              </Text>
              <View className='profile-guest-actions'>
                <View
                  className='profile-guest-primary'
                  onClick={() => Taro.navigateTo({ url: buildLoginPageUrl('/pages/profile/index') })}
                >
                  <Text className='profile-guest-primary-text'>微信授权登录</Text>
                </View>
                <View
                  className='profile-guest-secondary'
                  onClick={() => Taro.switchTab({ url: '/pages/course-list/index' })}
                >
                  <Text className='profile-guest-secondary-text'>先去逛课程</Text>
                </View>
              </View>
            </View>
          </View>

          <View className='profile-menu-group'>
            <View className='menu-card'>
              <MenuItem
                icon='book-open'
                label='浏览全部课程'
                onClick={() => Taro.switchTab({ url: '/pages/course-list/index' })}
              />
              <View className='menu-divider' />
              <MenuItem
                icon='help-circle'
                label='帮助中心'
                onClick={() => Taro.navigateTo({ url: '/pages/help/index' })}
              />
              <View className='menu-divider' />
              <MenuItem
                icon='message-circle'
                label='联系客服'
                onClick={() => Taro.navigateTo({ url: '/pages/contact-wx/index' })}
              />
            </View>
          </View>
        </>
      ) : loading ? (
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
                <View className='profile-user-info' onClick={handleEditProfile}>
                  <Avatar
                    src={user?.avatar}
                    text={user?.name?.charAt(0) ?? ''}
                    size={120}
                  />
                  <View className='profile-name-wrap'>
                    <View className='profile-name'>{user?.name}</View>
                    {user?.vip && <Text className='profile-vip'>VIP 会员</Text>}
                    <View className='profile-edit-hint'>
                      <Text className='profile-edit-text'>点击修改头像和昵称</Text>
                      <Icon name='chevron-right' size={24} color='#94A3B8' />
                    </View>
                  </View>
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
      {loggedIn && groups.map((group, groupIndex) => (
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

      {/* 退出登录：放在菜单末尾的卡片式按钮，跟随滚动 */}
      {loggedIn && (
        <View className='profile-menu-group'>
          <View className='menu-card profile-logout-card' onClick={handleLogout}>
            <Text className='profile-logout-text'>退出登录</Text>
          </View>
        </View>
      )}

      {/* 底部留白，避免被 TabBar 遮挡 */}
      <View className='profile-bottom-space' />
    </ScrollView>
  )
}
