import React from 'react'
import { Card, Row, Col, Statistic, Spin, Typography, Space } from 'antd'
import {
  BookOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  DollarOutlined,
  CalendarOutlined,
  RiseOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { dashboardApi } from '../../api'

const { Text } = Typography

interface DashboardStats {
  totalCourses: number
  totalUsers: number
  totalOrders: number
  totalInstructors: number
  totalRevenue: number
  todayOrders: number
  revenueTrend: { date: string; revenue: number }[]
  orderTrend: { date: string; orders: number }[]
  topCourses: { id: number; title: string; orderCount: number }[]
  userTrend: { date: string; users: number }[]
}

const statCards: {
  title: string
  dataIndex: 'totalCourses' | 'totalUsers' | 'totalOrders' | 'totalInstructors' | 'totalRevenue' | 'todayOrders'
  icon: React.ReactNode
  prefix?: string
  suffix?: string
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

const CHART_COLORS = {
  primary: '#0D9488',
  primaryLight: '#14B8A6',
  primaryLighter: '#99F6E4',
  secondary: '#6366F1',
  secondaryLight: '#818CF8',
}

function formatDate(dateStr: string) {
  return dayjs(dateStr).format('MM-DD')
}

function formatFullDate(dateStr: string) {
  return dayjs(dateStr).format('YYYY-MM-DD')
}

export default function Dashboard() {
  const [loading, setLoading] = React.useState(true)
  const [stats, setStats] = React.useState<DashboardStats | null>(null)
  const [updatedAt, setUpdatedAt] = React.useState(dayjs())

  React.useEffect(() => {
    dashboardApi
      .getStats()
      .then((data) => {
        setStats(data as DashboardStats)
        setUpdatedAt(dayjs())
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  return (
    <Spin spinning={loading}>
      {/* 统计卡片 */}
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
                suffix={card.suffix}
                valueStyle={{ color: '#0D9488', fontWeight: 600 }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* 图表区域 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {/* 收入趋势 */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <RiseOutlined style={{ color: CHART_COLORS.primary }} />
                <span>近 7 天收入趋势</span>
              </Space>
            }
          >
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={stats?.revenueTrend ?? []}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tick={{ fontSize: 12 }}
                  stroke="#94A3B8"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  stroke="#94A3B8"
                  tickFormatter={(v) => `¥${v}`}
                />
                <Tooltip
                  formatter={(value) => [`¥${value}`, '收入']}
                  labelFormatter={(label) => formatFullDate(label as string)}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke={CHART_COLORS.primary}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* 订单趋势 */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <CalendarOutlined style={{ color: CHART_COLORS.secondary }} />
                <span>近 7 天订单趋势</span>
              </Space>
            }
          >
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats?.orderTrend ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tick={{ fontSize: 12 }}
                  stroke="#94A3B8"
                />
                <YAxis tick={{ fontSize: 12 }} stroke="#94A3B8" />
                <Tooltip
                  formatter={(value) => [value, '订单数']}
                  labelFormatter={(label) => formatFullDate(label as string)}
                />
                <Bar dataKey="orders" fill={CHART_COLORS.secondary} radius={[4, 4, 0, 0]}>
                  {(stats?.orderTrend ?? []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS.secondary} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {/* 用户增长趋势 */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <UserOutlined style={{ color: '#10B981' }} />
                <span>近 7 天用户增长</span>
              </Space>
            }
          >
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={stats?.userTrend ?? []}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tick={{ fontSize: 12 }}
                  stroke="#94A3B8"
                />
                <YAxis tick={{ fontSize: 12 }} stroke="#94A3B8" />
                <Tooltip
                  formatter={(value) => [value, '新增用户']}
                  labelFormatter={(label) => formatFullDate(label as string)}
                />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke="#10B981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorUsers)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* 课程销量排行 */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <BookOutlined style={{ color: '#F59E0B' }} />
                <span>课程销量排行 TOP 5</span>
              </Space>
            }
          >
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats?.topCourses ?? []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94A3B8" />
                <YAxis
                  type="category"
                  dataKey="title"
                  tick={{ fontSize: 12 }}
                  width={120}
                  stroke="#94A3B8"
                  tickFormatter={(value) =>
                    value.length > 10 ? `${value.slice(0, 10)}...` : value
                  }
                />
                <Tooltip
                  formatter={(value) => [value, '销量']}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.title ?? ''}
                />
                <Bar dataKey="orderCount" fill="#F59E0B" radius={[0, 4, 4, 0]}>
                  {(stats?.topCourses ?? []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill="#F59E0B" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <div style={{ marginTop: 16, textAlign: 'right' }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          最后更新：{updatedAt.format('YYYY-MM-DD HH:mm:ss')}
        </Text>
      </div>
    </Spin>
  )
}
