import { useEffect, useState, useCallback } from 'react'
import { View, Text, Video, ScrollView } from '@tarojs/components'
import Taro, { useRouter, useDidShow, useShareAppMessage, useShareTimeline } from '@tarojs/taro'
import { createVideoContext } from '@tarojs/taro'
import NavBar from '../../components/NavBar'
import Icon from '../../components/Icon'
import {
  getCourseById,
  getLessons,
  getLessonById,
  getCourseAccess,
  getLessonPlayUrl,
  getLessonContent,
  getModuleModesSync,
  refreshModuleModes,
  showApiError,
  getWxshopEntryState,
  showWxshopUnavailable,
} from '../../services'
import type { Course, Lesson, CourseAccess } from '../../types'
import type { WxshopEntryState } from '../../services'
import './index.scss'

function buildPlayerPath(courseId: number, lessonId?: number | null) {
  const query = lessonId ? `courseId=${courseId}&lessonId=${lessonId}` : `courseId=${courseId}`
  return `/pages/lesson-player/index?${query}`
}

export default function LessonPlayer() {
  const router = useRouter()
  const courseId = Number(router.params.courseId) || 1
  const rawLessonId = Number(router.params.lessonId)
  const lessonId = Number.isFinite(rawLessonId) && rawLessonId > 0 ? rawLessonId : undefined

  // 模块展示模式：'video' = 视频播放; 'text-image' = 图文教程
  const [contentMode, setContentMode] = useState<'video' | 'text-image'>(
    () => getModuleModesSync().lessonPlayer.contentMode
  )

  const [course, setCourse] = useState<Course | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null)
  const [access, setAccess] = useState<CourseAccess | null>(null)
  const [videoUrl, setVideoUrl] = useState<string>('')
  const [lessonContent, setLessonContent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showList, setShowList] = useState(true)
  const [wxshopEntry, setWxshopEntry] = useState<WxshopEntryState | null>(null)
  const playerPath = buildPlayerPath(courseId, currentLesson?.id ?? lessonId)

  // 每次页面显示时刷新模块模式（覆盖冷启动 / 切前台 / 返回页面三种场景，确保后台改动及时生效）
  useDidShow(() => {
    refreshModuleModes()
      .then((modes) => setContentMode(modes.lessonPlayer.contentMode))
      .catch(() => {
        // 网络失败时回退到本地缓存
        setContentMode(getModuleModesSync().lessonPlayer.contentMode)
      })
  })

  // 分享给朋友
  useShareAppMessage(() => {
    const title = course ? `正在学习：${course.title}` : 'GEO 课程学习'
    return {
      title,
      path: playerPath,
    }
  })

  // 分享到朋友圈
  useShareTimeline(() => {
    const title = course ? `正在学习：${course.title}` : 'GEO 课程学习'
    return {
      title,
      query: playerPath.split('?')[1] || `courseId=${courseId}`,
    }
  })

  // 初次加载:课程信息 + 课时列表 + 权限
  useEffect(() => {
    setLoading(true)
    Promise.all([
      getCourseById(courseId),
      getLessons(courseId),
      lessonId ? getLessonById(lessonId).catch(() => undefined) : Promise.resolve(undefined),
      getCourseAccess(courseId),
      getWxshopEntryState(courseId),
    ])
      .then(([courseData, lessonsData, lessonData, accessData, wxshopState]) => {
        setCourse(courseData ?? null)
        setLessons(lessonsData)
        const lessonInCourse = lessonData && lessonsData.some((lesson) => lesson.id === lessonData.id)
        setCurrentLesson(lessonInCourse ? lessonData : lessonsData[0] ?? null)
        setAccess(accessData)
        setWxshopEntry(wxshopState)
      })
      .catch((err) => showApiError(err, '课时加载失败'))
      .finally(() => setLoading(false))
  }, [courseId, lessonId])

  // 切换课时或权限变化时,获取视频地址或图文内容
  useEffect(() => {
    if (!currentLesson || !access?.canLearn) {
      setVideoUrl('')
      setLessonContent('')
      return
    }

    if (contentMode === 'video') {
      // 视频模式:获取视频播放地址
      getLessonPlayUrl(currentLesson.id)
        .then((res) => setVideoUrl(res.videoUrl))
        .catch((err) => {
          // 403 → 用户无权限
          if (err?.code === 401 || err?.code === 403) {
            setAccess((prev) => prev ? { ...prev, canLearn: false, purchased: false } : prev)
            showApiError(err, '请先购买课程')
          } else {
            showApiError(err, '视频地址获取失败')
          }
          setVideoUrl('')
        })
    } else {
      // 图文模式:获取图文内容
      setVideoUrl('')
      getLessonContent(currentLesson.id)
        .then((res) => setLessonContent(res.content))
        .catch((err) => {
          if (err?.code === 401 || err?.code === 403) {
            setAccess((prev) => prev ? { ...prev, canLearn: false, purchased: false } : prev)
            showApiError(err, '请先购买课程')
          } else {
            showApiError(err, '内容加载失败')
          }
          setLessonContent('')
        })
    }
  }, [currentLesson, access?.canLearn, contentMode])

  const handlePlay = useCallback(() => setIsPlaying(true), [])
  const handlePause = useCallback(() => setIsPlaying(false), [])
  const handleEnded = useCallback(() => {
    setIsPlaying(false)
    const ctx = createVideoContext('lessonVideo')
    ctx.pause()
  }, [])

  const handleLessonChange = (lesson: Lesson) => {
    setCurrentLesson(lesson)
    setIsPlaying(false)
  }

  const currentLessonIndex = lessons.findIndex((l) => l.id === currentLesson?.id)
  const hasPrev = currentLessonIndex > 0
  const hasNext = currentLessonIndex < lessons.length - 1

  const handlePrevNext = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev' ? currentLessonIndex - 1 : currentLessonIndex + 1
    if (newIndex >= 0 && newIndex < lessons.length) {
      handleLessonChange(lessons[newIndex])
    }
  }

  const handleGoToBuy = () => {
    if (wxshopEntry?.canOpen) return
    showWxshopUnavailable(wxshopEntry ?? {
      reason: 'missing_product',
      message: '该课程暂未绑定微信小店商品',
    })
  }

  const canOpenWxshop = wxshopEntry?.canOpen === true

  const handleWxshopEnterSuccess = () => {
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

  if (loading) {
    return (
      <View className='lesson-player-page'>
        <NavBar title='课程播放' share copyPath={playerPath} />
        <View className='player-loading'>
          <View className='player-loading-spinner' />
          <Text className='player-loading-text'>加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className='lesson-player-page'>
      <NavBar title='课程播放' share copyPath={playerPath} />

      {/* 内容展示区域 — 视频 / 图文 / 锁屏（由后台模块模式控制） */}
      <View className='player-video-area'>
        {!currentLesson ? (
          <View className='player-lock'>
            <Icon name='book-open' size={80} color='#94A3B8' />
            <Text className='player-lock-title'>暂无可观看课时</Text>
            <Text className='player-lock-desc'>{course?.title}</Text>
          </View>
        ) : access?.canLearn && (contentMode === 'text-image' || videoUrl) ? (
          contentMode === 'text-image' ? (
            <View className='player-article'>
              <Text className='player-article-title'>{currentLesson?.title}</Text>
              <Text className='player-article-content'>
                {lessonContent || '讲师尚未上传图文内容，请稍后再来'}
              </Text>
            </View>
          ) : (
            <Video
              id='lessonVideo'
              className='player-video'
              src={videoUrl}
              controls={true}
              autoplay={false}
              loop={false}
              muted={false}
              showFullscreenBtn={true}
              showPlayBtn={true}
              showCenterPlayBtn={true}
              showBottomProgress={true}
              showProgress={true}
              showRateBtn={'1'}
              enableProgressGesture={true}
              objectFit='contain'
              poster=''
              onPlay={handlePlay}
              onPause={handlePause}
              onEnded={handleEnded}
            />
          )
        ) : (
          <View className='player-lock'>
            <Icon name='lock' size={80} color='#94A3B8' />
            <Text className='player-lock-title'>
              {access?.isVip ? 'VIP 可免费观看' : '该课程需要购买后观看'}
            </Text>
            <Text className='player-lock-desc'>
              {course?.title}
            </Text>
            {!access?.isVip && (
              canOpenWxshop ? (
                <store-product
                  appid={wxshopEntry?.appid}
                  product-id={wxshopEntry?.productId}
                  custom-content
                  open-page='product-detail'
                  logo-position='bottom-right'
                  bindentersuccess={handleWxshopEnterSuccess}
                  bindentererror={(e: any) => handleWxshopEnterError(e.detail)}
                >
                  <View className='player-lock-btn'>
                    去购买课程
                  </View>
                </store-product>
              ) : (
                <View className='player-lock-btn' onClick={handleGoToBuy}>
                  去购买课程
                </View>
              )
            )}
          </View>
        )}
      </View>

      {/* 课时信息 */}
      <View className='player-info'>
        <Text className='player-lesson-title'>{currentLesson?.title || '暂无课时'}</Text>
        <Text className='player-lesson-course'>
          {course?.title}{currentLesson ? ` · 第 ${currentLessonIndex + 1}/${lessons.length} 节` : ''}
        </Text>
      </View>

      {/* 上一课 / 下一课 */}
      <View className='player-switch-row'>
        <View
          className={`player-switch-btn ${!hasPrev ? 'disabled' : ''}`}
          onClick={() => hasPrev && handlePrevNext('prev')}
        >
          <Icon name='skip-back' size={32} color={hasPrev ? 'var(--theme-primary, #0D9488)' : '#CBD5E1'} />
          <Text className={`switch-label ${!hasPrev ? 'disabled' : ''}`}>上一课</Text>
        </View>
        <View
          className={`player-switch-btn ${!hasNext ? 'disabled' : ''}`}
          onClick={() => hasNext && handlePrevNext('next')}
        >
          <Text className={`switch-label ${!hasNext ? 'disabled' : ''}`}>下一课</Text>
          <Icon name='skip-forward' size={32} color={hasNext ? 'var(--theme-primary, #0D9488)' : '#CBD5E1'} />
        </View>
      </View>

      {/* 课时列表切换 */}
      <View className='player-list-toggle' onClick={() => setShowList((prev) => !prev)}>
        <Icon name='list-video' size={32} color='var(--theme-primary, #0D9488)' />
        <Text className='list-toggle-text'>{showList ? '收起目录' : '展开目录'}</Text>
        <Icon
          name='chevron-right'
          size={24}
          color='var(--theme-primary, #0D9488)'
          className={showList ? 'list-toggle-icon expanded' : 'list-toggle-icon'}
        />
      </View>

      {/* 课时列表 */}
      {showList && (
        <ScrollView className='player-lesson-list' scrollY>
          {lessons.map((lesson, index) => {
            const isActive = lesson.id === currentLesson?.id
            const isCompleted = index < (currentLessonIndex >= 0 ? currentLessonIndex : 0)
            return (
              <View
                key={lesson.id}
                className={`player-lesson-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                onClick={() => handleLessonChange(lesson)}
              >
                <View className='lesson-item-left'>
                  {isCompleted ? (
                    <Icon name='check-circle' size={40} color='#10B981' />
                  ) : isActive ? (
                    <View className='lesson-item-playing'>
                      {isPlaying ? (
                        <>
                          <View className='playing-bar' />
                          <View className='playing-bar' />
                          <View className='playing-bar' />
                        </>
                      ) : (
                        <Icon name='play' size={28} color='var(--theme-primary, #0D9488)' />
                      )}
                    </View>
                  ) : (
                    <Text className='lesson-item-number'>{String(index + 1).padStart(2, '0')}</Text>
                  )}
                </View>
                <View className='lesson-item-content'>
                  <Text className={`lesson-item-name ${isActive ? 'active' : ''}`}>{lesson.title}</Text>
                  <Text className='lesson-item-duration'>{lesson.duration}</Text>
                </View>
                {isActive && isPlaying && <Icon name='volume-2' size={28} color='var(--theme-primary, #0D9488)' />}
              </View>
            )
          })}
        </ScrollView>
      )}

      {/* 底部安全区 */}
      <View className='player-bottom-safe safe-bottom' />
    </View>
  )
}
