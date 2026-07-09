import { useEffect, useRef, useState } from 'react'
import { View, Text, Image, Video, ScrollView } from '@tarojs/components'
import { useRouter, useDidShow, useShareAppMessage, useShareTimeline } from '@tarojs/taro'
import Taro from '@tarojs/taro'
import NavBar from '../../components/NavBar'

import Avatar from '../../components/Avatar'
import LessonItem from '../../components/LessonItem'
import ReviewCard from '../../components/ReviewCard'
import Skeleton from '../../components/Skeleton'
import Icon from '../../components/Icon'
import { getCourseById, getLessons, getReviews, getCourseAccess, getModuleModesSync, refreshModuleModes, showApiError, getWxshopEntryState, showWxshopUnavailable, markWxshopPurchasePending, getWxshopPendingPurchase, clearWxshopPendingPurchase, toggleFavorite, checkFavorite, getInstructorById, resolveColor, resolveUrl } from '../../services'
import type { Course, Lesson, Review, CourseAccess, Instructor } from '../../types'
import type { WxshopEntryState } from '../../services'
import './index.scss'

// 默认在线课程封面（当 course.cover 缺失时兜底）
const DEFAULT_COURSE_COVER = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Online%20course%20cover%20with%20abstract%20learning%20concept%2C%20teal%20emerald%20gradient%20background%2C%20modern%20minimal%20education%20illustration&image_size=landscape_4_3'

function resolveCourseCover(cover?: string): string {
  if (!cover) return DEFAULT_COURSE_COVER
  if (cover.startsWith('/')) return resolveUrl(cover)
  return cover
}

