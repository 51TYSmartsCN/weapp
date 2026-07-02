import { useEffect, useState } from 'react'
import { View, Text, Input, ScrollView } from '@tarojs/components'
import { useRouter } from '@tarojs/taro'
import Taro from '@tarojs/taro'
import NavBar from '../../components/NavBar'
import Icon from '../../components/Icon'
import {
  claimByScene,
  claimByToken,
  getClaimSceneStatus,
  getClaimTokenStatus,
  redeemCode,
  showApiError,
  type ClaimStatus,
} from '../../services'
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
  const [claimToken, setClaimToken] = useState('')
  const [claimScene, setClaimScene] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<{ courseId: number; courseTitle: string } | null>(null)
  const [claimStatus, setClaimStatus] = useState<ClaimStatus | null>(null)

  // 支持三类入口：URL Link token、小程序码 scene、手动兑换码 code。
  useEffect(() => {
    const queryCode = (router.params.code || '').trim()
    const queryToken = (router.params.token || '').trim()
    const queryScene = decodeURIComponent((router.params.scene || '').trim())

    if (queryToken) {
      setClaimToken(queryToken)
      loadClaimStatus('token', queryToken)
      return
    }

    if (queryScene) {
      setClaimScene(queryScene)
      loadClaimStatus('scene', queryScene)
      return
    }

    if (queryCode) {
      setCode(queryCode)
      doRedeem(queryCode)
    }
  }, [])

  const loadClaimStatus = async (type: 'token' | 'scene', value: string) => {
    setLoading(true)
    setError('')
    setSuccess(null)
    try {
      const result = type === 'token'
        ? await getClaimTokenStatus(value)
        : await getClaimSceneStatus(value)
      setClaimStatus(result)
      if (result.status === 'claimed_current_user' && result.courseId) {
        setSuccess({ courseId: result.courseId, courseTitle: result.courseTitle || '' })
      }
    } catch (err) {
      showApiError(err, '查询订单失败')
      setError(err instanceof Error ? err.message : '查询订单失败')
    } finally {
      setLoading(false)
    }
  }

  const doClaim = async () => {
    if (!claimToken && !claimScene) return
    setLoading(true)
    setError('')
    try {
      const result = claimToken
        ? await claimByToken(claimToken)
        : await claimByScene(claimScene)
      setClaimStatus(result)
      if (result.status === 'claimed_current_user' && result.courseId) {
        setSuccess({ courseId: result.courseId, courseTitle: result.courseTitle || '' })
        Taro.showToast({ title: '开通成功', icon: 'success' })
        return
      }
      setError(resolveClaimMessage(result))
    } catch (err) {
      showApiError(err, '开通失败')
      setError(err instanceof Error ? err.message : '开通失败')
    } finally {
      setLoading(false)
    }
  }

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
      setClaimStatus(null)
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
    setClaimToken('')
    setClaimScene('')
    setError('')
    setSuccess(null)
    setClaimStatus(null)
  }

  const resolveClaimMessage = (status: ClaimStatus) => {
    if (status.status === 'claimed_other_user') return '该权益已被领取，请联系客服处理'
    if (status.status === 'revoked') return '订单已退款或权益已失效'
    if (status.status === 'expired') return '链接已过期，请输入兑换码或联系客服'
    if (status.status === 'not_found') return '未找到订单权益，请联系客服'
    return '暂时无法开通，请稍后重试'
  }

  const renderClaimPanel = () => {
    if (!claimStatus || success) return null
    const title = claimStatus.courseTitle || '课程权益'
    const canClaim = claimStatus.status === 'active'
    const message = canClaim
      ? claimStatus.requiresLogin
        ? '已确认你的课程权益，请登录后开通课程'
        : '已确认你的课程权益，可立即开通课程'
      : resolveClaimMessage(claimStatus)

    return (
      <View className='video-unlock-claim'>
        <View className='video-unlock-claim-card'>
          <Icon name={canClaim ? 'qr-code' : 'help-circle'} size={56} color={canClaim ? '#0D9488' : '#EF4444'} />
          <Text className='video-unlock-claim-title'>{title}</Text>
          <Text className='video-unlock-claim-desc'>{message}</Text>
        </View>
        {canClaim && (
          <View
            className={`video-unlock-btn ${loading ? 'video-unlock-btn--disabled' : ''}`}
            onClick={() => !loading && doClaim()}
          >
            <Text>{loading ? '开通中...' : claimStatus.requiresLogin ? '登录并开通' : '立即开通'}</Text>
          </View>
        )}
        <View className='video-unlock-btn video-unlock-btn--ghost' onClick={handleReset}>
          <Text>使用兑换码</Text>
        </View>
      </View>
    )
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
        ) : claimStatus ? (
          renderClaimPanel()
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
