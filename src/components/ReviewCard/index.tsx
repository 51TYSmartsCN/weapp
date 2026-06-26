import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import Avatar from '../Avatar'
import Icon from '../Icon'
import type { Review } from '../../types'
import './index.scss'

interface ReviewCardProps {
  review: Review
}

export default function ReviewCard({ review }: ReviewCardProps) {
  const [liked, setLiked] = useState(false)

  const handleLike = () => {
    setLiked((prev) => {
      const next = !prev
      Taro.showToast({ title: next ? '已点赞' : '取消点赞', icon: 'none' })
      return next
    })
  }

  return (
    <View className='review-card'>
      <View className='review-header'>
        <Avatar text={review.name[0]} size={64} bg='#99F6E4' color='#0F766E' />
        <View className='review-name'>{review.name}</View>
        <View className='review-stars'>
          {Array.from({ length: review.rating }).map((_, i) => (
            <Icon key={i} name='star' size={24} color='#F59E0B' />
          ))}
        </View>
      </View>
      <Text className='review-content'>{review.content}</Text>
      <View className='review-footer'>
        <Text className='review-date'>{review.date}</Text>
        <View className={`review-like ${liked ? 'liked' : ''}`} onClick={handleLike}>
          <Icon name='heart' size={24} color={liked ? '#EF4444' : '#94A3B8'} />
          <Text>{liked ? '有用' : '有用'}</Text>
        </View>
      </View>
    </View>
  )
}
