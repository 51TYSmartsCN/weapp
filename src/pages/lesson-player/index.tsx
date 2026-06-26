import { useEffect, useState, useCallback, useRef } from 'react'
import { View, Text, Video, Slider, ScrollView } from '@tarojs/components'
import { useRouter } from '@tarojs/taro'
import Taro, { createVideoContext } from '@tarojs/taro'
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

  // 视频播放状态
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showList, setShowList] = useState(true)

  const videoId = useRef('lessonVideo')

  const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2]

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

  const formatTime = useCallback((seconds: number) => {
    if (!seconds || isNaN(seconds)) return '00:00'
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }, [])

  const getVideoContext = useCallback(() => {
    return createVideoContext(videoId.current)
  }, [])

  // Video 事件回调
  const handlePlay = () => {
    setIsPlaying(true)
  }

  const handlePause = () => {
    setIsPlaying(false)
  }

  const handleTimeUpdate = (e) => {
    setCurrentTime(Number(e.detail.currentTime))
  }

  const handleLoadedMetaData = (e) => {
    setDuration(Number(e.detail.duration))
  }

  const handleEnded = () => {
    setIsPlaying(false)
    const ctx = getVideoContext()
    ctx.pause()
  }

  // 用户控制操作
  const handlePlayPause = () => {
    const ctx = getVideoContext()
    if (isPlaying) {
      ctx.pause()
      setIsPlaying(false)
    } else {
      ctx.play()
      setIsPlaying(true)
    }
  }

  // Slider onChanging — 拖动过程中，仅更新 UI 但不 seek
  const handleSeekChanging = (e) => {
    setCurrentTime(Number(e.detail.value) / 100)
  }

  // Slider onChange — 松手后执行 seek
  const handleSeek = (e) => {
    const seekTime = Number(e.detail.value) / 100
    const ctx = getVideoContext()
    ctx.seek(seekTime)
    setCurrentTime(seekTime)
  }

  const handleRewind = () => {
    const ctx = getVideoContext()
    ctx.seek(0)
    setCurrentTime(0)
  }

  const handleRateChange = () => {
    const currentIdx = playbackRates.indexOf(playbackRate)
    const nextIdx = (currentIdx + 1) % playbackRates.length
    const newRate = playbackRates[nextIdx]
    setPlaybackRate(newRate)
    const ctx = getVideoContext()
    ctx.playbackRate(newRate)
    Taro.showToast({
      title: `${newRate}x`,
      icon: 'none',
    })
  }

  const handleLessonChange = (lesson: Lesson) => {
    setCurrentLesson(lesson)
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    setPlaybackRate(1)
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

      {/* 视频播放区域 */}
      <View className='player-video-area'>
        <Video
          id={videoId.current}
          className='player-video'
          src={videoSrc}
          controls={false}
          autoplay={false}
          loop={false}
          muted={false}
          showFullscreenBtn={false}
          showPlayBtn={false}
          showCenterPlayBtn={false}
          enableProgressGesture={false}
          objectFit='contain'
          poster=''
          onPlay={handlePlay}
          onPause={handlePause}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onLoadedMetaData={handleLoadedMetaData}
        />

        {/* 视频区域中央播放/暂停按钮 */}
        {!isPlaying && (
          <View className='player-center-play' onClick={handlePlayPause}>
            <Icon name='play' size={100} color='#FFFFFF' />
          </View>
        )}
      </View>

      {/* 课时信息 */}
      <View className='player-info'>
        <Text className='player-lesson-title'>{currentLesson?.title}</Text>
        <Text className='player-lesson-course'>
          {course?.title} · 第 {currentLessonIndex + 1}/{lessons.length} 节
        </Text>
      </View>

      {/* 进度条 */}
      <View className='player-progress-section'>
        <Slider
          className='player-slider'
          min={0}
          max={duration > 0 ? duration * 100 : 100}
          value={currentTime * 100}
          step={1}
          activeColor='#0D9488'
          backgroundColor='#E2E8F0'
          blockSize={24}
          onChange={handleSeek}
          onChanging={handleSeekChanging}
        />
        <View className='player-time-row'>
          <Text className='player-time-current'>{formatTime(currentTime)}</Text>
          <Text className='player-time-total'>{formatTime(duration)}</Text>
        </View>
      </View>

      {/* 播放控制栏 */}
      <View className='player-controls'>
        <View className='player-ctrl-btn' onClick={handleRewind}>
          <Icon name='rotate-ccw' size={44} color='#475569' />
          <Text className='ctrl-label'>重播</Text>
        </View>
        <View className='player-ctrl-btn' onClick={() => handlePrevNext('prev')}>
          <Icon name='skip-back' size={48} color={hasPrev ? '#0F172A' : '#CBD5E1'} />
          <Text className='ctrl-label'>上一课</Text>
        </View>
        <View className='player-ctrl-main' onClick={handlePlayPause}>
          <Icon name={isPlaying ? 'pause' : 'play'} size={72} color='#FFFFFF' />
        </View>
        <View className='player-ctrl-btn' onClick={() => handlePrevNext('next')}>
          <Icon name='skip-forward' size={48} color={hasNext ? '#0F172A' : '#CBD5E1'} />
          <Text className='ctrl-label'>下一课</Text>
        </View>
        <View className='player-ctrl-btn' onClick={handleRateChange}>
          <Text className='ctrl-rate'>{playbackRate}x</Text>
          <Text className='ctrl-label'>倍速</Text>
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
