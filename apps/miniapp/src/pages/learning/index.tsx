import { useEffect, useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import SafeTop from '../../components/SafeTop'
import Skeleton from '../../components/Skeleton'
import SectionHeader from '../../components/SectionHeader'
import Icon from '../../components/Icon'
import {
  getLearningSummary,
  getStudyRecords,
  getCertificates,
  getCourseById,
  showApiError,
} from '../../services'
import { UserCourseStatus } from '../../types'
import type { Course, LearningSummary, StudyRecord, Certificate } from '../../types'
import './index.scss'

type CourseTab = 'all' | 'learning' | 'purchased' | 'finished'

interface CourseTabItem {
  key: CourseTab
  label: string
}

const COURSE_TABS: CourseTabItem[] = [
  { key: 'all', label: '全部' },
  { key: 'learning', label: '学习中' },
  { key: 'purchased', label: '未开始' },
  { key: 'finished', label: '已完成' },
]

function formatDuration(seconds: number): string {
  return `${Math.round(seconds / 60)} 分钟`
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const diffDays = Math.floor((Date.now() - then) / (24 * 60 * 60 * 1000))
  if (diffDays <= 0) return '今天'
  if (diffDays === 1) return '昨天'
  if (diffDays < 7) return `${diffDays}天前`
  const d = new Date(iso)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${mm}-${dd}`
}

export default function Learning() {
  const [summary, setSummary] = useState<LearningSummary | null>(null)
  const [studyRecords, setStudyRecords] = useState<StudyRecord[]>([])
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [coursesMap, setCoursesMap] = useState<Record<number, Course>>({})
  const [loading, setLoading] = useState(true)
  const [courseTab, setCourseTab] = useState<CourseTab>('all')

  useEffect(() => {
    setLoading(true)
    Promise.all([getLearningSummary(), getStudyRecords(), getCertificates()])
      .then(([summaryData, studyRecordsData, certificatesData]) => {
        setSummary(summaryData)
        setStudyRecords(studyRecordsData)
        setCertificates(certificatesData)

        const courseIds = new Set<number>()
        summaryData.myCourses.forEach((uc) => courseIds.add(uc.courseId))
        if (summaryData.continueCourse) courseIds.add(summaryData.continueCourse.courseId)
        studyRecordsData.forEach((r) => courseIds.add(r.courseId))
        certificatesData.forEach((c) => courseIds.add(c.courseId))

        return Promise.all(
          Array.from(courseIds).map((id) =>
            getCourseById(id).then((course) => ({ id, course }))
          )
        ).then((entries) => {
          const map: Record<number, Course> = {}
          entries.forEach(({ id, course }) => {
            if (course) map[id] = course
          })
          setCoursesMap(map)
        })
      })
      .catch((err) => showApiError(err, '学习中心数据加载失败'))
      .finally(() => setLoading(false))
  }, [])

  const handleContinue = (courseId: number) => {
    Taro.navigateTo({ url: `/pages/lesson-player/index?courseId=${courseId}` })
  }

  const handleBrowseCourses = () => {
    Taro.switchTab({ url: '/pages/course-list/index' })
  }

  const handleCourseClick = (id: number) => {
    Taro.navigateTo({ url: `/pages/course-detail/index?id=${id}` })
  }

  const handleViewCertificates = () => {
    Taro.navigateTo({ url: '/pages/certificates/index' })
  }

  const filteredMyCourses = summary
    ? summary.myCourses.filter((uc) => {
        if (courseTab === 'all') return true
        if (courseTab === 'learning') return uc.status === UserCourseStatus.Learning
        if (courseTab === 'purchased') return uc.status === UserCourseStatus.Purchased
        if (courseTab === 'finished') return uc.status === UserCourseStatus.Finished
        return true
      })
    : []

  const recentStudyRecords = studyRecords.slice(0, 5)
  const continueCourse = summary?.continueCourse ?? null

  if (!summary && !loading) return null

  return (
    <ScrollView className='learning-page' scrollY>
      <SafeTop />

      <View className='learning-header'>
        <Text className='learning-title'>学习中心</Text>
      </View>

      {loading ? (
        <>
          <View className='learning-section'>
            <SectionHeader title='继续学习' />
            <View className='continue-card'>
              <Skeleton rows={2} title={false} />
            </View>
          </View>
          <View className='learning-section'>
            <SectionHeader title='我的课程' />
            <Skeleton rows={3} horizontal />
            <Skeleton rows={3} horizontal />
            <Skeleton rows={3} horizontal />
          </View>
          <View className='learning-section'>
            <SectionHeader title='学习记录' />
            <Skeleton rows={2} horizontal />
            <Skeleton rows={2} horizontal />
          </View>
        </>
      ) : (
        <>
          {/* 继续学习 */}
          <View className='learning-section'>
            <SectionHeader title='继续学习' />
            {!continueCourse ? (
              <View className='continue-empty'>
                <Text className='continue-empty-text'>还没有开始学习</Text>
                <View className='continue-empty-btn' onClick={handleBrowseCourses}>
                  去挑选课程
                </View>
              </View>
            ) : (
              <View className='continue-card'>
                <View className='continue-header'>
                  <View className='continue-course'>
                    <View className='continue-name'>{continueCourse.title}</View>
                    <View className='continue-progress'>
                      <View
                        className='continue-progress-bar'
                        style={{ width: `${continueCourse.progress}%` }}
                      />
                    </View>
                    <Text className='continue-meta'>
                      已完成 {continueCourse.completed}/{continueCourse.total} 节 · 上次学习：{continueCourse.lastStudy}
                    </Text>
                  </View>
                  <View
                    className='continue-btn'
                    onClick={() => handleContinue(continueCourse.courseId)}
                  >
                    继续学习
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* 我的课程 */}
          <View className='learning-section'>
            <SectionHeader title='我的课程' />
            <View className='status-tabs'>
              {COURSE_TABS.map((tab) => (
                <View
                  key={tab.key}
                  className={`status-tab ${courseTab === tab.key ? 'active' : ''}`}
                  onClick={() => setCourseTab(tab.key)}
                >
                  <Text>{tab.label}</Text>
                </View>
              ))}
            </View>
            {filteredMyCourses.length === 0 ? (
              <View className='empty-tip'>暂无课程</View>
            ) : (
              filteredMyCourses.map((uc) => {
                const course = coursesMap[uc.courseId]
                return (
                  <View
                    key={uc.id}
                    className='course-item'
                    onClick={() => handleCourseClick(uc.courseId)}
                  >
                    <View
                      className='course-cover-small'
                      style={(() => {
                        const cover = course?.cover
                        if (!cover) return undefined
                        // http 开头视为图片 URL，否则视为 CSS 渐变背景
                        if (/^https?:\/\//i.test(cover)) {
                          return { backgroundImage: `url(${cover})` }
                        }
                        return { background: cover }
                      })()}
                    />
                    <View className='course-item-info'>
                      <View className='course-item-title'>{course?.title ?? '加载中...'}</View>
                      <Text className='course-item-progress'>已学习 {uc.progress}%</Text>
                    </View>
                  </View>
                )
              })
            )}
          </View>

          {/* 学习记录 */}
          <View className='learning-section'>
            <SectionHeader title='学习记录' />
            {recentStudyRecords.length === 0 ? (
              <View className='empty-tip'>暂无学习记录</View>
            ) : (
              recentStudyRecords.map((record) => {
                const course = coursesMap[record.courseId]
                return (
                  <View key={record.id} className='study-record-item'>
                    <View className='study-record-info'>
                      <View className='study-record-title'>
                        {course?.title ?? '加载中...'}
                      </View>
                      <Text className='study-record-meta'>
                        第 {record.lessonId} 节 · {formatDuration(record.duration)} · {formatRelative(record.studiedAt)}
                      </Text>
                    </View>
                  </View>
                )
              })
            )}
          </View>

          {/* 学习证书 */}
          <View className='learning-section'>
            <SectionHeader title='学习证书' />
            {certificates.length === 0 ? (
              <View className='empty-tip'>暂无证书</View>
            ) : (
              <View className='certificate-card' onClick={handleViewCertificates}>
                <View className='certificate-icon'>
                  <Icon name='award' size={44} color='var(--theme-primary, #0D9488)' />
                </View>
                <View className='certificate-info'>
                  <View className='certificate-title'>我的证书</View>
                  <Text className='certificate-count'>
                    已获得 {certificates.length} 张证书
                  </Text>
                </View>
                <View className='certificate-link'>
                  <Text>查看全部</Text>
                  <Icon name='chevron-right' size={28} color='#94A3B8' />
                </View>
              </View>
            )}
          </View>
        </>
      )}
    </ScrollView>
  )
}
