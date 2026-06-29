import React, { useEffect, useState, useCallback } from 'react'
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Modal,
  Form,
  Switch,
  Popconfirm,
  Tag,
  message,
} from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { wxshopProductApi, courseApi } from '../../api'

// ===================== 类型定义 =====================

interface WxshopProductItem {
  id: number
  productId: string
  productTitle: string
  courseId: number
  courseTitle: string
  status: number
  createdAt: string
  updatedAt: string
}

interface CourseOption {
  id: number
  title: string
}

interface WxshopProductFormData {
  productId: string
  productTitle: string
  courseId: number
  courseTitle: string
  status: boolean
}

// ===================== 组件实现 =====================

export default function WxshopProducts() {
  // ---------- 状态 ----------
  const [list, setList] = useState<WxshopProductItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [size] = useState(20)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined)
  const [loading, setLoading] = useState(false)

  // Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<WxshopProductItem | null>(null)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [form] = Form.useForm<WxshopProductFormData>()

  // 课程列表（下拉选择用）
  const [courses, setCourses] = useState<CourseOption[]>([])
  const [coursesLoading, setCoursesLoading] = useState(false)

  // ---------- 加载课程列表 ----------
  const loadCourses = useCallback(async () => {
    setCoursesLoading(true)
    try {
      const res = await courseApi.getList({ page: 1, size: 100 })
      const data = res?.list ?? []
      setCourses(data.map((c: any) => ({ id: c.id, title: c.title })))
    } catch {
      message.error('加载课程列表失败')
    } finally {
      setCoursesLoading(false)
    }
  }, [])

  // ---------- 加载列表 ----------
  const loadList = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, any> = { page, size }
      if (search) params.search = search
      if (statusFilter !== undefined && statusFilter !== null) params.status = statusFilter
      const res = await wxshopProductApi.getList(params)
      setList(res?.list ?? [])
      setTotal(res?.total ?? 0)
    } catch {
      message.error('加载商品映射列表失败')
    } finally {
      setLoading(false)
    }
  }, [page, size, search, statusFilter])

  useEffect(() => {
    loadCourses()
  }, [loadCourses])

  useEffect(() => {
    loadList()
  }, [loadList])

  // ---------- 搜索 / 筛选 ----------
  const handleSearch = (val: string) => {
    setSearch(val.trim())
    setPage(1)
  }

  const handleStatusChange = (val: string | number | undefined) => {
    if (val === '' || val === undefined || val === null) {
      setStatusFilter(undefined)
    } else {
      setStatusFilter(Number(val))
    }
    setPage(1)
  }

  // ---------- 课程选择变化时，自动填充课程标题 ----------
  const handleCourseChange = (courseId: number) => {
    const course = courses.find((c) => c.id === courseId)
    if (course) {
      form.setFieldsValue({ courseTitle: course.title })
    }
  }

  // ---------- 新增 / 编辑 ----------
  const openCreate = () => {
    setEditingRecord(null)
    form.resetFields()
    form.setFieldsValue({ status: true, productTitle: '', courseTitle: '' })
    setModalOpen(true)
  }

  const openEdit = (record: WxshopProductItem) => {
    setEditingRecord(record)
    form.setFieldsValue({
      productId: record.productId,
      productTitle: record.productTitle,
      courseId: record.courseId,
      courseTitle: record.courseTitle,
      status: record.status === 1,
    })
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setConfirmLoading(true)
      const payload = {
        productId: values.productId.trim(),
        productTitle: values.productTitle?.trim() || '',
        courseId: Number(values.courseId),
        courseTitle: values.courseTitle?.trim() || '',
        status: values.status ? 1 : 0,
      }

      if (editingRecord) {
        await wxshopProductApi.update(editingRecord.id, payload)
        message.success('更新成功')
      } else {
        await wxshopProductApi.create(payload)
        message.success('创建成功')
      }
      setModalOpen(false)
      loadList()
    } catch (err: any) {
      if (err?.message) {
        // form validation error, already shown
      } else {
        message.error(editingRecord ? '更新失败' : '创建失败')
      }
    } finally {
      setConfirmLoading(false)
    }
  }

  // ---------- 删除 ----------
  const handleDelete = async (id: number) => {
    try {
      await wxshopProductApi.remove(id)
      message.success('删除成功')
      loadList()
    } catch {
      message.error('删除失败')
    }
  }

  // ---------- 切换状态 ----------
  const handleToggleStatus = async (record: WxshopProductItem, checked: boolean) => {
    try {
      await wxshopProductApi.toggleStatus(record.id, checked)
      message.success(checked ? '已启用' : '已禁用')
      loadList()
    } catch {
      message.error('操作失败')
    }
  }

  // ---------- 表格列 ----------
  const columns: ColumnsType<WxshopProductItem> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 70,
    },
    {
      title: '商品ID',
      dataIndex: 'productId',
      width: 200,
      ellipsis: true,
    },
    {
      title: '商品标题',
      dataIndex: 'productTitle',
      width: 200,
      ellipsis: true,
    },
    {
      title: '课程ID',
      dataIndex: 'courseId',
      width: 90,
    },
    {
      title: '课程标题',
      dataIndex: 'courseTitle',
      width: 200,
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (val: number) => (
        <Tag color={val === 1 ? 'green' : 'default'}>
          {val === 1 ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 170,
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right' as const,
      render: (_: unknown, record: WxshopProductItem) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Switch
            size="small"
            checked={record.status === 1}
            onChange={(checked) => handleToggleStatus(record, checked)}
          />
          <Popconfirm
            title="确定删除该映射吗？"
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

  const statusOptions = [
    { label: '全部', value: '' },
    { label: '启用', value: 1 },
    { label: '禁用', value: 0 },
  ]

  return (
    <>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Space>
          <Input
            placeholder="搜索商品ID/商品标题/课程标题"
            prefix={<SearchOutlined />}
            allowClear
            style={{ width: 280 }}
            onPressEnter={(e) => handleSearch((e.target as HTMLInputElement).value)}
            onBlur={(e) => handleSearch(e.target.value)}
            defaultValue={search}
          />
          <Select
            value={statusFilter === undefined ? '' : statusFilter}
            options={statusOptions}
            onChange={handleStatusChange}
            style={{ width: 120 }}
          />
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          新增映射
        </Button>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={list}
        loading={loading}
        scroll={{ x: 1100 }}
        pagination={{
          current: page,
          pageSize: size,
          total,
          showTotal: (t) => `共 ${t} 条`,
          onChange: setPage,
        }}
      />

      <Modal
        title={editingRecord ? '编辑商品映射' : '新增商品映射'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        confirmLoading={confirmLoading}
        onOk={handleSubmit}
        okText="确定"
        cancelText="取消"
        width={520}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ status: true }}
        >
          <Form.Item
            label="商品ID（微信小店商品ID/out_product_id）"
            name="productId"
            rules={[{ required: true, message: '请输入商品ID' }]}
          >
            <Input placeholder="请输入商品ID，如 course_1 或微信小店的 product_id" />
          </Form.Item>

          <Form.Item
            label="商品标题"
            name="productTitle"
          >
            <Input placeholder="便于识别的商品名称（选填）" />
          </Form.Item>

          <Form.Item
            label="关联课程"
            name="courseId"
            rules={[{ required: true, message: '请选择关联课程' }]}
          >
            <Select
              showSearch
              placeholder="请选择课程"
              optionFilterProp="label"
              loading={coursesLoading}
              onChange={handleCourseChange}
              options={courses.map((c) => ({
                label: `${c.id} - ${c.title}`,
                value: c.id,
              }))}
            />
          </Form.Item>

          <Form.Item
            label="课程标题"
            name="courseTitle"
          >
            <Input placeholder="课程标题（选择课程后自动填充，可手动修改）" />
          </Form.Item>

          <Form.Item
            label="状态"
            name="status"
            valuePropName="checked"
          >
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
