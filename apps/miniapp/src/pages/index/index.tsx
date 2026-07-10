import { useEffect, useState } from 'react'
import { View, Text, Image, ScrollView, Swiper, SwiperItem } from '@tarojs/components'
import Taro, { useShareAppMessage, useShareTimeline } from '@tarojs/taro'
// import SearchBar from '../../components/SearchBar'
import SafeTop from '../../components/SafeTop'
import SectionHeader from '../../components/SectionHeader'
import CourseCard from '../../components/CourseCard'
import InstructorCard from '../../components/InstructorCard'
import StatsCard from '../../components/StatsCard'
import Skeleton from '../../components/Skeleton'
import Icon from '../../components/Icon'
import { ApiException, getCategories, getCoursesByCategory, getInstructors, getBanners, getHomeStats, showApiError } from '../../services'
import type { Banner, Course, HomeStatItem, Instructor } from '../../types'
import { Category, CATEGORY_LABELS } from '../../types'
// import { useAutoFill } from '../../hooks/useAutoFill'
import './index.scss'

export default function Index() {
  const [activeCategory, setActiveCategory] = useState(0)
  // const [searchValue, setSearchValue] = useState('')
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [banners, setBanners] = useState<Banner[]>([])
  const [homeStats, setHomeStats] = useState<HomeStatItem[]>([])
  const [loading, setLoading] = useState(true)

  // const searchAutoFill = useAutoFill({
  //   label: 'GEO 实战搜索',
  //   fields: { keyword: 'GEO 实战入门' },
  //   onFill: (fields) => {
  //     setSearchValue(fields.keyword)
  //     handleSearch(fields.keyword)
  //   }
  // })

  const showHomeError = (err: unknown, fallback: string) => {
    if (err instanceof ApiException && err.code === 401) {
      Taro.showToast({ title: fallback, icon: 'none' })
      return
    }
    showApiError(err, fallback)
  }

  const loadCourses = (category: Category) => {
    setLoading(true)
    getCoursesByCategory(category)
      .then((data) => setFilteredCourses(data.slice(0, 2)))
      .catch((err) => showHomeError(err, '课程加载失败'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    Promise.allSettled([
      getCategories(),
      getInstructors(),
      getBanners(),
      getHomeStats(),
    ])
      .then(([categoriesResult, instructorsResult, bannersResult, homeStatsResult]) => {
        const errors: unknown[] = []

        const categoriesData = categoriesResult.status === 'fulfilled' ? categoriesResult.value : []
        if (categoriesResult.status === 'rejected') errors.push(categoriesResult.reason)

        const instructorsData = instructorsResult.status === 'fulfilled' ? instructorsResult.value : []
        if (instructorsResult.status === 'rejected') errors.push(instructorsResult.reason)

        const bannersData = bannersResult.status === 'fulfilled' ? bannersResult.value : []
        if (bannersResult.status === 'rejected') errors.push(bannersResult.reason)

        const homeStatsData = homeStatsResult.status === 'fulfilled' ? homeStatsResult.value : []
        if (homeStatsResult.status === 'rejected') errors.push(homeStatsResult.reason)

        setCategories(categoriesData)
        setInstructors(instructorsData)
        setBanners(bannersData)
        setHomeStats(homeStatsData)

        if (errors.length > 0) {
          showHomeError(errors[0], errors.length === 4 ? '首页数据加载失败' : '首页部分数据加载失败')
        }

        loadCourses(categoriesData[0] || Category.All)
      })
  }, [])

  const handleCategoryChange = (index: number) => {
    setActiveCategory(index)
    const cat = categories[index]
    if (cat != null) loadCourses(cat)
  }

  const goToCourseList = () => {
    Taro.switchTab({ url: '/pages/course-list/index' })
  }

  const goToInstructorList = () => {
    Taro.navigateTo({ url: '/pages/instructor-list/index' })
  }

  // const handleSearch = (value: string) => {
  //   Taro.showToast({ title: `搜索：${value || '全部课程'}`, icon: 'none' })
  //   if (value) {
  //     setSearchValue('')
  //   }
  // }

  // Banner 点击跳转
  const handleBannerClick = (banner: Banner) => {
    if (banner.linkType === 'course' && banner.linkValue) {
      Taro.navigateTo({ url: `/pages/course-detail/index?id=${banner.linkValue}` })
    } else if (banner.linkType === 'page' && banner.linkValue) {
      const url = banner.linkValue
      // TabBar 页面用 switchTab，其它用 navigateTo
      if (
        url.startsWith('/pages/course-list/index') ||
        url.startsWith('/pages/learning/index') ||
        url.startsWith('/pages/profile/index') ||
        url.startsWith('/pages/index/index')
      ) {
        Taro.switchTab({ url })
      } else {
        Taro.navigateTo({ url })
      }
    }
  }

  // 分享给朋友
  useShareAppMessage(() => {
    return {
      title: 'GEO 课程 - 优质在线教育平台',
      path: '/pages/index/index',
    }
  })

  // 分享到朋友圈
  useShareTimeline(() => {
    return {
      title: 'GEO 课程 - 优质在线教育平台',
      query: '',
    }
  })

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
          {/* Banner（接口获取，支持轮播） */}
          {banners.length > 0 && (
            <Swiper
              className='home-banner'
              circular={banners.length > 1}
              autoplay={banners.length > 1}
              interval={4000}
              duration={500}
              indicatorDots={banners.length > 1}
              indicatorColor='rgba(255,255,255,0.5)'
              indicatorActiveColor='#ffffff'
            >
              {banners.map((banner) => (
                <SwiperItem key={banner.id} onClick={() => handleBannerClick(banner)}>
                  <View className='home-banner-item'>
                    {banner.image ? (
                      <Image className='banner-image' src={banner.image} mode='aspectFill' />
                    ) : (
                      <View className='banner-image banner-image--placeholder' />
                    )}
                    <View className='banner-overlay' />
                    <View className='banner-content'>
                      <Text className='banner-title'>{banner.title}</Text>
                      {banner.subtitle ? (
                        <Text className='banner-subtitle'>{banner.subtitle}</Text>
                      ) : null}
                      <View className='banner-cta'>
                        立即探索
                        <Icon name='arrow-right' size={32} color='#fff' />
                      </View>
                    </View>
                  </View>
                </SwiperItem>
              ))}
            </Swiper>
          )}

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
                  onClick={() => handleCategoryChange(index)}
                >
                  <Text>{CATEGORY_LABELS[cat]}</Text>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Hot Courses */}
          <View className='home-section'>
            <SectionHeader title='热门课程' linkText='查看全部' onLinkClick={goToCourseList} />
            {filteredCourses.length === 0 ? (
              <View className='home-course-empty'>
                <Icon name='book-open' size={88} color='#94A3B8' />
                <Text className='home-course-empty-text'>暂无课程，敬请期待</Text>
              </View>
            ) : (
              <View className='course-grid'>
                {filteredCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    mode='grid'
                  />
                ))}
              </View>
            )}
          </View>

          {/* Instructors */}
          <View className='home-section'>
            <SectionHeader title='明星讲师' linkText='查看全部' onLinkClick={goToInstructorList} />
            <ScrollView
              className='instructor-scroll no-scrollbar'
              scrollX
              enableFlex
              scrollWithAnimation
              style={{ width: '100%' }}
            >
              {instructors.map((item) => (
                <InstructorCard
                  key={item.id}
                  instructor={item}
                  onClick={(ins) => Taro.navigateTo({ url: `/pages/instructor-detail/index?id=${ins.id}` })}
                />
              ))}
            </ScrollView>
          </View>

          {/* Stats */}
          {homeStats.length > 0 && (
            <View className='home-section'>
              <StatsCard
                items={homeStats}
                bg='var(--theme-primary-lightest, #F0FDFA)'
                dividerColor='var(--theme-primary-lighter, #99F6E4)'
                valueColor='var(--theme-primary-dark, #0F766E)'
              />
            </View>
          )}

          <View className='home-bottom-space' />
        </>
      )}
    </ScrollView>
  )
}
