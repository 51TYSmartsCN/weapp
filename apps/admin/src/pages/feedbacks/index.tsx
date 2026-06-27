import { useState, useEffect } from 'react'
import { Table, Card, Popconfirm, message, Tag } from 'antd'
import { feedbackApi } from '../../api'

interface FeedbackItem {
  id: number
  userId: number
  userName: string
  type: string
  content: string
  contact?: string
  createdAt: string
}

export default function Feedbacks() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<FeedbackItem[]>([])

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await feedbackApi.getList()
      setData(res)
    } catch {
      message.error('获取反馈列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleDelete = async (id: number) => {
    try {
      await feedbackApi.remove(id)
      message.success('删除成功')
      fetchData()
    } catch {
      message.error('删除失败')
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: '用户', dataIndex: 'userName', width: 100 },
    {
      title: '类型',
      dataIndex: 'type',
      width: 100,
      render: (type: string) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: '内容',
      dataIndex: 'content',
      width: 300,
      ellipsis: true,
    },
    { title: '联系方式', dataIndex: 'contact', width: 140 },
    { title: '时间', dataIndex: 'createdAt', width: 180 },
    {
      title: '操作',
      width: 80,
      render: (_: unknown, record: FeedbackItem) => (
        <Popconfirm
          title="确定要删除该反馈吗？"
          onConfirm={() => handleDelete(record.id)}
          okText="确定"
          cancelText="取消"
        >
          <Tag color="red" style={{ cursor: 'pointer' }}>删除</Tag>
        </Popconfirm>
      ),
    },
  ]

  return (
    <Card title="反馈管理">
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={false}
      />
    </Card>
  )
}
