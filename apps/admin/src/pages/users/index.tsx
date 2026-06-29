import { useState, useEffect, useCallback } from 'react'
import {
  Table,
  Tag,
  Button,
  Modal,
  Switch,
  DatePicker,
  Space,
  Avatar,
  message,
  Typography,
} from 'antd'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import { userApi } from '../../api'

const { Text } = Typography

interface UserItem {
  id: number
  openid: string
  name: string
  avatar: string
  vip: boolean
  vipExpireAt: string | null
  boughtCourses: number
  finishedLessons: number
  studyHours: number
  createdAt: string
  updatedAt: string
}

const PAGE_SIZE = 20

export default function Users() {
  const [data, setData] = useState<UserItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  // VIP modal
  const [modalOpen, setModalOpen] = useState(false)
  const [modalUser, setModalUser] = useState<UserItem | null>(null)
  const [vipSwitch, setVipSwitch] = useState(false)
  const [vipExpireAt, setVipExpireAt] = useState<Dayjs | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchData = useCallback(async (p: number) => {
    setLoading(true)
    try {
      const res = await userApi.getList({ page: p, size: PAGE_SIZE })
      setData(res.list)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData(page)
  }, [page, fetchData])

  const openVipModal = (record: UserItem) => {
    setModalUser(record)
    setVipSwitch(record.vip)
    setVipExpireAt(record.vipExpireAt ? dayjs(record.vipExpireAt) : null)
    setModalOpen(true)
  }

  const handleVipSubmit = async () => {
    if (!modalUser) return
    setSubmitting(true)
    try {
      await userApi.updateVip(modalUser.id, {
        vip: vipSwitch,
        vipExpireAt: vipExpireAt ? vipExpireAt.format('YYYY-MM-DD HH:mm:ss') : null,
      })
      message.success('VIP 信息已更新')
      setModalOpen(false)
      fetchData(page)
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 70,
    },
    {
      title: '昵称',
      dataIndex: 'name',
      width: 120,
      ellipsis: true,
    },
    {
      title: '头像',
      dataIndex: 'avatar',
      width: 60,
      render: (url: string) => (
        <Avatar src={url} size={36} icon="U" />
      ),
    },
    {
      title: 'VIP',
      dataIndex: 'vip',
      width: 80,
      render: (isVip: boolean) => (
        <Tag color={isVip ? 'green' : 'default'}>{isVip ? 'VIP' : '普通'}</Tag>
      ),
    },
    {
      title: 'VIP到期',
      dataIndex: 'vipExpireAt',
      width: 170,
      render: (val: string | null) => val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '已购课程',
      dataIndex: 'boughtCourses',
      width: 90,
      align: 'center' as const,
    },
    {
      title: '已完成课时',
      dataIndex: 'finishedLessons',
      width: 100,
      align: 'center' as const,
    },
    {
      title: '学习时长',
      dataIndex: 'studyHours',
      width: 90,
      align: 'center' as const,
      render: (h: number) => <Text>{h}h</Text>,
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      width: 170,
      render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      fixed: 'right' as const,
      render: (_: unknown, record: UserItem) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => openVipModal(record)}>
            管理VIP
          </Button>
          <Button
            type="link"
            size="small"
            danger
            onClick={() => {
              Modal.confirm({
                title: '确认删除',
                content: `确定要删除用户「${record.name}」吗？此操作不可恢复。`,
                okText: '删除',
                okButtonProps: { danger: true },
                cancelText: '取消',
                onOk: async () => {
                  try {
                    await userApi.remove(record.id)
                    message.success('用户已删除')
                    fetchData(page)
                  } catch {
                    // error already shown by interceptor
                  }
                },
              })
            }}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        scroll={{ x: 1060 }}
        pagination={{
          current: page,
          pageSize: PAGE_SIZE,
          total,
          showTotal: (t) => `共 ${t} 条`,
          onChange: setPage,
        }}
      />

      <Modal
        title={modalUser ? `管理VIP - ${modalUser.name}` : '管理VIP'}
        open={modalOpen}
        onOk={handleVipSubmit}
        onCancel={() => setModalOpen(false)}
        confirmLoading={submitting}
        okText="保存"
        cancelText="取消"
      >
        <Space direction="vertical" size="middle" style={{ width: '100%', marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ whiteSpace: 'nowrap' }}>VIP状态：</span>
            <Switch checked={vipSwitch} onChange={setVipSwitch} />
            <Text type="secondary">{vipSwitch ? '开启' : '关闭'}</Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ whiteSpace: 'nowrap' }}>到期时间：</span>
            <DatePicker
              showTime
              value={vipExpireAt}
              onChange={(val) => setVipExpireAt(val)}
              placeholder="选择到期时间"
              disabled={!vipSwitch}
              style={{ flex: 1 }}
            />
          </div>
        </Space>
      </Modal>
    </>
  )
}
