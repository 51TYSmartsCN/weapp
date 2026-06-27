import { useEffect, useState, useCallback } from 'react'
import { View, Text, Video, ScrollView } from '@tarojs/components'
import { useRouter } from '@tarojs/taro'
import { createVideoContext } from '@tarojs/taro'
import NavBar from '../../components/NavBar'
import Icon from '../../components/Icon'
import { getCourseById, getLessons, getLessonById, showApiError } from '../../services'
import type { Course, Lesson } from '../../types'
import './index.scss'

export default function LessonPlayer() {
  const router = useRouter()
  const courseId = Number(router.params.courseId) || 1
  const lessonId = Number(router.params.lessonId) || 1

  const [course, setCourse] = useState<Course | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showList, setShowList] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([getCourseById(courseId), getLessons(), getLessonById(lessonId)])
      .then(([courseData, lessonsData, lessonData]) => {
        setCourse(courseData ?? null)
        setLessons(lessonsData)
        setCurrentLesson(lessonData ?? lessonsData[0] ?? null)
      })
      .catch((err) => showApiError(err, '课时加载失败'))
      .finally(() => setLoading(false))
  }, [courseId, lessonId])

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

  const videoSrc = currentLesson?.videoUrl ?? ''

  if (loading) {
    return (
      <View className='lesson-player-page'>
        <NavBar title='课程播放' />
        <View className='player-loading'>
          <View className='player-loading-spinner' />
          <Text className='player-loading-text'>加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className='lesson-player-page'>
      <NavBar title='课程播放' />

      {/* 视频播放区域 — 原生控件负责播放/进度/全屏/倍速 */}
      <View className='player-video-area'>
        <Video
          id='lessonVideo'
          className='player-video'
          src={videoSrc}
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
      </View>

      {/* 课时信息 */}
      <View className='player-info'>
        <Text className='player-lesson-title'>{currentLesson?.title}</Text>
        <Text className='player-lesson-course'>
          {course?.title} · 第 {currentLessonIndex + 1}/{lessons.length} 节
        </Text>
      </View>

      {/* 上一课 / 下一课 */}
      <View className='player-switch-row'>
        <View
          className={`player-switch-btn ${!hasPrev ? 'disabled' : ''}`}
          onClick={() => hasPrev && handlePrevNext('prev')}
        >
          <Icon name='skip-back' size={32} color={hasPrev ? '#0D9488' : '#CBD5E1'} />
          <Text className={`switch-label ${!hasPrev ? 'disabled' : ''}`}>上一课</Text>
        </View>
        <View
          className={`player-switch-btn ${!hasNext ? 'disabled' : ''}`}
          onClick={() => hasNext && handlePrevNext('next')}
        >
          <Text className={`switch-label ${!hasNext ? 'disabled' : ''}`}>下一课</Text>
          <Icon name='skip-forward' size={32} color={hasNext ? '#0D9488' : '#CBD5E1'} />
        </View>
      </View>

      {/* 课时列表切换 */}
      <View className='player-list-toggle' onClick={() => setShowList((prev) => !prev)}>
        <Icon name='list-video' size={32} color='#0D9488' />
        <Text className='list-toggle-text'>{showList ? '收起目录' : '展开目录'}</Text>
        <Icon
          name='chevron-right'
          size={24}
          color='#0D9488'
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
                        <Icon name='play' size={28} color='#0D9488' />
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
                {isActive && isPlaying && <Icon name='volume-2' size={28} color='#0D9488' />}
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
