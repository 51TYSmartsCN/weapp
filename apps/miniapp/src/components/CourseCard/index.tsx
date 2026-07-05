import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import Icon from '../Icon'
import { resolveUrl } from '../../services'
import type { Course } from '../../types'
import './index.scss'

interface CourseCardProps {
  course: Course
  mode?: 'grid' | 'list'
  icon?: string
  iconColor?: string
}

/** 判断 cover 是否为图片 URL（http 开头），否则视为 CSS 渐变背景 */
function isImageCover(cover: string): boolean {
  return /^https?:\/\//i.test(cover) || cover.startsWith('/')
}

function resolveCourseCover(cover: string): string {
  if (!cover) return ''
  if (cover.startsWith('/')) return resolveUrl(cover)
  return cover
}

export default function CourseCard({ course, mode = 'grid', icon, iconColor }: CourseCardProps) {
  const handleClick = () => {
    Taro.navigateTo({ url: `/pages/course-detail/index?id=${course.id}` })
  }

  const renderCover = (withIcon: boolean) => {
    const isImg = isImageCover(course.cover)
    const coverSrc = resolveCourseCover(course.cover)
    return (
      <View
        className='course-cover'
        style={isImg ? undefined : { background: course.cover }}
      >
        {isImg ? (
          <Image className='course-cover-img' src={coverSrc} mode='aspectFill' />
        ) : null}
        {/* 仅在非图片（渐变背景）时叠加 icon，图片本身即为视觉主体 */}
        {withIcon && icon && !isImg ? (
          <Icon name={icon as any} size={56} color={iconColor || 'rgba(0,0,0,0.35)'} />
        ) : null}
      </View>
    )
  }

  if (mode === 'list') {
    return (
      <View className='course-card course-card--list' onClick={handleClick}>
        {renderCover(false)}
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
      {renderCover(true)}
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
