import { useEffect, useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import NavBar from '../../components/NavBar'
import Avatar from '../../components/Avatar'
import Skeleton from '../../components/Skeleton'
import Icon from '../../components/Icon'
import { getInstructors, showApiError } from '../../services'
import type { Instructor } from '../../types'
import './index.scss'

export default function InstructorList() {
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getInstructors()
      .then(setInstructors)
      .catch((err) => showApiError(err, '讲师列表加载失败'))
      .finally(() => setLoading(false))
  }, [])

  const goDetail = (id: number) => {
    Taro.navigateTo({ url: `/pages/instructor-detail/index?id=${id}` })
  }

  return (
    <View className='instructor-list-page'>
      <NavBar title='明星讲师' />
      <ScrollView className='instructor-list-body' scrollY>
        {loading ? (
          <>
            <Skeleton rows={2} horizontal avatar />
            <Skeleton rows={2} horizontal avatar />
            <Skeleton rows={2} horizontal avatar />
          </>
        ) : (
          <>
            {/* 页面介绍 */}
            <View className='page-intro'>
              <Text className='page-intro-title'>明星讲师</Text>
              <Text className='page-intro-desc'>
                汇集 GEO 与 AI 内容营销领域资深实战派专家，点击查看完整介绍。
              </Text>
            </View>

            {/* 讲师简略列表 */}
            <View className='instructor-list'>
              {instructors.map((item) => (
                <View
                  key={item.id}
                  className='instructor-item'
                  onClick={() => goDetail(item.id)}
                >
                  <Avatar text={item.name[0]} size={100} bg={item.color} src={item.avatar} />
                  <View className='instructor-info'>
                    <View className='instructor-name-row'>
                      <Text className='instructor-name'>{item.name}</Text>
                      <Text className='instructor-title'>{item.title}</Text>
                    </View>
                    <Text className='instructor-service'>{item.service}</Text>
                    {item.bio ? (
                      <Text className='instructor-bio ellipsis'>{item.bio}</Text>
                    ) : null}
                  </View>
                  <Icon name='arrow-right' size={32} color='#94A3B8' />
                </View>
              ))}
            </View>
            <View className='safe-bottom' />
          </>
        )}
      </ScrollView>
    </View>
  )
}
