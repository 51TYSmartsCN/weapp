import { useEffect, useState } from 'react'
import { View, Text, Image, Video, ScrollView } from '@tarojs/components'
import { useRouter } from '@tarojs/taro'
import Taro from '@tarojs/taro'
import NavBar from '../../components/NavBar'

import Avatar from '../../components/Avatar'
import LessonItem from '../../components/LessonItem'
import ReviewCard from '../../components/ReviewCard'
import Skeleton from '../../components/Skeleton'
import Icon from '../../components/Icon'
import { getCourseById, getLessons, getReviews, getCourseAccess, getModuleModesSync, showApiError } from '../../services'
import type { Course, Lesson, Review, CourseAccess } from '../../types'
import './index.scss'

// 默认在线课程封面（当 course.cover 缺失时兜底）
const DEFAULT_COURSE_COVER = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Online%20course%20cover%20with%20abstract%20learning%20concept%2C%20teal%20emerald%20gradient%20background%2C%20modern%20minimal%20education%20illustration&image_size=landscape_4_3'

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
  const [access, setAccess] = useState<CourseAccess | null>(null)
  const [loading, setLoading] = useState(true)
  const [followed, setFollowed] = useState(false)
  const [favorited, setFavorited] = useState(false)

  // 进入页面时同步一次封面模式（后台改动后切前台再进入即生效）
  useEffect(() => {
    const modes = getModuleModesSync()
    setCoverMode(modes.courseDetailCover.mode)
    setCoverVideoUrl(modes.courseDetailCover.videoUrl || '')
  }, [])

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getCourseById(courseId),
      getLessons(courseId),
      getReviews(),
      getCourseAccess(courseId),
    ])
      .then(([courseData, lessonsData, reviewsData, accessData]) => {
        setCourse(courseData ?? null)
        setLessons(lessonsData)
        setReviews(reviewsData)
        setAccess(accessData)
      })
      .catch((err) => showApiError(err, '课程详情加载失败'))
      .finally(() => setLoading(false))
  }, [courseId])

  /** 主按钮点击:已购/免费 → 立即学习;未购 → 跳微信小店购买 */
  const handlePrimaryAction = () => {
    if (access?.canLearn) {
      const firstLesson = lessons[0]
      if (firstLesson) {
        Taro.navigateTo({
          url: `/pages/lesson-player/index?courseId=${courseId}&lessonId=${firstLesson.id}`,
        })
      }
      return
    }
    // 未购:提示去微信小店(实际生产可调用 navigateToMiniProgram 跳微信小店小程序)
    Taro.showToast({ title: '请前往微信小店购买', icon: 'none' })
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

  const handleFavorite = () => {
    setFavorited((prev) => {
      const next = !prev
      Taro.showToast({ title: next ? '已收藏' : '已取消收藏', icon: 'none' })
      return next
    })
  }

  if (!course && !loading) return null

  return (
    <View className='course-detail-page'>
      <NavBar title='课程详情' />

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
                src={course?.cover || DEFAULT_COURSE_COVER}
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
            <View className='detail-section'>
              <View className='detail-card instructor-detail-card'>
                <Avatar text='张' size={80} />
                <View className='instructor-info'>
                  <View className='instructor-header'>
                    <View>
                      <Text className='instructor-name'>张明远</Text>
                      <Text className='instructor-title'>资深 GEO 顾问</Text>
                    </View>
                    <View
                      className={`follow-btn ${followed ? 'followed' : ''}`}
                      onClick={handleFollow}
                    >
                      {followed ? '已关注' : '关注'}
                    </View>
                  </View>
                  <Text className='instructor-bio'>
                    10年搜索引擎优化经验，前 Google 内容策略专家，服务超过500家企业的AI搜索优化需求
                  </Text>
                </View>
              </View>
            </View>

            {/* Curriculum */}
            <View className='detail-section'>
              <View className='detail-card'>
                <View className='detail-section-title'>
                  <Text className='title-main'>课程大纲</Text>
                  <Text className='title-sub'>共 12 节课 · 总时长 6.5 小时</Text>
                </View>
                {lessons.map((lesson, index) => (
                  <LessonItem key={lesson.id} lesson={lesson} completed={index < 2} courseId={courseId} />
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
                <Text className='title-sub'>4.9分 · 326条评价</Text>
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
          <View className='enroll-btn' onClick={handlePrimaryAction}>
            {primaryBtnText}
          </View>
        </View>
      )}
    </View>
  )
}