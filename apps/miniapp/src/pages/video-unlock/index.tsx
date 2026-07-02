import { useEffect, useState } from 'react'
import { View, Text, Input, ScrollView } from '@tarojs/components'
import { useRouter } from '@tarojs/taro'
import Taro from '@tarojs/taro'
import NavBar from '../../components/NavBar'
import Icon from '../../components/Icon'
import { redeemCode, showApiError } from '../../services'
import './index.scss'

/**
 * 兑换码核销页
 *
 * 对应对接.md 中的 src/pages/video/unlock.tsx，适配项目规范：
 * - 使用 Taro 组件（View/Text/Input/ScrollView），不使用 HTML 标签
 * - 通过 services 层调用 /api/redeem，不在页面内直接 request
 * - 样式使用 rpx + variables.scss
 *
 * 支持两种进入方式：
 * 1. 通过链接带 code 参数自动兑换（视频号小店发货后跳转）
 * 2. 手动输入兑换码（从「我的」菜单进入）
 */
export default function VideoUnlock() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<{ courseId: number; courseTitle: string } | null>(null)

  // 进入页面时若带 code 参数，自动发起兑换
  useEffect(() => {
    const queryCode = (router.params.code || '').trim()
    if (queryCode) {
      setCode(queryCode)
      doRedeem(queryCode)
    }
  }, [])

  const doRedeem = async (targetCode?: string) => {
    const finalCode = (targetCode ?? code).trim()
    if (!finalCode) {
      setError('请输入兑换码')
      return
    }

    setLoading(true)
    setError('')
    setSuccess(null)

    try {
      const result = await redeemCode(finalCode)
      setSuccess(result)
      Taro.showToast({ title: '兑换成功', icon: 'success' })
    } catch (err) {
      // 未登录时 services 层会自动跳转登录页，这里展示其余错误
      showApiError(err, '兑换失败')
      setError(err instanceof Error ? err.message : '兑换失败')
    } finally {
      setLoading(false)
    }
  }

  const handleGoToCourse = () => {
    if (!success) return
    Taro.navigateTo({
      url: `/pages/course-detail/index?id=${success.courseId}`,
    })
  }

  const handleReset = () => {
    setCode('')
    setError('')
    setSuccess(null)
  }

  return (
    <View className='video-unlock-page'>
      <NavBar title='兑换课程' />
      <ScrollView className='video-unlock-body' scrollY>
        <View className='video-unlock-hero'>
          <View className='video-unlock-hero-icon'>
            <Icon name='lock' size={64} color='#FFFFFF' />
          </View>
          <Text className='video-unlock-hero-title'>兑换付费课程</Text>
          <Text className='video-unlock-hero-desc'>
            输入视频号小店购买后获得的兑换码，即可解锁对应课程
          </Text>
        </View>

        {success ? (
          <View className='video-unlock-success'>
            <View className='video-unlock-success-card'>
              <Icon name='check-circle' size={64} color='#10B981' />
              <Text className='video-unlock-success-title'>兑换成功</Text>
              <Text className='video-unlock-success-course'>{success.courseTitle}</Text>
              <Text className='video-unlock-success-tip'>课程已加入「我的课程」，可立即开始学习</Text>
            </View>
            <View className='video-unlock-btn' onClick={handleGoToCourse}>
              <Text>立即学习</Text>
            </View>
            <View className='video-unlock-btn video-unlock-btn--ghost' onClick={handleReset}>
              <Text>继续兑换</Text>
            </View>
          </View>
        ) : (
          <View className='video-unlock-form'>
            <View className='video-unlock-input-wrap'>
              <Input
                className='video-unlock-input'
                value={code}
                onInput={(e) => setCode(e.detail.value)}
                onConfirm={() => doRedeem()}
                placeholder='请输入兑换码'
                placeholderClass='video-unlock-input-placeholder'
                maxlength={32}
                confirmType='go'
              />
            </View>
            {error && (
              <View className='video-unlock-error'>
                <Icon name='help-circle' size={28} color='#EF4444' />
                <Text className='video-unlock-error-text'>{error}</Text>
              </View>
            )}
            <View
              className={`video-unlock-btn ${loading || !code ? 'video-unlock-btn--disabled' : ''}`}
              onClick={() => !loading && doRedeem()}
            >
              <Text>{loading ? '兑换中…' : '立即兑换'}</Text>
            </View>

            <View className='video-unlock-tips'>
              <Text className='video-unlock-tips-title'>兑换说明</Text>
              <Text className='video-unlock-tips-item'>· 兑换码由视频号小店购买后发放</Text>
              <Text className='video-unlock-tips-item'>· 每个兑换码仅可使用一次</Text>
              <Text className='video-unlock-tips-item'>· 兑换成功后课程将永久解锁</Text>
              <Text className='video-unlock-tips-item'>· 如遇兑换问题请联系客服</Text>
            </View>
          </View>
        )}

        <View className='safe-bottom' />
      </ScrollView>
    </View>
  )
}
