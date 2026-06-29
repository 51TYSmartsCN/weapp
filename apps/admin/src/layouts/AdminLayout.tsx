import { useState, useCallback, useEffect } from 'react'
import { Layout, Menu, Avatar, Dropdown, Button, Tabs, Breadcrumb } from 'antd'
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
} from '@ant-design/icons'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { logout } from '../api'
import './AdminLayout.css'

const { Header, Sider, Content } = Layout

interface TabItem {
  key: string
  label: string
  icon: React.ReactNode
}

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
}

const tabBarStyle: React.CSSProperties = {
  background: '#fff',
  margin: '0 -24px',
  padding: '0 16px',
  borderBottom: '1px solid #f0f0f0',
}

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [tabs, setTabs] = useState<TabItem[]>([{ key: '/', ...menuItemsMap['/'] }])
  const [activeTab, setActiveTab] = useState('/')
  const navigate = useNavigate()
  const location = useLocation()

  // 同步路由变化
  useEffect(() => {
    const path = location.pathname
    const existing = tabs.find((t) => t.key === path)
    if (existing) {
      setActiveTab(path)
    } else if (menuItemsMap[path]) {
      // 新页面：添加 tab
      setTabs((prev) => [...prev, { key: path, ...menuItemsMap[path] }])
      setActiveTab(path)
    }
  }, [location.pathname])

  const handleTabChange = useCallback(
    (key: string) => {
      setActiveTab(key)
      navigate(key)
    },
    [navigate]
  )

  const handleTabEdit = useCallback(
    (targetKey: string, action: 'add' | 'remove') => {
      if (action === 'remove') {
        // 至少保留一个 tab
        if (tabs.length <= 1) return

        const targetIndex = tabs.findIndex((t) => t.key === targetKey)
        const newTabs = tabs.filter((t) => t.key !== targetKey)
        setTabs(newTabs)

        // 如果关闭的是当前激活的 tab，切换到相邻的
        if (activeTab === targetKey) {
          const nextTab = newTabs[Math.min(targetIndex, newTabs.length - 1)]
          const nextKey = nextTab?.key || '/'
          setActiveTab(nextKey)
          navigate(nextKey)
        }
      }
    },
    [tabs, activeTab, navigate]
  )

  const handleMenuClick = useCallback(
    ({ key }: { key: string }) => {
      if (key === activeTab) return
      const existing = tabs.find((t) => t.key === key)
      if (!existing && menuItemsMap[key]) {
        setTabs((prev) => [...prev, { key, ...menuItemsMap[key] }])
      }
      setActiveTab(key)
      navigate(key)
    },
    [tabs, activeTab, navigate]
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

  const tabItems = tabs.map((tab) => ({
    key: tab.key,
    label: (
      <span>
        {tab.icon}
        <span style={{ marginLeft: 6 }}>{tab.label}</span>
      </span>
    ),
  }))

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
          <Breadcrumb style={{ flex: 1, marginLeft: 16 }}>
            <Breadcrumb.Item>后台管理</Breadcrumb.Item>
            <Breadcrumb.Item>
              {menuItemsMap[location.pathname]?.icon}
              <span style={{ marginLeft: 4 }}>{menuItemsMap[location.pathname]?.label}</span>
            </Breadcrumb.Item>
          </Breadcrumb>
          <Dropdown menu={dropdownItems} placement="bottomRight">
            <div className="admin-header-user">
              <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: '#0D9488' }} />
              <span style={{ marginLeft: 8 }}>管理员</span>
            </div>
          </Dropdown>
        </Header>
        <Content className="admin-content">
          <Tabs
            activeKey={activeTab}
            onChange={handleTabChange}
            onEdit={handleTabEdit as any}
            type="editable-card"
            hideAdd
            style={tabBarStyle}
            items={tabItems}
          />
          <div style={{ padding: '16px 0' }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}
