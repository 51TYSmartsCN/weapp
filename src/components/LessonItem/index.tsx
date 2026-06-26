import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import Icon from '../Icon'
import type { Lesson } from '../../types'
import './index.scss'

interface LessonItemProps {
  lesson: Lesson
  completed?: boolean
}

export default function LessonItem({ lesson, completed = false }: LessonItemProps) {
  const handleClick = () => {
    Taro.showToast({ title: `播放：${lesson.title}`, icon: 'none' })
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
