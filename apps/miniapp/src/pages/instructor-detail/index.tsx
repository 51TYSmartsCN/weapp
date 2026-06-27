import { useEffect, useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import NavBar from '../../components/NavBar'
import Avatar from '../../components/Avatar'
import Skeleton from '../../components/Skeleton'
import Icon from '../../components/Icon'
import { getInstructorById, showApiError } from '../../services'
import type { Instructor } from '../../types'
import './index.scss'

export default function InstructorDetail() {
  const router = useRouter()
  const [instructor, setInstructor] = useState<Instructor | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const id = Number(router.params.id)
    if (!id) {
      Taro.showToast({ title: '参数错误', icon: 'none' })
      return
    }
    setLoading(true)
    getInstructorById(id)
      .then((data) => setInstructor(data ?? null))
      .catch((err) => showApiError(err, '讲师信息加载失败'))
      .finally(() => setLoading(false))
  }, [router.params.id])

  return (
    <View className='instructor-detail-page'>
      <NavBar title='讲师介绍' />
      <ScrollView className='instructor-detail-body' scrollY>
        {loading ? (
          <Skeleton rows={6} avatar />
        ) : instructor ? (
          <>
            {/* 头部：头像 + 姓名 + 头衔 */}
            <View className='instructor-header'>
              <Avatar text={instructor.name[0]} size={140} bg={instructor.color} />
              <View className='instructor-head-info'>
                <Text className='instructor-name'>{instructor.name}</Text>
                <Text className='instructor-title'>{instructor.title}</Text>
                <Text className='instructor-service'>{instructor.service}</Text>
              </View>
            </View>

            {/* 数据统计 */}
            <View className='instructor-stats'>
              <View className='stat-item'>
                <Text className='stat-value'>{instructor.years ?? '-'}年</Text>
                <Text className='stat-label'>从业经验</Text>
              </View>
              <View className='stat-divider' />
              <View className='stat-item'>
                <Text className='stat-value'>{instructor.studentCount ?? '-'}</Text>
                <Text className='stat-label'>累计学员</Text>
              </View>
              <View className='stat-divider' />
              <View className='stat-item'>
                <Text className='stat-value'>{instructor.courseCount ?? '-'}</Text>
                <Text className='stat-label'>主讲课程</Text>
              </View>
            </View>

            {/* 个人简介 */}
            {instructor.bio ? (
              <View className='instructor-section'>
                <View className='section-title-row'>
                  <Icon name='book-open' size={26} color={instructor.color} />
                  <Text className='section-title'>个人简介</Text>
                </View>
                <Text className='section-content'>{instructor.bio}</Text>
              </View>
            ) : null}

            {/* 专长领域 */}
            {instructor.expertise && instructor.expertise.length > 0 ? (
              <View className='instructor-section'>
                <View className='section-title-row'>
                  <Icon name='star' size={26} color={instructor.color} />
                  <Text className='section-title'>专长领域</Text>
                </View>
                <View className='expertise-tags'>
                  {instructor.expertise.map((tag) => (
                    <View
                      key={tag}
                      className='expertise-tag'
                      style={{ color: instructor.color, borderColor: instructor.color }}
                    >
                      <Text>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {/* 个人成就 */}
            {instructor.achievements && instructor.achievements.length > 0 ? (
              <View className='instructor-section'>
                <View className='section-title-row'>
                  <Icon name='award' size={26} color={instructor.color} />
                  <Text className='section-title'>个人成就</Text>
                </View>
                <View className='achievement-list'>
                  {instructor.achievements.map((ach, idx) => (
                    <View key={idx} className='achievement-item'>
                      <Icon name='check-circle' size={22} color={instructor.color} />
                      <Text className='achievement-text'>{ach}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            <View className='safe-bottom' />
          </>
        ) : (
          <View className='empty-state'>
            <Text className='empty-text'>讲师不存在</Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}
