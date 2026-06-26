import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import Avatar from '../Avatar'
import type { Instructor } from '../../types'
import './index.scss'

interface InstructorCardProps {
  instructor: Instructor
}

export default function InstructorCard({ instructor }: InstructorCardProps) {
  const handleClick = () => {
    Taro.showToast({ title: `${instructor.name} · ${instructor.title}`, icon: 'none' })
  }

  return (
    <View className='instructor-card' onClick={handleClick}>
      <Avatar text={instructor.name[0]} size={96} bg={instructor.color} />
      <Text className='instructor-name'>{instructor.name}</Text>
      <Text className='instructor-title'>{instructor.title}</Text>
      <Text className='instructor-service'>{instructor.service}</Text>
    </View>
  )
}
