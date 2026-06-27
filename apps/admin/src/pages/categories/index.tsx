import { useEffect, useState } from 'react'
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  message,
} from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { categoryApi } from '../../api'

interface CategoryItem {
  id: number
  code: string
  name: string
  sort: number
}

export default function Categories() {
  const [list, setList] = useState<CategoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<CategoryItem | null>(null)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [form] = Form.useForm()

  const fetchList = async () => {
    setLoading(true)
    try {
      const data = await categoryApi.getList()
      setList(data)
    } catch {
      message.error('获取分类列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchList()
  }, [])

  const handleAdd = () => {
    setEditingItem(null)
    form.resetFields()
    form.setFieldsValue({ sort: 0 })
    setModalOpen(true)
  }

  const handleEdit = (record: CategoryItem) => {
    setEditingItem(record)
    form.setFieldsValue({
      code: record.code,
      name: record.name,
      sort: record.sort,
    })
    setModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await categoryApi.remove(id)
      message.success('删除成功')
      fetchList()
    } catch {
      message.error('删除失败')
    }
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()
      setConfirmLoading(true)
      if (editingItem) {
        await categoryApi.update(editingItem.id, values)
        message.success('更新成功')
      } else {
        await categoryApi.create(values)
        message.success('创建成功')
      }
      setModalOpen(false)
      fetchList()
    } catch {
      // validation error or api error
    } finally {
      setConfirmLoading(false)
    }
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 60,
    },
    {
      title: '枚举值',
      dataIndex: 'code',
    },
    {
      title: '显示名',
      dataIndex: 'name',
    },
    {
      title: '排序',
      dataIndex: 'sort',
      width: 80,
    },
    {
      title: '操作',
      width: 160,
      render: (_: unknown, record: CategoryItem) => (
        <Space>
          <Button type='link' size='small' onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title='确认删除该分类？' onConfirm={() => handleDelete(record.id)} okText='确定' cancelText='取消'>
            <Button type='link' size='small' danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>分类管理</h2>
        <Button type='primary' icon={<PlusOutlined />} onClick={handleAdd}>
          新增分类
        </Button>
      </div>

      <Table
        rowKey='id'
        columns={columns}
        dataSource={list}
        loading={loading}
        pagination={false}
        size='middle'
      />

      <Modal
        title={editingItem ? '编辑分类' : '新增分类'}
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={() => setModalOpen(false)}
        confirmLoading={confirmLoading}
        destroyOnClose
      >
        <Form form={form} layout='vertical' autoComplete='off'>
          <Form.Item name='code' label='枚举值' rules={[{ required: true, message: '请输入枚举值' }]}>
            <Input placeholder='请输入枚举值，如 geography' />
          </Form.Item>
          <Form.Item name='name' label='显示名' rules={[{ required: true, message: '请输入显示名' }]}>
            <Input placeholder='请输入分类显示名，如 地理' />
          </Form.Item>
          <Form.Item name='sort' label='排序'>
            <InputNumber min={0} style={{ width: '100%' }} placeholder='数值越小越靠前' />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
