import React, { useState, useEffect, useCallback } from 'react'
import {
  Table,
  Tag,
  Button,
  Select,
  Modal,
  Descriptions,
  Space,
  message,
} from 'antd'
import dayjs from 'dayjs'
import { orderApi } from '../../api'

interface OrderItem {
  id: number
  orderNo: string
  userId: number
  userName: string
  courseId: number
  courseTitle: string
  amount: number
  originalAmount?: number
  couponId?: number
  status: number
  payMethod?: string
  paidAt?: string
  createdAt: string
}

const STATUS_MAP: Record<number, { label: string; color: string }> = {
  0: { label: '待支付', color: 'orange' },
  1: { label: '已支付', color: 'green' },
  2: { label: '已退款', color: 'red' },
  3: { label: '已取消', color: 'default' },
}

const STATUS_OPTIONS = [
  { label: '全部', value: '' },
  { label: '待支付', value: 0 },
  { label: '已支付', value: 1 },
  { label: '已退款', value: 2 },
  { label: '已取消', value: 3 },
]

const PAGE_SIZE = 20

export default function Orders() {
  const [data, setData] = useState<OrderItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined)

  // Detail modal
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailData, setDetailData] = useState<OrderItem | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const fetchData = useCallback(async (p: number, status?: number) => {
    setLoading(true)
    try {
      const res = await orderApi.getList({
        page: p,
        size: PAGE_SIZE,
        status,
      })
      setData(res.list)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData(page, statusFilter)
  }, [page, statusFilter, fetchData])

  const handleStatusChange = (val: string) => {
    const status = val === '' ? undefined : Number(val)
    setStatusFilter(status)
    setPage(1)
  }

  const openDetail = async (record: OrderItem) => {
    setDetailOpen(true)
    setDetailLoading(true)
    try {
      const res = await orderApi.getById(record.id)
      setDetailData(res)
    } catch {
      setDetailData(record)
    } finally {
      setDetailLoading(false)
    }
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 70,
    },
    {
      title: '订单号',
      dataIndex: 'orderNo',
      width: 200,
      ellipsis: true,
    },
    {
      title: '用户',
      dataIndex: 'userName',
      width: 100,
      ellipsis: true,
    },
    {
      title: '课程',
      dataIndex: 'courseTitle',
      width: 160,
      ellipsis: true,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      width: 90,
      align: 'right' as const,
      render: (val: number) => <span>&yen;{val?.toFixed(2)}</span>,
    },
    {
      title: '原价',
      dataIndex: 'originalAmount',
      width: 90,
      align: 'right' as const,
      render: (val?: number) => (val != null ? <span>&yen;{val.toFixed(2)}</span> : '-'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (val: number) => {
        const info = STATUS_MAP[val] ?? { label: '未知', color: 'default' }
        return <Tag color={info.color}>{info.label}</Tag>
      },
    },
    {
      title: '支付方式',
      dataIndex: 'payMethod',
      width: 90,
      render: (val?: string) => val || '-',
    },
    {
      title: '支付时间',
      dataIndex: 'paidAt',
      width: 170,
      render: (val?: string) => (val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 170,
      render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      fixed: 'right' as const,
      render: (_: unknown, record: OrderItem) => (
        <Button type="link" size="small" onClick={() => openDetail(record)}>
          详情
        </Button>
      ),
    },
  ]

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Space>
          <span>订单状态：</span>
          <Select
            value={statusFilter === undefined ? '' : statusFilter}
            options={STATUS_OPTIONS}
            onChange={handleStatusChange}
            style={{ width: 140 }}
          />
        </Space>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        scroll={{ x: 1320 }}
        pagination={{
          current: page,
          pageSize: PAGE_SIZE,
          total,
          showTotal: (t) => `共 ${t} 条`,
          onChange: setPage,
        }}
      />

      <Modal
        title="订单详情"
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={[
          <Button key="close" onClick={() => setDetailOpen(false)}>
            关闭
          </Button>,
        ]}
        width={600}
      >
        {detailData && (
          <Descriptions column={2} bordered size="small" loading={detailLoading}>
            <Descriptions.Item label="订单ID">{detailData.id}</Descriptions.Item>
            <Descriptions.Item label="订单号">{detailData.orderNo}</Descriptions.Item>
            <Descriptions.Item label="用户ID">{detailData.userId}</Descriptions.Item>
            <Descriptions.Item label="用户名">{detailData.userName}</Descriptions.Item>
            <Descriptions.Item label="课程ID">{detailData.courseId}</Descriptions.Item>
            <Descriptions.Item label="课程名称" span={2}>{detailData.courseTitle}</Descriptions.Item>
            <Descriptions.Item label="实付金额">&yen;{detailData.amount?.toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label="原价">
              {detailData.originalAmount != null ? `\u00A5${detailData.originalAmount.toFixed(2)}` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={STATUS_MAP[detailData.status]?.color ?? 'default'}>
                {STATUS_MAP[detailData.status]?.label ?? '未知'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="支付方式">{detailData.payMethod || '-'}</Descriptions.Item>
            <Descriptions.Item label="优惠券ID">{detailData.couponId || '-'}</Descriptions.Item>
            <Descriptions.Item label="支付时间">
              {detailData.paidAt ? dayjs(detailData.paidAt).format('YYYY-MM-DD HH:mm:ss') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {dayjs(detailData.createdAt).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </>
  )
}