export default function CourseDetail() {
  const router = useRouter()
  const courseId = Number(router.params.id) || 1

  // 课程详情页封面展示模式：'image' = 静态封面图; 'video' = 视频预览
  const [coverMode, setCoverMode] = useState<'image' | 'video'>(
    () => getModuleModesSync().courseDetailCover.mode
  )
  const [coverVideoUrl, setCoverVideoUrl] = useState<string>(
    () => getModuleModesSync().courseDetailCover.videoUrl || ''
  )

  const [course, setCourse] = useState<Course | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [instructor, setInstructor] = useState<Instructor | null>(null)
  const [access, setAccess] = useState<CourseAccess | null>(null)
  const [loading, setLoading] = useState(true)
  const [followed, setFollowed] = useState(false)
  const [favorited, setFavorited] = useState(false)
  const [wxshopEntry, setWxshopEntry] = useState<WxshopEntryState | null>(null)
  const [wxshopChecking, setWxshopChecking] = useState(false)
  const wxshopCheckingRef = useRef(false)

  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  const checkWxshopPurchaseReturn = async () => {
    const pending = getWxshopPendingPurchase(courseId)
    if (!pending || wxshopCheckingRef.current) return

    if (Date.now() - pending.startedAt > 30 * 60 * 1000) {
      clearWxshopPendingPurchase(courseId)
      return
    }

    wxshopCheckingRef.current = true
    setWxshopChecking(true)
    try {
      for (let i = 0; i < 6; i++) {
        const nextAccess = await getCourseAccess(courseId)
        setAccess(nextAccess)
        if (nextAccess.canLearn) {
          clearWxshopPendingPurchase(courseId)
          Taro.showToast({ title: '课程已开通', icon: 'success' })
          return
        }
        if (i < 5) await wait(i < 2 ? 1500 : 3000)
      }
      Taro.showToast({ title: '支付结果确认中，请稍后刷新', icon: 'none' })
    } catch (err) {
      console.warn('[wxshop] check purchase return failed:', err)
    } finally {
      wxshopCheckingRef.current = false
      setWxshopChecking(false)
    }
  }

  // 每次页面显示时刷新封面模式（覆盖冷启动 / 切前台 / 返回页面三种场景，确保后台改动及时生效）
  useDidShow(() => {
    refreshModuleModes()
      .then((modes) => {
        setCoverMode(modes.courseDetailCover.mode)
        setCoverVideoUrl(modes.courseDetailCover.videoUrl || '')
      })
      .catch(() => {
        // 网络失败时回退到本地缓存
        const modes = getModuleModesSync()
        setCoverMode(modes.courseDetailCover.mode)
        setCoverVideoUrl(modes.courseDetailCover.videoUrl || '')
      })
    checkWxshopPurchaseReturn()
  })

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getCourseById(courseId),
      getLessons(courseId),
      getReviews(courseId),
      getCourseAccess(courseId),
      getWxshopEntryState(courseId),
    ])
      .then(async ([courseData, lessonsData, reviewsData, accessData, wxshopState]) => {
        setCourse(courseData ?? null)
        setLessons(lessonsData)
        setReviews(reviewsData)
        setAccess(accessData)
        setWxshopEntry(wxshopState)

        // 加载讲师信息
        if (courseData?.instructorId) {
          const ins = await getInstructorById(courseData.instructorId)
          setInstructor(ins ?? null)
        } else if (courseData?.instructor) {
          // 兼容只有 instructor 名字的情况，构造一个最小对象
          setInstructor({
            id: 0,
            name: courseData.instructor,
            title: '',
            service: '',
            color: '#0D9488',
          })
        }
      })
      .catch((err) => showApiError(err, '课程详情加载失败'))
      .finally(() => setLoading(false))
  }, [courseId])

  // 进入页面时同步收藏状态
  useEffect(() => {
    checkFavorite(courseId)
      .then(setFavorited)
      .catch(() => setFavorited(false))
  }, [courseId])

  // 分享给朋友
  useShareAppMessage(() => {
    const title = course ? `${course.title} - GEO 课程` : 'GEO 课程详情'
    return {
      title,
      path: `/pages/course-detail/index?id=${courseId}`,
    }
  })

  // 分享到朋友圈
  useShareTimeline(() => {
    const title = course ? `${course.title} - GEO 课程` : 'GEO 课程详情'
    return {
      title,
      query: `id=${courseId}`,
    }
  })

  /** 主按钮点击:已购/免费 → 立即学习 */
  const handlePrimaryAction = () => {
    if (!access?.canLearn) return

    const firstLesson = lessons[0]
    if (!firstLesson) {
      Taro.showToast({ title: '暂无可观看课时', icon: 'none' })
      return
    }

    Taro.navigateTo({
      url: `/pages/lesson-player/index?courseId=${courseId}&lessonId=${firstLesson.id}`,
    }).catch(() => {
      Taro.showToast({ title: '打开课程失败', icon: 'none' })
    })
  }

  // store-product 自定义样式：让组件 UI 贴合课程详情页的绿色主题
  const storeProductStyle = {
    card: { 'background-color': '#FFFFFF' },
    title: { color: '#0F172A' },
    price: { color: '#0D9488' },
    'buy-button': {
      width: '100%',
      'border-radius': '9999rpx',
      'background-color': '#0D9488',
      color: '#FFFFFF',
    },
    'buy-button-disabled': {
      width: '100%',
      'border-radius': '9999rpx',
      'background-color': '#0D9488',
      color: '#FFFFFF',
    },
  }

  /** 主按钮文案 */
  const primaryBtnText = (() => {
    if (!access) return '立即报名'
    if (access.isFree) return '免费观看'
    if (access.isVip) return 'VIP 免费学'
    if (access.purchased) return '立即学习'
    return '去微信小店购买'
  })()

  const handleFollow = () => {
    setFollowed((prev) => {
      const next = !prev
      Taro.showToast({ title: next ? '已关注讲师' : '已取消关注', icon: 'none' })
      return next
    })
  }

  const handleFavorite = async () => {
    const next = !favorited
    setFavorited(next)
    Taro.showToast({ title: next ? '已收藏' : '已取消收藏', icon: 'none' })
    try {
      await toggleFavorite(courseId)
    } catch {
      // 失败时回滚状态
      setFavorited(!next)
      showApiError(new Error('收藏操作失败'), '')
    }
  }

  if (!course && !loading) return null

  const totalLessons = lessons.length
  const totalSeconds = lessons.reduce((sum, l) => sum + (l.durationSeconds || 0), 0)
  const totalHours = (totalSeconds / 3600).toFixed(1)
  const canOpenWxshop = wxshopEntry?.canOpen === true

  const handleWxshopEnterSuccess = () => {
    if (wxshopEntry?.productId) {
      markWxshopPurchasePending({
        courseId,
        productId: wxshopEntry.productId,
        courseTitle: course?.title,
        productTitle: wxshopEntry.product?.productTitle,
        sourcePage: 'course-detail',
      })
    }
    console.log('[wxshop] enter success', {
      courseId,
      productId: wxshopEntry?.productId,
      appid: wxshopEntry?.appid,
    })
  }

  const handleWxshopEnterError = (detail?: unknown) => {
    console.error('[wxshop] enter error', {
      courseId,
      detail,
      state: wxshopEntry,
    })
    Taro.showToast({ title: '打开微信小店失败', icon: 'none' })
  }

  return (
    <View className='course-detail-page'>
      <NavBar title='课程详情' share copyPath={`/pages/course-detail/index?id=${courseId}`} />

      <ScrollView className='detail-scroll' scrollY>
        {loading ? (
          <>
            <View className='skeleton-detail-cover' />
            <View className='detail-info-card'>
              <Skeleton rows={2} title={false} />
              <View className='skeleton-tags'>
                <View className='skeleton-tag' />
                <View className='skeleton-tag' />
              </View>
            </View>
            <View className='detail-section'>
              <Skeleton rows={3} horizontal avatar />
            </View>
            <View className='detail-section'>
              <Skeleton rows={3} title={false} />
            </View>
            <View className='detail-section'>
              <Skeleton rows={4} horizontal avatar />
              <Skeleton rows={4} horizontal avatar />
            </View>
          </>
        ) : (
          <>
            {/* Cover — 由后台模块模式控制：image 或 video */}
            {coverMode === 'video' && coverVideoUrl ? (
              <Video
                className='detail-cover'
                src={coverVideoUrl}
                controls={true}
                autoplay={false}
                muted={true}
                loop={true}
                objectFit='cover'
                showCenterPlayBtn={true}
              />
            ) : (
              <Image
                className='detail-cover'
                src={resolveCourseCover(course?.cover)}
                mode='aspectFill'
              />
            )}

            {/* Info Card */}
            <View className='detail-info-card'>
              <Text className='detail-title'>{course?.title}</Text>
              <View className='detail-price-row'>
                <Text className='detail-price'>¥{course?.price}</Text>
                {course?.originalPrice && (
                  <Text className='detail-original'>¥{course.originalPrice}</Text>
                )}
              </View>
              <View className='detail-meta-row'>
                <Icon name='star' size={28} color='#F59E0B' />
                <Text className='detail-rating'>{course?.rating}</Text>
                <View className='detail-divider' />
                <Text className='detail-meta-text'>{course?.students}人已学</Text>
                <View className='detail-divider' />
                <Text className='detail-meta-text'>更新至2026.06</Text>
              </View>
              <View className='detail-tags'>
                {course?.tags?.map((tag) => (
                  <Text key={tag} className='detail-tag'>
                    {tag}
                  </Text>
                ))}
              </View>
            </View>

            {/* Instructor */}
            {instructor && (
              <View className='detail-section'>
                <View className='detail-card instructor-detail-card'>
                  <Avatar text={instructor.name?.charAt(0) || '?'} size={80} bg={resolveColor(instructor.color)} src={instructor.avatar} />
                  <View className='instructor-info'>
                    <View className='instructor-header'>
                      <View>
                        <Text className='instructor-name'>{instructor.name}</Text>
                        <Text className='instructor-title'>{instructor.title || course?.instructor}</Text>
                      </View>
                      <View
                        className={`follow-btn ${followed ? 'followed' : ''}`}
                        onClick={handleFollow}
                      >
                        {followed ? '已关注' : '关注'}
                      </View>
                    </View>
                    <Text className='instructor-bio'>
                      {instructor.bio || instructor.service || '暂无简介'}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Curriculum */}
            <View className='detail-section'>
              <View className='detail-card'>
                <View className='detail-section-title'>
                  <Text className='title-main'>课程大纲</Text>
                  <Text className='title-sub'>共 {totalLessons} 节课 · 总时长 {totalHours} 小时</Text>
                </View>
                {lessons.map((lesson) => (
                  <LessonItem key={lesson.id} lesson={lesson} completed={false} courseId={courseId} />
                ))}
                <View className='more-lessons'>
                  <Text>+ 更多课程</Text>
                </View>
              </View>
            </View>

            {/* Reviews */}
            <View className='detail-section'>
              <View className='detail-section-title'>
                <Text className='title-main'>学员评价</Text>
                <Text className='title-sub'>{course?.rating || 0}分 · {reviews.length}条评价</Text>
              </View>
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </View>
          </>
        )}

        <View className='detail-bottom-space' />
      </ScrollView>

      {/* Sticky Bottom */}
      {!loading && (
        <View className='detail-bottom-bar safe-bottom'>
          <View className='detail-actions'>
            <View className='icon-action' onClick={() => Taro.navigateTo({ url: '/pages/contact-wx/index' })}>
              <Icon name='message-circle' size={44} color='#475569' />
              <Text>客服</Text>
            </View>
            <View className='icon-action' onClick={handleFavorite}>
              <Icon name='heart' size={44} color={favorited ? '#EF4444' : '#475569'} />
              <Text>收藏</Text>
            </View>
          </View>
          {access?.canLearn ? (
            <View className='enroll-btn' onClick={handlePrimaryAction}>
              {primaryBtnText}
            </View>
          ) : wxshopChecking ? (
            <View className='enroll-btn'>
              支付确认中...
            </View>
          ) : canOpenWxshop ? (
            <store-product
              class='store-product-btn'
              appid={wxshopEntry?.appid}
              product-id={wxshopEntry?.productId}
              product-path={wxshopEntry?.config.productPath}
              custom-style={storeProductStyle}
              bindentersuccess={handleWxshopEnterSuccess}
              bindentererror={(e: any) => {
                handleWxshopEnterError(e.detail)
              }}
            />
          ) : (
            <View
              className='enroll-btn'
              onClick={() => showWxshopUnavailable(wxshopEntry ?? {
                reason: 'missing_product',
                message: '该课程暂未绑定微信小店商品',
              })}
            >
              {primaryBtnText}
            </View>
          )}
        </View>
      )}
    </View>
  )
}
