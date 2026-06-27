import { useState, useEffect } from 'react'
import { Table, Card, Button, Popconfirm, message, Modal, Form, Input, InputNumber } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { helpArticleApi } from '../../api'

interface HelpArticleItem {
  id: number
  title: string
  content: string
  category: string
  sort: number
}

export default function HelpArticles() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<HelpArticleItem[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<HelpArticleItem | null>(null)
  const [form] = Form.useForm()

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await helpArticleApi.getList()
      setData(res)
    } catch {
      message.error('获取文章列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleOpenCreate = () => {
    setEditingItem(null)
    form.resetFields()
    setModalOpen(true)
  }

  const handleOpenEdit = (record: HelpArticleItem) => {
    setEditingItem(record)
    form.setFieldsValue({
      title: record.title,
      content: record.content,
      category: record.category,
      sort: record.sort,
    })
    setModalOpen(true)
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()
      if (editingItem) {
        await helpArticleApi.update(editingItem.id, values)
        message.success('修改成功')
      } else {
        await helpArticleApi.create(values)
        message.success('新增成功')
      }
      setModalOpen(false)
      fetchData()
    } catch {
      // form validation failed
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await helpArticleApi.remove(id)
      message.success('删除成功')
      fetchData()
    } catch {
      message.error('删除失败')
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: '标题', dataIndex: 'title', ellipsis: true },
    { title: '分类', dataIndex: 'category', width: 120 },
    { title: '排序', dataIndex: 'sort', width: 80 },
    {
      title: '内容预览',
      dataIndex: 'content',
      ellipsis: true,
      render: (content: string) => content.length > 50 ? content.substring(0, 50) + '...' : content,
    },
    {
      title: '操作',
      width: 140,
      render: (_: unknown, record: HelpArticleItem) => (
        <>
          <a onClick={() => handleOpenEdit(record)} style={{ marginRight: 12 }}>编辑</a>
          <Popconfirm
            title="确定要删除该文章吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <a style={{ color: '#ff4d4f' }}>删除</a>
          </Popconfirm>
        </>
      ),
    },
  ]

  return (
    <Card
      title="帮助文章管理"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>
          新增文章
        </Button>
      }
    >
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={false}
      />

      <Modal
        title={editingItem ? '编辑文章' : '新增文章'}
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={() => setModalOpen(false)}
        okText="确定"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="请输入文章标题" />
          </Form.Item>
          <Form.Item name="content" label="内容">
            <Input.TextArea rows={6} placeholder="请输入文章内容" />
          </Form.Item>
          <Form.Item name="category" label="分类">
            <Input placeholder="请输入分类" />
          </Form.Item>
          <Form.Item name="sort" label="排序">
            <InputNumber min={0} placeholder="排序值" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}
