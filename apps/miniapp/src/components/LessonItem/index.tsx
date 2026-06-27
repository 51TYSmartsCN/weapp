import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import Icon from '../Icon'
import type { Lesson } from '../../types'
import './index.scss'

interface LessonItemProps {
  lesson: Lesson
  completed?: boolean
  courseId?: number
}

export default function LessonItem({ lesson, completed = false, courseId }: LessonItemProps) {
  const handleClick = () => {
    const params: Record<string, string | number> = { lessonId: lesson.id }
    if (courseId) params.courseId = courseId
    const query = Object.entries(params).map(([k, v]) => `${k}=${v}`).join('&')
    Taro.navigateTo({ url: `/pages/lesson-player/index?${query}` })
  }

  return (
    <View className={`lesson-item ${completed ? 'completed' : ''}`} onClick={handleClick}>
      <View className='lesson-main'>
        <Icon name='play-circle' size={40} color={completed ? '#94A3B8' : '#0D9488'} />
        <View className='lesson-title ellipsis'>{lesson.title}</View>
      </View>
      <View className='lesson-duration'>
        <Icon name='clock' size={24} color='#94A3B8' />
        <Text>{lesson.duration}</Text>
      </View>
    </View>
  )
}
