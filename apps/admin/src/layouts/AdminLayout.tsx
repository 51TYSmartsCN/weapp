import { useState, useCallback } from 'react'
import { Layout, Menu, Avatar, Dropdown, Button, Breadcrumb } from 'antd'
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
  ShopOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { logout } from '../api'
import './AdminLayout.css'

const { Header, Sider, Content } = Layout

const menuItemsMap: Record<string, { label: string; icon: React.ReactNode }> = {
  '/': { label: '仪表盘', icon: <DashboardOutlined /> },
  '/courses': { label: '课程管理', icon: <BookOutlined /> },
  '/instructors': { label: '讲师管理', icon: <UserOutlined /> },
  '/lessons': { label: '课时管理', icon: <OrderedListOutlined /> },
  '/banners': { label: '轮播管理', icon: <PictureOutlined /> },
  '/categories': { label: '分类管理', icon: <AppstoreOutlined /> },
  '/users': { label: '用户管理', icon: <TeamOutlined /> },
  '/orders': { label: '订单管理', icon: <ShoppingOutlined /> },
  '/reviews': { label: '评价管理', icon: <MessageOutlined /> },
  '/feedbacks': { label: '意见反馈', icon: <BulbOutlined /> },
  '/help-articles': { label: '帮助文章', icon: <QuestionCircleOutlined /> },
  '/theme': { label: '主题设置', icon: <BgColorsOutlined /> },
  '/module-modes': { label: '模块展示模式', icon: <BlockOutlined /> },
  '/wxshop-products': { label: '小店商品映射', icon: <ShopOutlined /> },
  '/wxshop-config': { label: '小店配置', icon: <SettingOutlined /> },
}

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const handleMenuClick = useCallback(
    ({ key }: { key: string }) => {
      if (!menuItemsMap[key]) return
      if (key === location.pathname) return
      navigate(key)
    },
    [location.pathname, navigate]
  )

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

  const currentPage = menuItemsMap[location.pathname]

  return (
    <Layout className="admin-layout">
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
        width={220}
      >
        <div className="admin-logo">
          <BookOutlined style={{ fontSize: 24, color: '#0D9488' }} />
          {!collapsed && <span className="admin-logo-text">GEO 后台管理</span>}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={Object.entries(menuItemsMap).map(([key, { label, icon }]) => ({
            key,
            icon,
            label,
          }))}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 220, transition: 'margin-left 0.2s' }}>
        <Header className="admin-header">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
          />
          <Breadcrumb
            style={{ flex: 1, marginLeft: 16 }}
            items={[
              { title: '后台管理' },
              {
                title: currentPage ? (
                  <span>
                    {currentPage.icon}
                    <span style={{ marginLeft: 4 }}>{currentPage.label}</span>
                  </span>
                ) : '',
              },
            ]}
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
