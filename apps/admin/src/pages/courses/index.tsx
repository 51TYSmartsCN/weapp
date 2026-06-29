import { useEffect, useState, useCallback } from 'react'
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Modal,
  Form,
  InputNumber,
  Switch,
  Popconfirm,
  Tag,
  Image,
  message,
  Card,
} from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { courseApi, instructorApi } from '../../api'

const { TextArea } = Input

// ===================== 类型定义 =====================

interface CourseItem {
  id: number
  title: string
  desc: string
  instructorId: number | null
  instructorName: string
  rating: number
  students: number
  price: number
  originalPrice?: number
  cover: string
  isHot: boolean
  status: number
  requiresAccess: boolean
  createdAt: string
  updatedAt: string
}

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

interface CourseFormData {
  title: string
  desc: string
  instructorId: number | null
  price: number
  originalPrice: number
  cover: string
  isHot: boolean
  status: number
  requiresAccess: boolean
}

// ===================== 组件实现 =====================

export default function Courses() {
  // ---------- 状态 ----------
  const [list, setList] = useState<CourseItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [size] = useState(10)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined)
  const [loading, setLoading] = useState(false)

  // Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<CourseItem | null>(null)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [form] = Form.useForm<CourseFormData>()

  // 讲师列表
  const [instructors, setInstructors] = useState<InstructorItem[]>([])

  // ---------- 加载讲师列表 ----------
  const loadInstructors = useCallback(async () => {
    try {
      const data = await instructorApi.getList()
      setInstructors(Array.isArray(data) ? data : [])
    } catch {
      // 静默处理
    }
  }, [])

  // ---------- 加载课程列表 ----------
  const loadList = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, any> = { page, size }
      if (search) params.search = search
      if (statusFilter !== undefined && statusFilter !== null) params.status = statusFilter
      const res = await courseApi.getList(params)
      setList(res?.list ?? [])
      setTotal(res?.total ?? 0)
    } catch {
      message.error('加载课程列表失败')
    } finally {
      setLoading(false)
    }
  }, [page, size, search, statusFilter])

  useEffect(() => {
    loadInstructors()
  }, [loadInstructors])

  useEffect(() => {
    loadList()
  }, [loadList])

  // ---------- 搜索 / 筛选 ----------
  const handleSearch = (val: string) => {
    setSearch(val.trim())
    setPage(1)
  }

  const handleStatusChange = (val: number | undefined) => {
    setStatusFilter(val === undefined || val === -1 ? undefined : val)
    setPage(1)
  }

  // ---------- 新增 / 编辑 ----------
  const openCreate = () => {
    setEditingRecord(null)
    form.resetFields()
    form.setFieldsValue({ status: 1, isHot: false, price: 0, originalPrice: 0, cover: '', requiresAccess: true })
    setModalOpen(true)
  }

  const openEdit = (record: CourseItem) => {
    setEditingRecord(record)
    form.setFieldsValue({
      title: record.title,
      desc: record.desc,
      instructorId: record.instructorId,
      price: record.price,
      originalPrice: record.originalPrice ?? 0,
      cover: record.cover,
      isHot: record.isHot,
      status: record.status,
      requiresAccess: record.requiresAccess,
    })
    setModalOpen(true)
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()
      setConfirmLoading(true)

      if (editingRecord) {
        await courseApi.update(editingRecord.id, values)
        message.success('更新成功')
      } else {
        await courseApi.create(values)
        message.success('创建成功')
      }

      setModalOpen(false)
      loadList()
    } catch (err: any) {
      if (err?.errorFields) return // 表单校验失败
      message.error(editingRecord ? '更新失败' : '创建失败')
    } finally {
      setConfirmLoading(false)
    }
  }

  // ---------- 上/下架 ----------
  const handleToggleStatus = async (record: CourseItem) => {
    try {
      await courseApi.toggleStatus(record.id)
      message.success(record.status === 1 ? '已下架' : '已上架')
      loadList()
    } catch {
      message.error('操作失败')
    }
  }

  // ---------- 切换热门 ----------
  const handleToggleHot = async (record: CourseItem) => {
    try {
      await courseApi.toggleHot(record.id)
      message.success(record.isHot ? '已取消热门' : '已设为热门')
      loadList()
    } catch {
      message.error('操作失败')
    }
  }

  // ---------- 切换权限校验 ----------
  const handleToggleAccess = async (record: CourseItem) => {
    try {
      await courseApi.toggleAccess(record.id)
      message.success(record.requiresAccess ? '已开放观看（测试模式）' : '已恢复购课权限校验')
      loadList()
    } catch {
      message.error('操作失败')
    }
  }

  // ---------- 删除 ----------
  const handleDelete = async (id: number) => {
    try {
      await courseApi.remove(id)
      message.success('删除成功')
      loadList()
    } catch {
      message.error('删除失败')
    }
  }

  // ---------- 分页 ----------
  const handlePageChange = (p: number) => {
    setPage(p)
  }

  // ---------- 表格列定义 ----------
  const columns: ColumnsType<CourseItem> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 60,
    },
    {
      title: '封面',
      dataIndex: 'cover',
      width: 70,
      render: (cover: string) =>
        cover ? (
          <Image src={cover} width={40} height={40} style={{ borderRadius: 6, objectFit: 'cover' }} preview={false} />
        ) : (
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 6,
              background: '#f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              color: '#999',
            }}
          >
            无图
          </div>
        ),
    },
    {
      title: '标题',
      dataIndex: 'title',
      ellipsis: true,
      width: 160,
    },
    {
      title: '讲师',
      dataIndex: 'instructorName',
      width: 80,
      render: (text: string) => text || '-',
    },
    {
      title: '价格',
      dataIndex: 'price',
      width: 90,
      render: (price: number, record: CourseItem) => {
        const hasOriginal = record.originalPrice && record.originalPrice > price
        return (
          <span>
            ¥{price}
            {hasOriginal && (
              <span style={{ textDecoration: 'line-through', color: '#999', marginLeft: 4, fontSize: 12 }}>
                ¥{record.originalPrice}
              </span>
            )}
          </span>
        )
      },
    },
    {
      title: '评分',
      dataIndex: 'rating',
      width: 70,
      render: (val: number) => (val != null ? val.toFixed(1) : '-'),
    },
    {
      title: '学习人数',
      dataIndex: 'students',
      width: 90,
    },
    {
      title: '热门',
      dataIndex: 'isHot',
      width: 70,
      render: (isHot: boolean) =>
        isHot ? <Tag color="orange">热门</Tag> : <Tag>普通</Tag>,
    },
    {
      title: '观看权限',
      dataIndex: 'requiresAccess',
      width: 100,
      render: (requiresAccess: boolean) =>
        requiresAccess ? (
          <Tag color="blue">需购买</Tag>
        ) : (
          <Tag color="green">开放观看</Tag>
        ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (status: number) =>
        status === 1 ? <Tag color="green">上架</Tag> : <Tag color="default">下架</Tag>,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 160,
      render: (val: string) => val || '-',
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 320,
      render: (_: any, record: CourseItem) => (
        <Space size="small" wrap>
          <Button type="link" size="small" onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Button type="link" size="small" onClick={() => handleToggleStatus(record)}>
            {record.status === 1 ? '下架' : '上架'}
          </Button>
          <Button type="link" size="small" onClick={() => handleToggleHot(record)}>
            {record.isHot ? '取消热门' : '设为热门'}
          </Button>
          <Button type="link" size="small" onClick={() => handleToggleAccess(record)}>
            {record.requiresAccess ? '开放观看' : '恢复权限'}
          </Button>
          <Popconfirm
            title="确定要删除该课程吗？"
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

  // ---------- 渲染 ----------
  return (
    <Card>
      {/* 顶部工具栏 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新增课程
          </Button>
          <Input.Search
            placeholder="搜索课程标题"
            prefix={<SearchOutlined />}
            allowClear
            style={{ width: 220 }}
            onSearch={handleSearch}
            onPressEnter={(e) => handleSearch((e.target as HTMLInputElement).value)}
          />
          <Select
            placeholder="状态筛选"
            allowClear
            style={{ width: 120 }}
            value={statusFilter}
            onChange={handleStatusChange}
            options={[
              { label: '全部', value: undefined },
              { label: '上架', value: 1 },
              { label: '下架', value: 0 },
            ]}
          />
        </Space>
      </div>

      {/* 表格 */}
      <Table<CourseItem>
        rowKey="id"
        columns={columns}
        dataSource={list}
        loading={loading}
        scroll={{ x: 1300 }}
        pagination={{
          current: page,
          pageSize: size,
          total,
          showTotal: (t) => `共 ${t} 条`,
          onChange: handlePageChange,
          showSizeChanger: false,
        }}
      />

      {/* 新增 / 编辑弹窗 */}
      <Modal
        title={editingRecord ? '编辑课程' : '新增课程'}
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={() => setModalOpen(false)}
        confirmLoading={confirmLoading}
        destroyOnClose
        width={560}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ status: true, isHot: false, price: 0, originalPrice: 0, cover: '', requiresAccess: true }}
        >
          <Form.Item
            label="课程标题"
            name="title"
            rules={[{ required: true, message: '请输入课程标题' }]}
          >
            <Input placeholder="请输入课程标题" />
          </Form.Item>

          <Form.Item
            label="课程描述"
            name="desc"
            rules={[{ required: true, message: '请输入课程描述' }]}
          >
            <TextArea rows={3} placeholder="请输入课程描述" />
          </Form.Item>

          <Form.Item label="授课讲师" name="instructorId">
            <Select
              placeholder="请选择讲师"
              allowClear
              showSearch
              optionFilterProp="label"
              options={instructors.map((inst) => ({
                value: inst.id,
                label: inst.name,
              }))}
            />
          </Form.Item>

          <Form.Item label="售价 (¥)" name="price">
            <InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="请输入售价" />
          </Form.Item>

          <Form.Item label="原价 (¥)" name="originalPrice">
            <InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="请输入原价（可选）" />
          </Form.Item>

          <Form.Item label="封面图片 URL" name="cover">
            <Input placeholder="请输入封面图片地址" />
          </Form.Item>

          <Form.Item label="热门推荐" name="isHot" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item
            label="观看权限"
            name="requiresAccess"
            valuePropName="checked"
            tooltip="开启后用户需购买或登录才能观看视频；关闭后任何人都可观看（用于测试）"
          >
            <Switch
              checkedChildren="需购买"
              unCheckedChildren="开放观看"
              defaultChecked
            />
          </Form.Item>

          <Form.Item label="上架状态" name="status" valuePropName="checked" normalize={(val) => (val ? 1 : 0)}>
            <Switch
              checkedChildren="上架"
              unCheckedChildren="下架"
              defaultChecked
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}
