import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import Avatar from '../Avatar'
import { resolveColor } from '../../services'
import type { Instructor } from '../../types'
import './index.scss'

interface InstructorCardProps {
  instructor: Instructor
  /** 点击回调，不传则默认 toast 提示 */
  onClick?: (instructor: Instructor) => void
}

export default function InstructorCard({ instructor, onClick }: InstructorCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick(instructor)
    } else {
      Taro.showToast({ title: `${instructor.name} · ${instructor.title}`, icon: 'none' })
    }
  }

  const bgColor = resolveColor(instructor.color)

  return (
    <View
      className='instructor-card'
      onClick={handleClick}
      style={{ '--instructor-color': bgColor } as React.CSSProperties}
    >
      <Avatar text={instructor.name[0]} size={96} bg={bgColor} src={instructor.avatar} />
      <Text className='instructor-name'>{instructor.name}</Text>
      <Text className='instructor-title'>{instructor.title}</Text>
      <Text className='instructor-service'>{instructor.service}</Text>
    </View>
  )
}
