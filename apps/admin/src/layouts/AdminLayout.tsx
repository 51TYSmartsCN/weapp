import { useState } from 'react'
import { Layout, Menu, Avatar, Dropdown, Button } from 'antd'
import {
  DashboardOutlined,
  BookOutlined,
  UserOutlined,
  OrderedListOutlined,
  PictureOutlined,
  AppstoreOutlined,
  TeamOutlined,
  ShoppingOutlined,
  MessageOutlined,
  BulbOutlined,
  QuestionCircleOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BgColorsOutlined,
  BlockOutlined,
} from '@ant-design/icons'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { logout } from '../api'
import './AdminLayout.css'

const { Header, Sider, Content } = Layout

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '仪表盘' },
  { key: '/courses', icon: <BookOutlined />, label: '课程管理' },
  { key: '/instructors', icon: <UserOutlined />, label: '讲师管理' },
  { key: '/lessons', icon: <OrderedListOutlined />, label: '课时管理' },
  { key: '/banners', icon: <PictureOutlined />, label: '轮播管理' },
  { key: '/categories', icon: <AppstoreOutlined />, label: '分类管理' },
  { key: '/users', icon: <TeamOutlined />, label: '用户管理' },
  { key: '/orders', icon: <ShoppingOutlined />, label: '订单管理' },
  { key: '/reviews', icon: <MessageOutlined />, label: '评价管理' },
  { key: '/feedbacks', icon: <BulbOutlined />, label: '意见反馈' },
  { key: '/help-articles', icon: <QuestionCircleOutlined />, label: '帮助文章' },
  { key: '/theme', icon: <BgColorsOutlined />, label: '主题设置' },
  { key: '/module-modes', icon: <BlockOutlined />, label: '模块展示模式' },
]

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const dropdownItems = {
    items: [{ key: 'logout', icon: <LogoutOutlined />, label: '退出登录' }],
    onClick: ({ key }: { key: string }) => {
      if (key === 'logout') handleLogout()
    },
  }

  return (
    <Layout className="admin-layout">
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
        width={220}
        style={{ overflow: 'auto', height: '100vh', position: 'fixed', left: 0, top: 0, bottom: 0 }}
      >
        <div className="admin-logo">
          <BookOutlined style={{ fontSize: 24, color: '#0D9488' }} />
          {!collapsed && <span className="admin-logo-text">GEO 后台管理</span>}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 220, transition: 'margin-left 0.2s' }}>
        <Header className="admin-header">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
          />
          <Dropdown menu={dropdownItems} placement="bottomRight">
            <div className="admin-header-user">
              <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: '#0D9488' }} />
              <span style={{ marginLeft: 8 }}>管理员</span>
            </div>
          </Dropdown>
        </Header>
        <Content className="admin-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
