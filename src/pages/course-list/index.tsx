import { useEffect, useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import SafeTop from '../../components/SafeTop'
import CourseCard from '../../components/CourseCard'
import Skeleton from '../../components/Skeleton'
import Icon from '../../components/Icon'
import { getCategories, getCoursesByCategory, showApiError } from '../../services'
import { Category, CATEGORY_LABELS } from '../../types'
import type { Course } from '../../types'
import './index.scss'

export default function CourseList() {
  const [categories, setCategories] = useState<Category[]>([])
  const [activeCategory, setActiveCategory] = useState<Category>(Category.All)
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [visibleCount, setVisibleCount] = useState(4)

  useEffect(() => {
    setLoading(true)
    getCategories()
      .then((cats) => {
        setCategories(cats)
        setActiveCategory(cats[0] ?? Category.All)
        return getCoursesByCategory(cats[0] ?? Category.All)
      })
      .then(setCourses)
      .catch((err) => showApiError(err, '课程列表加载失败'))
      .finally(() => setLoading(false))
  }, [])

  const handleTabClick = (category: Category) => {
    setActiveCategory(category)
    setVisibleCount(4)
    setLoading(true)
    getCoursesByCategory(category)
      .then(setCourses)
      .catch((err) => showApiError(err, '课程列表加载失败'))
      .finally(() => setLoading(false))
  }

  const handleFilter = () => {
    Taro.showToast({ title: '打开筛选', icon: 'none' })
  }

  const loadMore = () => {
    if (visibleCount >= courses.length) {
      Taro.showToast({ title: '没有更多了', icon: 'none' })
      return
    }
    setVisibleCount((prev) => Math.min(prev + 2, courses.length))
  }

  const visibleCourses = courses.slice(0, visibleCount)

  return (
    <View className='course-list-page'>
      <SafeTop />

      {/* Header */}
      <View className='list-header'>
        <View className='list-title'>全部课程</View>
        <View className='filter-btn' onClick={handleFilter}>
          <Icon name='filter' size={36} color='#475569' />
        </View>
      </View>

      {loading && categories.length === 0 ? (
        <View className='list-body'>
          <ScrollView className='list-sidebar' scrollY>
            {Array.from({ length: 6 }).map((_, i) => (
              <View key={i} className='sidebar-tab skeleton-sidebar-tab' />
            ))}
          </ScrollView>
          <ScrollView className='list-content' scrollY>
            <Skeleton rows={3} horizontal avatar />
            <Skeleton rows={3} horizontal avatar />
            <Skeleton rows={3} horizontal avatar />
          </ScrollView>
        </View>
      ) : (
        <View className='list-body'>
          {/* Left Sidebar Tabs */}
          <ScrollView className='list-sidebar' scrollY>
            {categories.map((cat) => (
              <View
                key={cat}
                className={`sidebar-tab ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => handleTabClick(cat)}
              >
                <Text>{CATEGORY_LABELS[cat]}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Right Content */}
          <ScrollView className='list-content' scrollY>
            {loading ? (
              <>
                <Skeleton rows={3} horizontal avatar />
                <Skeleton rows={3} horizontal avatar />
                <Skeleton rows={3} horizontal avatar />
              </>
            ) : (
              <>
                <View className='course-list'>
                  {visibleCourses.map((course) => (
                    <CourseCard key={course.id} course={course} mode='list' />
                  ))}
                </View>

                {/* Load More */}
                <View className='load-more' onClick={loadMore}>
                  <Text>加载更多</Text>
                  <Icon name='chevron-right' size={24} color='#94A3B8' className='load-icon' />
                </View>
              </>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  )
}