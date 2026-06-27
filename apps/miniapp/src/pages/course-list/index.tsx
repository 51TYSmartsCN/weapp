import { useEffect, useMemo, useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import SafeTop from '../../components/SafeTop'
import SearchBar from '../../components/SearchBar'
import CourseCard from '../../components/CourseCard'
import Skeleton from '../../components/Skeleton'
import Icon from '../../components/Icon'
import { getCategories, getCoursesByCategory, getAllCourses, showApiError } from '../../services'
import { Category, CATEGORY_LABELS } from '../../types'
import type { Course } from '../../types'
import './index.scss'

type SortKey = 'default' | 'newest' | 'priceAsc' | 'priceDesc' | 'rating'

const SORT_LABELS: Record<SortKey, string> = {
  default: '综合排序',
  newest: '最新',
  priceAsc: '价格升序',
  priceDesc: '价格降序',
  rating: '评分',
}

const SORT_KEYS: SortKey[] = ['default', 'newest', 'priceAsc', 'priceDesc', 'rating']

export default function CourseList() {
  const [categories, setCategories] = useState<Category[]>([])
  const [activeCategory, setActiveCategory] = useState<Category>(Category.All)
  // 每个分类对应的课程列表（用于准确计数与即时切换，避免本地 tag 过滤与后端不一致）
  const [coursesByCategory, setCoursesByCategory] = useState<Record<string, Course[]>>({})
  const [keyword, setKeyword] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('default')
  const [loading, setLoading] = useState(true)
  const [visibleCount, setVisibleCount] = useState(4)

  useEffect(() => {
    setLoading(true)
    getCategories()
      .then((cats) => {
        setCategories(cats)
        setActiveCategory(cats[0] ?? Category.All)
        // 并行拉取每个分类的真实课程列表，计数直接取 length
        // All 走 getAllCourses（后端无 category 过滤），其余走 getCoursesByCategory
        return Promise.all(
          cats.map((cat) =>
            cat === Category.All ? getAllCourses() : getCoursesByCategory(cat)
          )
        ).then((results) => {
          const map: Record<string, Course[]> = {}
          cats.forEach((cat, i) => {
            map[cat] = results[i]
          })
          setCoursesByCategory(map)
        })
      })
      .catch((err) => showApiError(err, '课程列表加载失败'))
      .finally(() => setLoading(false))
  }, [])

  // 数据已预取，切换分类即时切换，无需再次请求
  const handleTabClick = (category: Category) => {
    setActiveCategory(category)
  }

  const handleFilter = () => {
    Taro.showActionSheet({
      itemList: SORT_KEYS.map((k) => SORT_LABELS[k]),
      success: (res) => {
        setSortKey(SORT_KEYS[res.tapIndex])
      },
      fail: () => {},
    })
  }

  // 切换分类 / 关键词 / 排序时重置分页
  useEffect(() => {
    setVisibleCount(4)
  }, [activeCategory, keyword, sortKey])

  const categoryCounts = useMemo<Record<string, number>>(() => {
    const counts: Record<string, number> = {}
    categories.forEach((cat) => {
      counts[cat] = coursesByCategory[cat]?.length ?? 0
    })
    return counts
  }, [categories, coursesByCategory])

  const activeCourses = useMemo(
    () => coursesByCategory[activeCategory] ?? [],
    [coursesByCategory, activeCategory]
  )

  const filteredSorted = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    let list = activeCourses
    if (kw) {
      list = activeCourses.filter(
        (c) =>
          c.title.toLowerCase().includes(kw) ||
          c.instructor.toLowerCase().includes(kw) ||
          (c.tags ?? []).some((t) => t.toLowerCase().includes(kw))
      )
    }
    const sorted = [...list]
    switch (sortKey) {
      case 'newest':
        sorted.sort((a, b) => b.id - a.id)
        break
      case 'priceAsc':
        sorted.sort((a, b) => a.price - b.price)
        break
      case 'priceDesc':
        sorted.sort((a, b) => b.price - a.price)
        break
      case 'rating':
        sorted.sort((a, b) => b.rating - a.rating)
        break
      default:
        break
    }
    return sorted
  }, [activeCourses, keyword, sortKey])

  const loadMore = () => {
    const total = filteredSorted.length
    if (visibleCount >= total) {
      Taro.showToast({ title: '没有更多了', icon: 'none' })
      return
    }
    setVisibleCount((prev) => Math.min(prev + 2, total))
  }

  const displayCourses = filteredSorted.slice(0, visibleCount)

  return (
    <View className='course-list-page'>
      <SafeTop />

      {/* Search */}
      <View className='search-wrapper'>
        <SearchBar
          value={keyword}
          placeholder='搜索课程、讲师或标签'
          onChange={(v) => setKeyword(v)}
        />
      </View>

      {/* Header */}
      <View className='list-header'>
        <View className='list-title'>全部课程</View>
        <View className='header-right'>
          <Text className='sort-label'>{SORT_LABELS[sortKey]}</Text>
          <View className='filter-btn' onClick={handleFilter}>
            <Icon name='filter' size={36} color='#475569' />
          </View>
        </View>
      </View>

      {loading ? (
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
                <Text className='sidebar-tab-label'>{CATEGORY_LABELS[cat]}</Text>
                <Text className='sidebar-tab-count'>{categoryCounts[cat] ?? 0}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Right Content */}
          <ScrollView className='list-content' scrollY onScrollToLower={loadMore} lowerThreshold={80}>
            {filteredSorted.length === 0 ? (
              <View className='empty-state'>
                <Icon name='book-open' size={96} color='#94A3B8' />
                <Text className='empty-text'>没有找到相关课程</Text>
              </View>
            ) : (
              <View className='course-list'>
                {displayCourses.map((course) => (
                  <CourseCard key={course.id} course={course} mode='list' />
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  )
}
