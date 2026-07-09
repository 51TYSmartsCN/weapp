import { useState, useEffect, useCallback } from 'react'
import {
  Button,
  Table,
  Modal,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Space,
  message,
  Upload,
} from 'antd'
import {
  PlusOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { lessonApi, courseApi } from '../../api'

const LESSON_VIDEO_MAX_SIZE_MB = 200
const LESSON_VIDEO_ACCEPT = 'video/mp4,video/quicktime,video/x-m4v,.mp4,.mov,.m4v'
const LESSON_VIDEO_EXTENSIONS = ['.mp4', '.mov', '.m4v']
const LESSON_VIDEO_MIME_TYPES = ['video/mp4', 'video/quicktime', 'video/x-m4v']

function isAllowedLessonVideo(file: File) {
  const lowerName = file.name.toLowerCase()
  const hasAllowedExt = LESSON_VIDEO_EXTENSIONS.some((ext) => lowerName.endsWith(ext))
  return hasAllowedExt && LESSON_VIDEO_MIME_TYPES.includes(file.type)
}

interface LessonItem {
  id: number
  courseId: number
  title: string
  duration: string
  durationSeconds?: number
  videoUrl?: string
  content?: string
  sort: number
  createdAt: string
}

interface CourseItem {
  id: number
  title: string
}

interface FormValues {
  title: string
  duration: string
  durationSeconds?: number
  videoUrl?: string
  content?: string
  sort: number
}

export default function Lessons() {
  const [courses, setCourses] = useState<CourseItem[]>([])
  const [activeCourseId, setActiveCourseId] = useState<number | undefined>()
  const [lessonsByCourseId, setLessonsByCourseId] = useState<Record<number, LessonItem[]>>({})
  const [loadingCourseIds, setLoadingCourseIds] = useState<Record<number, boolean>>({})

  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<LessonItem | null>(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [form] = Form.useForm<FormValues>()

  // 加载课程列表
  useEffect(() => {
    courseApi.getList({ page: 1, size: 999 }).then((res) => {
      setCourses(res.list)
      if (res.list.length > 0) {
        setActiveCourseId((prev) => prev ?? res.list[0].id)
      }
    })
  }, [])

  const loadLessons = useCallback(async (courseId: number) => {
    setLoadingCourseIds((prev) => ({ ...prev, [courseId]: true }))
    try {
      const data = await lessonApi.getList(courseId)
      setLessonsByCourseId((prev) => ({ ...prev, [courseId]: data }))
    } finally {
      setLoadingCourseIds((prev) => ({ ...prev, [courseId]: false }))
    }
  }, [])

  useEffect(() => {
    if (!activeCourseId) return
    if (lessonsByCourseId[activeCourseId]) return
    loadLessons(activeCourseId)
  }, [activeCourseId, lessonsByCourseId, loadLessons])

  // ---- 排序 ----
  const moveRow = async (courseId: number, index: number, direction: 'up' | 'down') => {
    const lessons = lessonsByCourseId[courseId] || []
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= lessons.length) return

    const newList = [...lessons]
    const a = newList[index]
    const b = newList[targetIndex]
    // 交换 sort 值
    const tempSort = a.sort
    newList[index] = { ...a, sort: b.sort }
    newList[targetIndex] = { ...b, sort: tempSort }
    setLessonsByCourseId((prev) => ({ ...prev, [courseId]: newList }))

    await lessonApi.reorder(newList.map((item) => ({ id: item.id, sort: item.sort })))
    message.success('排序已更新')
  }

  // ---- 新增 / 编辑 ----
  const openCreateModal = (courseId: number) => {
    setActiveCourseId(courseId)
    setEditingItem(null)
    form.resetFields()
    // 默认 sort 为当前列表最大值 +1
    const lessons = lessonsByCourseId[courseId] || []
    const maxSort = lessons.length > 0 ? Math.max(...lessons.map((l) => l.sort)) + 1 : 1
    form.setFieldsValue({ sort: maxSort })
    setModalOpen(true)
  }

  const openEditModal = (record: LessonItem) => {
    setActiveCourseId(record.courseId)
    setEditingItem(record)
    form.setFieldsValue({
      title: record.title,
      duration: record.duration,
      durationSeconds: record.durationSeconds,
      videoUrl: record.videoUrl,
      content: record.content,
      sort: record.sort,
    })
    setModalOpen(true)
  }

  const handleModalOk = async () => {
    const values = await form.validateFields()
    setModalLoading(true)
    try {
      const courseId = activeCourseId ?? editingItem?.courseId
      if (editingItem) {
        await lessonApi.update(editingItem.id, {
          ...values,
          courseId,
        })
        message.success('课时已更新')
      } else {
        await lessonApi.create({
          ...values,
          courseId,
        })
        message.success('课时已创建')
      }
      setModalOpen(false)
      if (courseId) {
        await loadLessons(courseId)
      }
    } finally {
      setModalLoading(false)
    }
  }

  // ---- 删除 ----
  const handleDelete = async (courseId: number, id: number) => {
    await lessonApi.remove(id)
    message.success('课时已删除')
    await loadLessons(courseId)
  }

  // ---- 列定义 ----
  const columns = (courseId: number): ColumnsType<LessonItem> => [
    {
      title: '排序',
      dataIndex: 'sort',
      width: 100,
      align: 'center',
      render: (_: number, __: LessonItem, index: number) => (
        <Space size={4}>
          <Button
            type="text"
            size="small"
            icon={<ArrowUpOutlined />}
            disabled={index === 0}
            onClick={() => moveRow(courseId, index, 'up')}
          />
          <Button
            type="text"
            size="small"
            icon={<ArrowDownOutlined />}
            disabled={index === (lessonsByCourseId[courseId] || []).length - 1}
            onClick={() => moveRow(courseId, index, 'down')}
          />
        </Space>
      ),
    },
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
    },
    {
      title: '课时标题',
      dataIndex: 'title',
      ellipsis: true,
    },
    {
      title: '时长',
      dataIndex: 'duration',
      width: 120,
    },
    {
      title: '时长(秒)',
      dataIndex: 'durationSeconds',
      width: 110,
      render: (val?: number) => (val != null ? val : '-'),
    },
    {
      title: '视频地址',
      dataIndex: 'videoUrl',
      width: 200,
      ellipsis: true,
      render: (url?: string) => url || '-',
    },
    {
      title: '操作',
      width: 160,
      render: (_: unknown, record: LessonItem) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除该课时吗？"
            onConfirm={() => handleDelete(courseId, record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const courseColumns: ColumnsType<CourseItem> = [
    {
      title: '课程 ID',
      dataIndex: 'id',
      width: 100,
    },
    {
      title: '课程名称',
      dataIndex: 'title',
    },
    {
      title: '操作',
      width: 140,
      render: (_: unknown, record: CourseItem) => (
        <Button type="link" size="small" icon={<PlusOutlined />} onClick={() => openCreateModal(record.id)}>
          新增课时
        </Button>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, color: '#64748b', fontSize: 14 }}>
        课程列表支持展开查看和管理课时，页面默认展开第一门课程。
      </div>
      <Table<CourseItem>
        rowKey="id"
        columns={courseColumns}
        dataSource={courses}
        pagination={false}
        size="middle"
        expandable={{
          expandRowByClick: true,
          expandedRowKeys: activeCourseId ? [activeCourseId] : [],
          onExpand: (expanded, record) => {
            const nextCourseId = expanded ? record.id : undefined
            setActiveCourseId(nextCourseId)
            if (expanded) {
              loadLessons(record.id)
            }
          },
          expandedRowRender: (record) => {
            const lessons = lessonsByCourseId[record.id] || []
            const loading = !!loadingCourseIds[record.id]
            return (
              <div style={{ padding: '4px 0 8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ color: '#64748b', fontSize: 13 }}>
                    当前课程课时数：{lessons.length}
                  </div>
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => openCreateModal(record.id)}>
                    为当前课程新增课时
                  </Button>
                </div>
                <Table<LessonItem>
                  rowKey="id"
                  columns={columns(record.id)}
                  dataSource={lessons}
                  loading={loading}
                  pagination={false}
                  size="middle"
                  locale={{ emptyText: '暂无课时数据' }}
                />
              </div>
            )
          },
        }}
        locale={{ emptyText: '暂无课程数据' }}
      />

      <Modal
        title={editingItem ? '编辑课时' : '新增课时'}
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={() => setModalOpen(false)}
        confirmLoading={modalLoading}
        okText="确定"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={form} layout="vertical" autoComplete="off">
          <Form.Item name="title" label="课时标题" rules={[{ required: true, message: '请输入课时标题' }]}>
            <Input placeholder="请输入课时标题" />
          </Form.Item>
          <Form.Item name="duration" label="时长" rules={[{ required: true, message: '请输入时长' }]}>
            <Input placeholder="例如: 15min" />
          </Form.Item>
          <Form.Item name="durationSeconds" label="时长(秒)">
            <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入秒数" />
          </Form.Item>
          <Form.Item label="课时视频">
            <Space direction="vertical" style={{ width: '100%' }} size={12}>
              <Upload
                accept={LESSON_VIDEO_ACCEPT}
                showUploadList={false}
                beforeUpload={(file) => {
                  if (!isAllowedLessonVideo(file)) {
                    message.error('仅支持 MP4/MOV/M4V 格式')
                    return Upload.LIST_IGNORE
                  }

                  const isAllowedSize = file.size / 1024 / 1024 <= LESSON_VIDEO_MAX_SIZE_MB
                  if (!isAllowedSize) {
                    message.error(`视频大小不能超过 ${LESSON_VIDEO_MAX_SIZE_MB}MB`)
                    return Upload.LIST_IGNORE
                  }

                  return true
                }}
                customRequest={async (options) => {
                  const { file, onSuccess, onError } = options
                  setUploadingVideo(true)
                  try {
                    const { url } = await lessonApi.uploadVideo(file as File)
                    form.setFieldValue('videoUrl', url)
                    message.success('视频上传成功，请点击确定保存课时')
                    onSuccess?.({ url })
                  } catch (err) {
                    message.error(err instanceof Error ? err.message : '视频上传失败')
                    onError?.(err as Error)
                  } finally {
                    setUploadingVideo(false)
                  }
                }}
              >
                <Button icon={<UploadOutlined />} loading={uploadingVideo}>
                  上传视频文件
                </Button>
              </Upload>
              <Form.Item name="videoUrl" style={{ marginBottom: 0 }}>
                <Input placeholder="仅支持 MP4/MOV/M4V，最大 200MB；上传后会自动回填，也可手动输入视频地址" />
              </Form.Item>
            </Space>
          </Form.Item>
          <Form.Item name="content" label="图文教程内容" tooltip="当模块展示模式为「图文」时，小程序课时播放页会展示此内容。支持换行。">
            <Input.TextArea
              rows={6}
              placeholder="请输入图文教程内容（模块展示模式切换为「图文」时使用）"
              showCount
            />
          </Form.Item>
          <Form.Item name="sort" label="排序">
            <InputNumber min={1} style={{ width: '100%' }} placeholder="请输入排序值" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
