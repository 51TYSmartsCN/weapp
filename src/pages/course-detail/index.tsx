import { useEffect, useState } from 'react'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import { useRouter } from '@tarojs/taro'
import Taro from '@tarojs/taro'
import NavBar from '../../components/NavBar'

import Avatar from '../../components/Avatar'
import LessonItem from '../../components/LessonItem'
import ReviewCard from '../../components/ReviewCard'
import Skeleton from '../../components/Skeleton'
import Icon from '../../components/Icon'
import { getCourseById, getLessons, getReviews, showApiError } from '../../services'
import type { Course, Lesson, Review } from '../../types'
import coverImg from '../../assets/image_1_yi19x4.jpg'
import './index.scss'

export default function CourseDetail() {
  const router = useRouter()
  const courseId = Number(router.params.id) || 1

  const [course, setCourse] = useState<Course | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [followed, setFollowed] = useState(false)
  const [favorited, setFavorited] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getCourseById(courseId),
      getLessons(),
      getReviews(),
    ])
      .then(([courseData, lessonsData, reviewsData]) => {
        setCourse(courseData ?? null)
        setLessons(lessonsData)
        setReviews(reviewsData)
      })
      .catch((err) => showApiError(err, '课程详情加载失败'))
      .finally(() => setLoading(false))
  }, [courseId])

  const handleEnroll = () => {
    Taro.showToast({ title: '报名成功', icon: 'success' })
  }

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
            {/* Cover */}
            <Image className='detail-cover' src={coverImg} mode='aspectFill' />

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
                  <LessonItem key={lesson.id} lesson={lesson} completed={index < 2} />
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
            <View className='icon-action' onClick={() => Taro.showToast({ title: '客服', icon: 'none' })}>
              <Icon name='message-circle' size={44} color='#475569' />
              <Text>客服</Text>
            </View>
            <View className='icon-action' onClick={handleFavorite}>
              <Icon name='heart' size={44} color={favorited ? '#EF4444' : '#475569'} />
              <Text>收藏</Text>
            </View>
          </View>
          <View className='enroll-btn' onClick={handleEnroll}>
            立即报名
          </View>
        </View>
      )}
    </View>
  )
}