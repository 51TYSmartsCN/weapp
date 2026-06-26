import { useEffect, useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import SafeTop from '../../components/SafeTop'
import Skeleton from '../../components/Skeleton'
import { getUser, getAllCourses, showApiError } from '../../services'
import type { User, Course } from '../../types'
import './index.scss'

export default function Learning() {
  const [user, setUser] = useState<User | null>(null)
  const [allCourses, setAllCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([getUser(), getAllCourses()])
      .then(([userData, coursesData]) => {
        setUser(userData)
        setAllCourses(coursesData)
      })
      .catch((err) => showApiError(err, '学习中心数据加载失败'))
      .finally(() => setLoading(false))
  }, [])

  const myCourses = allCourses.slice(0, 3)

  if (!user && !loading) return null

  const continueCourse = user?.continueCourse

  const handleContinue = () => {
    Taro.navigateTo({ url: '/pages/course-detail/index?id=1' })
  }

  const handleCourseClick = (id: number) => {
    Taro.navigateTo({ url: `/pages/course-detail/index?id=${id}` })
  }

  return (
    <ScrollView className='learning-page' scrollY>
      <SafeTop />

      <View className='learning-header'>
        <Text className='learning-title'>学习中心</Text>
      </View>

      {loading ? (
        <>
          <View className='learning-section'>
            <Text className='section-title'>继续学习</Text>
            <View className='continue-card'>
              <Skeleton rows={2} title={false} />
            </View>
          </View>
          <View className='learning-section'>
            <Text className='section-title'>我的课程</Text>
            <Skeleton rows={3} horizontal />
            <Skeleton rows={3} horizontal />
            <Skeleton rows={3} horizontal />
          </View>
          <View className='learning-section'>
            <Text className='section-title'>学习统计</Text>
            <View className='continue-card'>
              <View className='skeleton-learning-stats'>
                <View className='skeleton-learning-stat' />
                <View className='skeleton-learning-stat' />
                <View className='skeleton-learning-stat' />
              </View>
            </View>
          </View>
        </>
      ) : (
        <>
          <View className='learning-section'>
            <Text className='section-title'>继续学习</Text>
            <View className='continue-card'>
              <View className='continue-header'>
                <View className='continue-course'>
                  <View className='continue-name'>{continueCourse?.title}</View>
                  <View className='continue-progress'>
                    <View
                      className='continue-progress-bar'
                      style={{ width: `${continueCourse?.progress}%` }}
                    />
                  </View>
                  <Text className='continue-meta'>
                    已完成 {continueCourse?.completed}/{continueCourse?.total} 节 · 上次学习：{continueCourse?.lastStudy}
                  </Text>
                </View>
                <View className='continue-btn' onClick={handleContinue}>
                  继续学习
                </View>
              </View>
            </View>
          </View>

          <View className='learning-section'>
            <Text className='section-title'>我的课程</Text>
            {myCourses.map((course, index) => {
              const progress = [65, 30, 0][index]
              return (
                <View
                  key={course.id}
                  className='course-item'
                  onClick={() => handleCourseClick(course.id)}
                >
                  <View
                    className='course-cover-small'
                    style={{ background: course.cover }}
                  />
                  <View className='course-item-info'>
                    <View className='course-item-title'>{course.title}</View>
                    <Text className='course-item-progress'>已学习 {progress}%</Text>
                  </View>
                </View>
              )
            })}
          </View>

          <View className='learning-section'>
            <Text className='section-title'>学习统计</Text>
            <View className='continue-card'>
              <View className='learning-stats'>
                <View className='learning-stat'>
                  <Text className='stat-value'>{user?.boughtCourses}</Text>
                  <Text className='stat-label'>已购课程</Text>
                </View>
                <View className='learning-stat'>
                  <Text className='stat-value'>{user?.finishedLessons}</Text>
                  <Text className='stat-label'>已完成课时</Text>
                </View>
                <View className='learning-stat'>
                  <Text className='stat-value'>{user?.studyHours}h</Text>
                  <Text className='stat-label'>学习时长</Text>
                </View>
              </View>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  )
}