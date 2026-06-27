import { useEffect, useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import NavBar from '../../components/NavBar'
import Skeleton from '../../components/Skeleton'
import Icon from '../../components/Icon'
import { getCertificates, getCourseById, showApiError } from '../../services'
import type { Certificate, Course } from '../../types'
import './index.scss'

function formatDate(iso: string): string {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function Certificates() {
  const [certs, setCerts] = useState<Certificate[]>([])
  const [courseMap, setCourseMap] = useState<Record<number, Course>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getCertificates()
      .then(async (list) => {
        const ids = Array.from(new Set(list.map((c) => c.courseId)))
        const courses = await Promise.all(ids.map((id) => getCourseById(id)))
        const map: Record<number, Course> = {}
        courses.forEach((c) => {
          if (c) map[c.id] = c
        })
        setCourseMap(map)
        setCerts(list)
      })
      .catch((err) => showApiError(err, '证书列表加载失败'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <View className='certificates-page'>
      <NavBar title='学习证书' />
      <ScrollView className='certificates-body' scrollY>
        {loading ? (
          <>
            <Skeleton rows={2} horizontal avatar />
            <Skeleton rows={2} horizontal avatar />
          </>
        ) : certs.length === 0 ? (
          <View className='certificates-empty'>
            <Icon name='award' size={96} color='#94A3B8' />
            <Text className='certificates-empty-text'>暂无学习证书</Text>
          </View>
        ) : (
          <View className='certificates-list'>
            {certs.map((cert) => {
              const course = courseMap[cert.courseId]
              return (
                <View key={cert.id} className='certificate-card'>
                  <View className='certificate-head'>
                    <Icon name='award' size={48} color='#F59E0B' />
                    <Text className='certificate-no'>{cert.certificateNo}</Text>
                  </View>
                  <Text className='certificate-course ellipsis'>
                    {course ? course.title : '未知课程'}
                  </Text>
                  <View className='certificate-foot'>
                    <Text className='certificate-label'>颁发日期</Text>
                    <Text className='certificate-date'>{formatDate(cert.issuedAt)}</Text>
                  </View>
                </View>
              )
            })}
          </View>
        )}
        <View className='safe-bottom' />
      </ScrollView>
    </View>
  )
}
