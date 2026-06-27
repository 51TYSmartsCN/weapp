import React from 'react'
import { Card, Row, Col, Statistic, Spin, Typography } from 'antd'
import {
  BookOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  DollarOutlined,
  CalendarOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { dashboardApi } from '../../api'

const { Text } = Typography

interface DashboardStats {
  totalCourses: number
  totalUsers: number
  totalOrders: number
  totalInstructors: number
  totalRevenue: number
  todayOrders: number
}

const statCards: {
  title: string
  dataIndex: keyof DashboardStats
  icon: React.ReactNode
  prefix?: string
}[] = [
  { title: '总课程数', dataIndex: 'totalCourses', icon: <BookOutlined /> },
  { title: '总用户数', dataIndex: 'totalUsers', icon: <UserOutlined /> },
  { title: '总订单数', dataIndex: 'totalOrders', icon: <ShoppingCartOutlined /> },
  { title: '总讲师数', dataIndex: 'totalInstructors', icon: <TeamOutlined /> },
  {
    title: '总收入',
    dataIndex: 'totalRevenue',
    icon: <DollarOutlined />,
    prefix: '¥',
  },
  { title: '今日订单', dataIndex: 'todayOrders', icon: <CalendarOutlined /> },
]

export default function Dashboard() {
  const [loading, setLoading] = React.useState(true)
  const [stats, setStats] = React.useState<DashboardStats | null>(null)
  const [updatedAt, setUpdatedAt] = React.useState(dayjs())

  React.useEffect(() => {
    dashboardApi
      .getStats()
      .then((data) => {
        setStats(data)
        setUpdatedAt(dayjs())
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  return (
    <div>
      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          {statCards.map((card) => (
            <Col xs={24} sm={12} md={8} lg={4} key={card.dataIndex}>
              <Card hoverable>
                <Statistic
                  title={
                    <Text type="secondary" style={{ fontSize: 14 }}>
                      {card.icon} {card.title}
                    </Text>
                  }
                  value={stats?.[card.dataIndex] ?? 0}
                  prefix={card.prefix}
                  valueStyle={{ color: '#0D9488', fontWeight: 600 }}
                />
              </Card>
            </Col>
          ))}
        </Row>

        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            最后更新：{updatedAt.format('YYYY-MM-DD HH:mm:ss')}
          </Text>
        </div>
      </Spin>
    </div>
  )
}
