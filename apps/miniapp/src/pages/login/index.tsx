import { useState, useEffect } from 'react'
import { View, Text, Button, Input, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import SafeTop from '../../components/SafeTop'
import Icon from '../../components/Icon'
import {
  fetchAppInfo,
  getAppInfoSync,
  HOME_PAGE_URL,
  isTabPageUrl,
  LOGIN_PAGE_URL,
  LOGIN_RETURN_URL_KEY,
  login,
  resolveDecodedReturnUrl,
  resolveUrl,
  showApiError,
  type AppInfo,
  updateProfile,
} from '../../services'
import type { User } from '../../types'
import './index.scss'

type Step = 'login' | 'profile'

export default function Login() {
  const [step, setStep] = useState<Step>('login')
  const [loading, setLoading] = useState(false)
  const [agreed, setAgreed] = useState(false)

  // 应用信息（名称、描述、Logo）—— 首屏用缓存秒开，再异步拉取最新值
  const [appInfo, setAppInfo] = useState<AppInfo>(getAppInfoSync())
  useEffect(() => {
    fetchAppInfo().then(setAppInfo).catch(() => {})
  }, [])

  // 完善资料表单
  const [avatarTempPath, setAvatarTempPath] = useState<string>('')
  const [nickname, setNickname] = useState('')
  const [nicknameInputFocus, setNicknameInputFocus] = useState(false)

  const resolvePostLoginUrl = () => {
    const queryReturnUrl = resolveDecodedReturnUrl(String(Taro.getCurrentInstance().router?.params?.returnUrl || ''))
    const storedReturnUrl = resolveDecodedReturnUrl(Taro.getStorageSync(LOGIN_RETURN_URL_KEY))
    const targetUrl = queryReturnUrl || storedReturnUrl || HOME_PAGE_URL
    Taro.removeStorageSync(LOGIN_RETURN_URL_KEY)
    return targetUrl
  }

  const navigateAfterLogin = () => {
    const targetUrl = resolvePostLoginUrl()
    const targetPage = targetUrl.split('?')[0]
    if (targetPage === LOGIN_PAGE_URL) {
      Taro.switchTab({ url: HOME_PAGE_URL })
      return
    }
    if (isTabPageUrl(targetUrl) && !targetUrl.includes('?')) {
      Taro.switchTab({ url: targetUrl })
      return
    }
    Taro.reLaunch({ url: targetUrl })
  }

  /** 步骤 1：微信一键登录 */
  const handleLogin = async () => {
    if (!agreed) {
      Taro.showToast({ title: '请先同意用户协议与隐私政策', icon: 'none' })
      return
    }
    if (loading) return

    setLoading(true)
    try {
      const user: User = await login()
      // 后端返回 hasProfile=true 直接进首页；否则进入资料完善步骤
      if (user.hasProfile) {
        Taro.showToast({ title: '登录成功', icon: 'success' })
        setTimeout(() => navigateAfterLogin(), 300)
      } else {
        setStep('profile')
      }
    } catch (err) {
      showApiError(err, '登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  /** chooseAvatar 回调：拿到临时文件路径 */
  const handleChooseAvatar = (e: any) => {
    const url = e?.detail?.avatarUrl
    if (url) setAvatarTempPath(url)
  }

  /** 步骤 2：提交昵称 + 头像 */
  const handleSubmitProfile = async () => {
    if (loading) return
    const name = nickname.trim()
    if (!name) {
      Taro.showToast({ title: '请先选择微信昵称', icon: 'none' })
      return
    }
    if (!avatarTempPath) {
      Taro.showToast({ title: '请选择头像', icon: 'none' })
      return
    }

    setLoading(true)
    try {
      await updateProfile({ nickname: name, avatarTempPath })
      Taro.showToast({ title: '登录成功', icon: 'success' })
      setTimeout(() => navigateAfterLogin(), 300)
    } catch (err) {
      showApiError(err, '资料保存失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  /** 跳过资料完善（使用占位头像/昵称直接进入） */
  const handleSkip = () => {
    navigateAfterLogin()
  }

  const toggleAgree = () => setAgreed((v) => !v)

  return (
    <View className='login-page'>
      <SafeTop />

      {/* 品牌 */}
      <View className='login-brand'>
        {appInfo.appLogo ? (
          <Image
            className='login-logo-img'
            src={resolveUrl(appInfo.appLogo)}
            mode='aspectFill'
            style={{ width: '160rpx', height: '160rpx', borderRadius: '9999rpx' }}
          />
        ) : (
          <View className='login-logo'>
            <Icon name='book-open' size={72} color='#FFFFFF' />
          </View>
        )}
        <Text className='login-title'>{appInfo.appName}</Text>
        <Text className='login-subtitle'>
          {step === 'login' ? (appInfo.appDescription || '专注 GEO 领域的实战学习平台') : '完善个人信息'}
        </Text>
      </View>

      {step === 'login' ? (
        <>
          {/* 特性 */}
          <View className='login-features'>
            <View className='login-feature'>
              <View className='login-feature-icon'>
                <Icon name='play-circle' size={36} color='var(--theme-primary, #0D9488)' />
              </View>
              <View className='login-feature-text'>
                <Text className='login-feature-title'>体系化课程</Text>
                <Text className='login-feature-desc'>从入门到精通，循序渐进</Text>
              </View>
            </View>
            <View className='login-feature'>
              <View className='login-feature-icon'>
                <Icon name='users' size={36} color='var(--theme-primary, #0D9488)' />
              </View>
              <View className='login-feature-text'>
                <Text className='login-feature-title'>资深讲师</Text>
                <Text className='login-feature-desc'>一线实战经验倾囊相授</Text>
              </View>
            </View>
            <View className='login-feature'>
              <View className='login-feature-icon'>
                <Icon name='award' size={36} color='var(--theme-primary, #0D9488)' />
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
                我已阅读并同意
                <Text
                  className='login-agreement-link'
                  onClick={(e) => {
                    e.stopPropagation()
                    Taro.navigateTo({ url: '/pages/agreement/index' })
                  }}
                >
                  《用户协议》
                </Text>
                和
                <Text
                  className='login-agreement-link'
                  onClick={(e) => {
                    e.stopPropagation()
                    Taro.navigateTo({ url: '/pages/privacy/index' })
                  }}
                >
                  《隐私政策》
                </Text>
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
        </>
      ) : (
        <>
          {/* 资料完善表单 */}
          <View className='profile-setup'>
            <Text className='profile-setup-tip'>
              使用微信头像和昵称，让同学更容易认识你
            </Text>

            {/* 头像选择：必须用 Button openType="chooseAvatar" */}
            <Button
              className='profile-avatar-btn'
              openType='chooseAvatar'
              onChooseAvatar={handleChooseAvatar}
            >
              {avatarTempPath ? (
                <Image className='profile-avatar-img' src={avatarTempPath} mode='aspectFill' />
              ) : (
                <View className='profile-avatar-placeholder'>
                  <Icon name='user' size={48} color='#94A3B8' />
                </View>
              )}
            </Button>

            {/* 昵称选择：显示层 + 隐藏 Input
                - 显示层：View 展示昵称/占位文案，点击触发隐藏 Input 聚焦
                - 隐藏 Input：type='nickname' 承载微信原生昵称面板能力，脱离可视区域
                - onInput 实时同步值到 state，面板选中昵称即可拿到
                - 因为没有可见输入框，从根本上禁止手动键入；自由编辑放在后续"修改名称"页 */}
            <View
              className='profile-nickname'
              onClick={() => setNicknameInputFocus(true)}
            >
              {nickname ? (
                <Text className='profile-nickname-value'>{nickname}</Text>
              ) : (
                <Text className='profile-nickname-placeholder'>点击获取微信昵称</Text>
              )}
            </View>
            <Input
              className='profile-nickname-hidden-input'
              type='nickname'
              focus={nicknameInputFocus}
              value={nickname}
              onInput={(e) => setNickname(e.detail.value)}
              onBlur={() => setNicknameInputFocus(false)}
              maxlength={64}
            />
          </View>

          <View className='login-footer'>
            <View
              className={`login-btn ${loading ? 'login-btn--loading' : ''}`}
              onClick={handleSubmitProfile}
            >
              <Text className='login-btn-text'>
                {loading ? '保存中...' : '完成并进入'}
              </Text>
            </View>
            <View className='profile-skip' onClick={handleSkip}>
              <Text className='profile-skip-text'>暂不完善</Text>
            </View>
          </View>
        </>
      )}

      <View className='login-bottom-space' />
    </View>
  )
}
