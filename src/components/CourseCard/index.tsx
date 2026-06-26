import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import Icon from '../Icon'
import type { Course } from '../../types'
import './index.scss'

interface CourseCardProps {
  course: Course
  mode?: 'grid' | 'list'
  icon?: string
  iconColor?: string
}

export default function CourseCard({ course, mode = 'grid', icon, iconColor }: CourseCardProps) {
  const handleClick = () => {
    Taro.navigateTo({ url: `/pages/course-detail/index?id=${course.id}` })
  }

  if (mode === 'list') {
    return (
      <View className='course-card course-card--list' onClick={handleClick}>
        <View
          className='course-cover'
          style={{ background: course.cover }}
        />
        <View className='course-info'>
          <View className='course-title ellipsis-2'>{course.title}</View>
          <View className='course-instructor-row'>
            <Text className='course-instructor'>{course.instructor}</Text>
            <Text className='course-price'>¥{course.price}</Text>
          </View>
          <View className='course-meta'>
            <View className='course-rating'>
              <Icon name='star' size={24} color='#F59E0B' />
              <Text className='rating-text'>{course.rating}</Text>
            </View>
            <View className='course-students'>
              <Icon name='users' size={24} color='#94A3B8' />
              <Text>{course.students}人</Text>
            </View>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View className='course-card course-card--grid' onClick={handleClick}>
      <View className='course-cover' style={{ background: course.cover }}>
        {icon && <Icon name={icon as any} size={56} color={iconColor || 'rgba(0,0,0,0.35)'} />}
      </View>
      <View className='course-info'>
        <View className='course-title ellipsis'>{course.title}</View>
        <View className='course-desc ellipsis'>{course.desc}</View>
        <View className='course-rating'>
          <Icon name='star' size={24} color='#F59E0B' />
          <Text className='rating-text'>{course.rating}分</Text>
        </View>
        <View className='course-footer'>
          <Text className='course-price'>¥{course.price}</Text>
          <View className='course-students'>
            <Icon name='users' size={22} color='#94A3B8' />
            <Text>{course.students}人已学</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
