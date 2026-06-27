import { useState, useEffect, useCallback } from 'react'
import { Table, Card, Popconfirm, message, Tag } from 'antd'
import { StarOutlined, StarFilled } from '@ant-design/icons'
import { reviewApi } from '../../api'

interface ReviewItem {
  id: number
  courseId: number
  courseTitle: string
  userId: number
  name: string
  rating: number
  content: string
  date: string
  createdAt: string
}

export default function Reviews() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<ReviewItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await reviewApi.getList({ page, size })
      setData(res.list)
      setTotal(res.total)
    } catch {
      message.error('获取评价列表失败')
    } finally {
      setLoading(false)
    }
  }, [page, size])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleDelete = async (id: number) => {
    try {
      await reviewApi.remove(id)
      message.success('删除成功')
      fetchData()
    } catch {
      message.error('删除失败')
    }
  }

  const renderStars = (rating: number) => {
    return (
      <span>
        {Array.from({ length: 5 }, (_, i) =>
          i < rating ? (
            <StarFilled key={i} style={{ color: '#F59E0B', fontSize: 16 }} />
          ) : (
            <StarOutlined key={i} style={{ color: '#D9D9D9', fontSize: 16 }} />
          ),
        )}
      </span>
    )
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: '课程', dataIndex: 'courseTitle', ellipsis: true },
    { title: '用户', dataIndex: 'name', width: 100 },
    {
      title: '评分',
      dataIndex: 'rating',
      width: 140,
      render: (rating: number) => renderStars(rating),
    },
    { title: '评价内容', dataIndex: 'content', ellipsis: true },
    { title: '日期', dataIndex: 'date', width: 120 },
    {
      title: '操作',
      width: 80,
      render: (_: unknown, record: ReviewItem) => (
        <Popconfirm
          title="确定要删除该评价吗？"
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
    <Card title="评价管理">
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{
          current: page,
          pageSize: size,
          total,
          showSizeChanger: true,
          showTotal: (t) => `共 ${t} 条`,
          onChange: (p, s) => {
            setPage(p)
            setSize(s)
          },
        }}
      />
    </Card>
  )
}
