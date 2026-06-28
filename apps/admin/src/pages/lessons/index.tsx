import { useState, useEffect, useCallback } from 'react'
import {
  Button,
  Select,
  Table,
  Modal,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Space,
  message,
} from 'antd'
import {
  PlusOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { lessonApi, courseApi } from '../../api'

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
  const [selectedCourseId, setSelectedCourseId] = useState<number | undefined>()
  const [lessons, setLessons] = useState<LessonItem[]>([])
  const [loading, setLoading] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<LessonItem | null>(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [form] = Form.useForm<FormValues>()

  // 加载课程列表
  useEffect(() => {
    courseApi.getList({ page: 1, size: 999 }).then((res) => {
      setCourses(res.list)
    })
  }, [])

  // 加载课时列表
  const loadLessons = useCallback(async () => {
    if (!selectedCourseId) {
      setLessons([])
      return
    }
    setLoading(true)
    try {
      const data = await lessonApi.getList(selectedCourseId)
      setLessons(data)
    } finally {
      setLoading(false)
    }
  }, [selectedCourseId])

  useEffect(() => {
    loadLessons()
  }, [loadLessons])

  // ---- 排序 ----
  const moveRow = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= lessons.length) return

    const newList = [...lessons]
    const a = newList[index]
    const b = newList[targetIndex]
    // 交换 sort 值
    const tempSort = a.sort
    newList[index] = { ...a, sort: b.sort }
    newList[targetIndex] = { ...b, sort: tempSort }
    setLessons(newList)

    await lessonApi.reorder(newList.map((item) => ({ id: item.id, sort: item.sort })))
    message.success('排序已更新')
  }

  // ---- 新增 / 编辑 ----
  const openCreateModal = () => {
    setEditingItem(null)
    form.resetFields()
    // 默认 sort 为当前列表最大值 +1
    const maxSort = lessons.length > 0 ? Math.max(...lessons.map((l) => l.sort)) + 1 : 1
    form.setFieldsValue({ sort: maxSort })
    setModalOpen(true)
  }

  const openEditModal = (record: LessonItem) => {
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
      if (editingItem) {
        await lessonApi.update(editingItem.id, values)
        message.success('课时已更新')
      } else {
        await lessonApi.create({
          ...values,
          courseId: selectedCourseId,
        })
        message.success('课时已创建')
      }
      setModalOpen(false)
      loadLessons()
    } finally {
      setModalLoading(false)
    }
  }

  // ---- 删除 ----
  const handleDelete = async (id: number) => {
    await lessonApi.remove(id)
    message.success('课时已删除')
    loadLessons()
  }

  // ---- 列定义 ----
  const columns: ColumnsType<LessonItem> = [
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
            onClick={() => moveRow(index, 'up')}
          />
          <Button
            type="text"
            size="small"
            icon={<ArrowDownOutlined />}
            disabled={index === lessons.length - 1}
            onClick={() => moveRow(index, 'down')}
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
            onConfirm={() => handleDelete(record.id)}
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

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <Select
          placeholder="请选择课程"
          value={selectedCourseId}
          onChange={(val) => setSelectedCourseId(val)}
          options={courses.map((c) => ({ label: c.title, value: c.id }))}
          style={{ width: 280 }}
          allowClear
          onClear={() => setSelectedCourseId(undefined)}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          disabled={!selectedCourseId}
          onClick={openCreateModal}
        >
          新增课时
        </Button>
      </div>

      <Table<LessonItem>
        rowKey="id"
        columns={columns}
        dataSource={lessons}
        loading={loading}
        pagination={false}
        size="middle"
        locale={{ emptyText: selectedCourseId ? '暂无课时数据' : '请先选择课程' }}
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
          <Form.Item name="videoUrl" label="视频地址">
            <Input placeholder="请输入视频地址" />
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
