import { useEffect, useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import NavBar from '../../components/NavBar'
import Skeleton from '../../components/Skeleton'
import Icon from '../../components/Icon'
import { getStudyRecords, getCourseById, showApiError } from '../../services'
import type { Course, StudyRecord } from '../../types'
import './index.scss'

function formatDate(iso: string): string {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function StudyRecords() {
  const [records, setRecords] = useState<StudyRecord[]>([])
  const [courseMap, setCourseMap] = useState<Record<number, Course>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getStudyRecords()
      .then(async (list) => {
        const ids = Array.from(new Set(list.map((r) => r.courseId)))
        const courses = await Promise.all(ids.map((id) => getCourseById(id)))
        const map: Record<number, Course> = {}
        courses.forEach((c) => {
          if (c) map[c.id] = c
        })
        setCourseMap(map)
        setRecords(list)
      })
      .catch((err) => showApiError(err, '学习记录加载失败'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <View className='study-records-page'>
      <NavBar title='学习记录' />
      <ScrollView className='study-records-body' scrollY>
        {loading ? (
          <>
            <Skeleton rows={2} horizontal avatar />
            <Skeleton rows={2} horizontal avatar />
            <Skeleton rows={2} horizontal avatar />
          </>
        ) : records.length === 0 ? (
          <View className='study-records-empty'>
            <Icon name='clock' size={96} color='#94A3B8' />
            <Text className='study-records-empty-text'>暂无学习记录</Text>
          </View>
        ) : (
          <View className='study-records-list'>
            {records.map((r) => {
              const course = courseMap[r.courseId]
              return (
                <View key={r.id} className='record-item'>
                  <View className='record-icon'>
                    <Icon name='play-circle' size={40} color={course ? '#0D9488' : '#94A3B8'} />
                  </View>
                  <View className='record-info'>
                    <Text className='record-course ellipsis'>
                      {course ? course.title : '未知课程'}
                    </Text>
                    <View className='record-meta'>
                      <Text className='record-lesson'>第 {r.lessonId} 节</Text>
                      <View className='record-duration'>
                        <Icon name='clock' size={22} color='#94A3B8' />
                        <Text className='record-duration-text'>
                          {Math.round(r.duration / 60)} 分钟
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Text className='record-date'>{formatDate(r.studiedAt)}</Text>
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
