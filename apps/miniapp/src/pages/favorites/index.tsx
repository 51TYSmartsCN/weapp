import { useEffect, useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import NavBar from '../../components/NavBar'
import CourseCard from '../../components/CourseCard'
import Skeleton from '../../components/Skeleton'
import Icon from '../../components/Icon'
import { getMyFavorites, getCourseById, showApiError } from '../../services'
import type { Course } from '../../types'
import './index.scss'

export default function Favorites() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getMyFavorites()
      .then(async (favs) => {
        const results = await Promise.all(
          favs.map((f) => getCourseById(f.courseId))
        )
        setCourses(results.filter((c): c is Course => Boolean(c)))
      })
      .catch((err) => showApiError(err, '收藏列表加载失败'))
      .finally(() => setLoading(false))
  }, [])

  const goBrowse = () => {
    Taro.switchTab({ url: '/pages/course-list/index' })
  }

  return (
    <View className='favorites-page'>
      <NavBar title='收藏课程' />
      <ScrollView className='favorites-body' scrollY>
        {loading ? (
          <>
            <Skeleton rows={3} horizontal avatar />
            <Skeleton rows={3} horizontal avatar />
          </>
        ) : courses.length === 0 ? (
          <View className='favorites-empty'>
            <Icon name='heart' size={96} color='#94A3B8' />
            <Text className='favorites-empty-text'>还没有收藏课程</Text>
            <View className='favorites-empty-btn' onClick={goBrowse}>
              <Text className='favorites-empty-btn-text'>去逛逛</Text>
            </View>
          </View>
        ) : (
          <View className='favorites-list'>
            {courses.map((c) => (
              <CourseCard key={c.id} course={c} mode='list' />
            ))}
          </View>
        )}
        <View className='safe-bottom' />
      </ScrollView>
    </View>
  )
}
