import { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Space,
  Spin,
  message,
  ColorPicker,
  Upload,
  Avatar as AntAvatar,
} from 'antd'
import { PlusOutlined, UploadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { instructorApi } from '../../api'

interface InstructorItem {
  id: number
  name: string
  title: string
  service: string
  bio?: string
  color: string
  avatar?: string
  expertise?: string
  years?: number
  studentCount?: number
  courseCount?: number
  achievements?: string
  createdAt: string
}

export default function Instructors() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<InstructorItem[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<InstructorItem | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string>('')
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const list = await instructorApi.getList()
      setData(list)
    } catch {
      message.error('获取讲师列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCreate = () => {
    setEditingRecord(null)
    form.resetFields()
    form.setFieldsValue({ color: '#0D9488' })
    setAvatarUrl('')
    setModalOpen(true)
  }

  const handleEdit = (record: InstructorItem) => {
    setEditingRecord(record)
    form.setFieldsValue({
      ...record,
      color: record.color || '#0D9488',
    })
    setAvatarUrl(record.avatar || '')
    setModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await instructorApi.remove(id)
      message.success('删除成功')
      fetchData()
    } catch {
      message.error('删除失败')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const colorValue =
        typeof values.color === 'string'
          ? values.color
          : values.color?.toHexString?.() || values.color

      const payload = {
        ...values,
        color: colorValue,
      }

      if (editingRecord) {
        await instructorApi.update(editingRecord.id, payload)
        message.success('更新成功')
      } else {
        await instructorApi.create(payload)
        message.success('新增成功')
      }
      setModalOpen(false)
      fetchData()
    } catch {
      // form validation failed
    }
  }

  const columns: ColumnsType<InstructorItem> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 70,
    },
    {
      title: '头像',
      dataIndex: 'avatar',
      width: 80,
      render: (avatar: string | undefined, record: InstructorItem) =>
        avatar ? (
          <AntAvatar src={avatar} size={40} />
        ) : (
          <AntAvatar size={40} style={{ backgroundColor: record.color || '#0D9488' }}>
            {record.name?.[0] || '?'}
          </AntAvatar>
        ),
    },
    {
      title: '姓名',
      dataIndex: 'name',
      width: 100,
    },
    {
      title: '头衔',
      dataIndex: 'title',
      width: 140,
    },
    {
      title: '服务说明',
      dataIndex: 'service',
      width: 180,
      ellipsis: true,
    },
    {
      title: '专长',
      dataIndex: 'expertise',
      width: 160,
      ellipsis: true,
    },
    {
      title: '从业年限',
      dataIndex: 'years',
      width: 100,
      render: (v: number | undefined) => (v != null ? `${v} 年` : '-'),
    },
    {
      title: '学员数',
      dataIndex: 'studentCount',
      width: 90,
      render: (v: number | undefined) => (v != null ? v : '-'),
    },
    {
      title: '课程数',
      dataIndex: 'courseCount',
      width: 90,
      render: (v: number | undefined) => (v != null ? v : '-'),
    },
    {
      title: '头像背景色',
      dataIndex: 'color',
      width: 110,
      render: (color: string) =>
        color ? (
          <Space align="center">
            <span
              style={{
                display: 'inline-block',
                width: 20,
                height: 20,
                borderRadius: 4,
                backgroundColor: color,
                border: '1px solid #d9d9d9',
                verticalAlign: 'middle',
              }}
            />
            <span style={{ fontSize: 12, color: '#666' }}>{color}</span>
          </Space>
        ) : (
          '-'
        ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 170,
      render: (v: string) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: '操作',
      width: 150,
      fixed: 'right',
      render: (_: unknown, record: InstructorItem) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确认删除该讲师吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新增讲师
        </Button>
      </div>

      <Spin spinning={loading}>
        <Table<InstructorItem>
          rowKey="id"
          columns={columns}
          dataSource={data}
          pagination={false}
          scroll={{ x: 1400 }}
          size="middle"
        />
      </Spin>

      <Modal
        title={editingRecord ? '编辑讲师' : '新增讲师'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="确定"
        cancelText="取消"
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            label="姓名"
            name="name"
            rules={[{ required: true, message: '请输入讲师姓名' }]}
          >
            <Input placeholder="请输入讲师姓名" />
          </Form.Item>

          <Form.Item
            label="头衔"
            name="title"
            rules={[{ required: true, message: '请输入讲师头衔' }]}
          >
            <Input placeholder="请输入讲师头衔" />
          </Form.Item>

          <Form.Item label="服务说明" name="service">
            <Input placeholder="请输入服务说明" />
          </Form.Item>

          <Form.Item label="个人简介" name="bio">
            <Input.TextArea rows={3} placeholder="请输入个人简介" />
          </Form.Item>

          <Form.Item label="头像背景色" name="color">
            <ColorPicker showText format="hex" />
          </Form.Item>

          <Form.Item label="头像图片" name="avatar">
            <Upload
              listType="picture-circle"
              showUploadList={false}
              accept="image/png,image/jpeg,image/webp"
              customRequest={async (options) => {
                const { file, onSuccess, onError } = options
                try {
                  const { url } = await instructorApi.uploadAvatar(file as File)
                  form.setFieldValue('avatar', url)
                  setAvatarUrl(url)
                  message.success('头像上传成功')
                  onSuccess?.(null)
                } catch (err) {
                  message.error('头像上传失败')
                  onError?.(err as Error)
                }
              }}
            >
              {avatarUrl ? (
                <AntAvatar src={avatarUrl} size={80} shape="square" />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#999' }}>
                  <UploadOutlined style={{ fontSize: 20 }} />
                  <span style={{ fontSize: 12, marginTop: 4 }}>上传头像</span>
                </div>
              )}
            </Upload>
          </Form.Item>

          <Form.Item label="专长" name="expertise">
            <Input placeholder="请输入专长，多个以英文逗号分隔" />
          </Form.Item>

          <Form.Item label="从业年限" name="years">
            <InputNumber min={0} placeholder="年" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="学员数" name="studentCount">
            <InputNumber min={0} placeholder="人" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="课程数" name="courseCount">
            <InputNumber min={0} placeholder="门" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="成就" name="achievements">
            <Input.TextArea
              rows={3}
              placeholder="请输入成就，多条以换行分隔"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
