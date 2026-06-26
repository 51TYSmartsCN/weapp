import { useEffect, useMemo, useState } from 'react'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
// import SearchBar from '../../components/SearchBar'
import SafeTop from '../../components/SafeTop'
import SectionHeader from '../../components/SectionHeader'
import CourseCard from '../../components/CourseCard'
import InstructorCard from '../../components/InstructorCard'
import StatsCard from '../../components/StatsCard'
import Skeleton from '../../components/Skeleton'
import Icon from '../../components/Icon'
import { getAllCourses, getCategories, getInstructors, showApiError } from '../../services'
import type { Course, Instructor } from '../../types'
import { Category, CATEGORY_LABELS, CATEGORY_TAG } from '../../types'
// import { useAutoFill } from '../../hooks/useAutoFill'
import bannerImg from '../../assets/image_0_yi19x4.jpg'
import './index.scss'

export default function Index() {
  const [activeCategory, setActiveCategory] = useState(0)
  // const [searchValue, setSearchValue] = useState('')
  const [allCourses, setAllCourses] = useState<Course[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [loading, setLoading] = useState(true)

  // const searchAutoFill = useAutoFill({
  //   label: 'GEO 实战搜索',
  //   fields: { keyword: 'GEO 实战入门' },
  //   onFill: (fields) => {
  //     setSearchValue(fields.keyword)
  //     handleSearch(fields.keyword)
  //   }
  // })

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getAllCourses(),
      getCategories(),
      getInstructors(),
    ])
      .then(([coursesData, categoriesData, instructorsData]) => {
        setAllCourses(coursesData)
        setCategories(categoriesData)
        setInstructors(instructorsData)
      })
      .catch((err) => showApiError(err, '首页数据加载失败'))
      .finally(() => setLoading(false))
  }, [])

  const goToCourseList = () => {
    Taro.switchTab({ url: '/pages/course-list/index' })
  }

  // const handleSearch = (value: string) => {
  //   Taro.showToast({ title: `搜索：${value || '全部课程'}`, icon: 'none' })
  //   if (value) {
  //     setSearchValue('')
  //   }
  // }

  const filteredCourses = useMemo(() => {
    const cat = categories[activeCategory]
    const tagFilter = CATEGORY_TAG[cat]
    if (tagFilter === null) return allCourses.slice(0, 2)
    return allCourses.filter((c) => c.tags?.includes(tagFilter)).slice(0, 2)
  }, [activeCategory, allCourses, categories])

  return (
    <ScrollView className='home-page' scrollY>
      <SafeTop statusBarOnly />
      {loading ? (
        <>
          <View className='skeleton-banner' />
          <Skeleton rows={1} title={false} />
          <View className='home-section'>
            <View className='course-grid'>
              <Skeleton rows={2} />
              <Skeleton rows={2} />
            </View>
          </View>
          <View className='home-section'>
            <Skeleton rows={2} horizontal avatar />
          </View>
          <View className='home-section'>
            <Skeleton rows={2} title={false} />
          </View>
        </>
      ) : (
        <>
          {/* Banner */}
          <View className='home-banner'>
            <Image className='banner-image' src={bannerImg} mode='aspectFill' />
            <View className='banner-overlay' />
            <View className='banner-content'>
              <Text className='banner-title'>掌握 GEO，领先 AI 搜索时代</Text>
              <Text className='banner-subtitle'>让 AI 引擎优先推荐你的内容</Text>
              <View className='banner-cta' onClick={goToCourseList}>
                立即探索
                <Icon name='arrow-right' size={32} color='#fff' />
              </View>
            </View>
          </View>

          {/* Search */}
          {/* <View className='home-search'>
            <SearchBar
              value={searchValue}
              onChange={setSearchValue}
              onConfirm={handleSearch}
            />
            {searchAutoFill.showFillButton && (
              <View className='dev-fill-btn' onClick={searchAutoFill.fill}>
                <Icon name='search' size={24} color='#fff' />
                <Text>一键填写</Text>
              </View>
            )}
          </View> */}

          {/* Categories */}
          {categories.length > 0 && (
            <ScrollView
              className='home-categories no-scrollbar'
              scrollX
              enableFlex
              scrollWithAnimation
              style={{ width: '100%' }}
            >
              {categories.map((cat, index) => (
                <View
                  key={cat}
                  className={`category-pill ${activeCategory === index ? 'active' : ''}`}
                  onClick={() => setActiveCategory(index)}
                >
                  <Text>{CATEGORY_LABELS[cat]}</Text>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Hot Courses */}
          <View className='home-section'>
            <SectionHeader title='热门课程' linkText='查看全部' onLinkClick={goToCourseList} />
            <View className='course-grid'>
              {filteredCourses.map((course, index) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  mode='grid'
                  icon={index === 0 ? 'book-open' : 'megaphone'}
                  iconColor={index === 0 ? '#0F766E' : '#92400E'}
                />
              ))}
            </View>
          </View>

          {/* Instructors */}
          <View className='home-section'>
            <SectionHeader title='明星讲师' />
            <ScrollView
              className='instructor-scroll no-scrollbar'
              scrollX
              enableFlex
              scrollWithAnimation
              style={{ width: '100%' }}
            >
              {instructors.map((item) => (
                <InstructorCard key={item.id} instructor={item} />
              ))}
            </ScrollView>
          </View>

          {/* Stats */}
          <View className='home-section'>
            <StatsCard
              items={[
                { value: '10,000+', label: '学员' },
                { value: '200+', label: '企业客户' },
                { value: '98%', label: '好评率' }
              ]}
              bg='#F0FDFA'
              dividerColor='#99F6E4'
              valueColor='#0F766E'
            />
          </View>

          <View className='home-bottom-space' />
        </>
      )}
    </ScrollView>
  )
}