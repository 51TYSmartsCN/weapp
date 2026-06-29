import { useEffect, useState } from 'react'
import { View, Text, ScrollView, Button, Input, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import NavBar from '../../components/NavBar'
import Icon from '../../components/Icon'
import { getUser, updateProfile, showApiError } from '../../services'
import type { User } from '../../types'
import './index.scss'

/** 判断字符串是否为图片 URL（http/https、后端静态路径或微信临时文件） */
function isImageUrl(s?: string): boolean {
  if (!s) return false
  return (
    /^https?:\/\//.test(s) ||
    s.startsWith('/images/') ||
    s.startsWith('wxfile://') ||
    s.startsWith('http://tmp/')
  )
}

export default function EditProfile() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // 表单字段
  const [nickname, setNickname] = useState('')
  /** 当前头像预览：可能是图片 URL、wxfile 临时路径或单字占位 */
  const [avatarPreview, setAvatarPreview] = useState('')
  /** chooseAvatar 选中的新头像临时路径，未提交前仅本地预览 */
  const [avatarTempPath, setAvatarTempPath] = useState('')
  const [nicknameInputFocus, setNicknameInputFocus] = useState(false)

  /** 加载用户信息 */
  useEffect(() => {
    setLoading(true)
    getUser()
      .then((u) => {
        setUser(u)
        setNickname(u.name || '')
        setAvatarPreview(u.avatar || '')
      })
      .catch((err) => showApiError(err, '用户信息加载失败'))
      .finally(() => setLoading(false))
  }, [])

  /** chooseAvatar 回调：拿到临时文件路径，本地预览 */
  const handleChooseAvatar = (e: any) => {
    const url = e?.detail?.avatarUrl
    if (url) {
      setAvatarTempPath(url)
      setAvatarPreview(url)
    }
  }

  /** 提交保存 */
  const handleSubmit = async () => {
    if (submitting) return
    const name = nickname.trim()
    if (!name) {
      Taro.showToast({ title: '请填写昵称', icon: 'none' })
      return
    }
    if (name.length > 64) {
      Taro.showToast({ title: '昵称不能超过 64 个字', icon: 'none' })
      return
    }

    setSubmitting(true)
    try {
      await updateProfile({
        nickname: name,
        avatarTempPath: avatarTempPath || undefined,
      })
      Taro.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(() => Taro.navigateBack(), 800)
    } catch (err) {
      showApiError(err, '保存失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  /** 预览头像：根据 avatarPreview 渲染图片或占位/文字 */
  const renderAvatarPreview = () => {
    if (isImageUrl(avatarPreview)) {
      return <Image className='edit-avatar-img' src={avatarPreview} mode='aspectFill' />
    }
    const text = avatarPreview?.charAt(0) || user?.name?.charAt(0) || ''
    return (
      <View className='edit-avatar-placeholder'>
        {text ? (
          <Text className='edit-avatar-text'>{text}</Text>
        ) : (
          <Icon name='user' size={56} color='#94A3B8' />
        )}
      </View>
    )
  }

  if (loading && !user) {
    return (
      <View className='edit-profile-page'>
        <NavBar title='修改信息' />
        <View className='edit-profile-loading'>
          <Text className='edit-profile-loading-text'>加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className='edit-profile-page'>
      <NavBar title='修改信息' />
      <ScrollView className='edit-profile-body' scrollY>
        {/* 头像 */}
        <View className='edit-section edit-section--avatar'>
          <Text className='edit-label'>头像</Text>
          <Button
            className='edit-avatar-btn'
            openType='chooseAvatar'
            onChooseAvatar={handleChooseAvatar}
          >
            {renderAvatarPreview()}
          </Button>
          <View className='edit-avatar-hint'>
            <Icon name='chevron-right' size={28} color='#94A3B8' />
          </View>
        </View>

        {/* 昵称 */}
        <View className='edit-section'>
          <Text className='edit-label'>昵称</Text>
          <View
            className='edit-nickname-display'
            onClick={() => setNicknameInputFocus(true)}
          >
            {nickname ? (
              <Text className='edit-nickname-value'>{nickname}</Text>
            ) : (
              <Text className='edit-nickname-placeholder'>点击填写昵称</Text>
            )}
          </View>
          <Input
            className='edit-nickname-hidden-input'
            type='nickname'
            focus={nicknameInputFocus}
            value={nickname}
            onInput={(e) => setNickname(e.detail.value)}
            onBlur={() => setNicknameInputFocus(false)}
            maxlength={64}
            placeholder='点击使用微信昵称或自行输入'
          />
        </View>

        {/* 提示 */}
        <View className='edit-tip'>
          <Icon name='message-circle' size={24} color='#94A3B8' />
          <Text className='edit-tip-text'>
            昵称可点击使用微信昵称，也可自行输入；头像点击右侧区域选择
          </Text>
        </View>

        {/* 保存按钮 */}
        <View
          className={`edit-submit ${submitting ? 'edit-submit--disabled' : ''}`}
          onClick={handleSubmit}
        >
          <Text className='edit-submit-text'>
            {submitting ? '保存中...' : '保存修改'}
          </Text>
        </View>

        <View className='safe-bottom' />
      </ScrollView>
    </View>
  )
}
