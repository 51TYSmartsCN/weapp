import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { App as AntApp } from 'antd'
import { getToken } from './api'
import AdminLayout from './layouts/AdminLayout'
import LoginPage from './pages/login'
import Dashboard from './pages/dashboard'
import Courses from './pages/courses'
import Instructors from './pages/instructors'
import Lessons from './pages/lessons'
import Banners from './pages/banners'
import Categories from './pages/categories'
import Users from './pages/users'
import Orders from './pages/orders'
import Reviews from './pages/reviews'
import Feedbacks from './pages/feedbacks'
import HelpArticles from './pages/help-articles'
import Theme from './pages/theme'
import ModuleModes from './pages/module-modes'
import WxshopProducts from './pages/wxshop-products'

const adminBasePath = import.meta.env.BASE_URL.endsWith('/')
  ? import.meta.env.BASE_URL.slice(0, -1)
  : import.meta.env.BASE_URL

/** 路由守卫：未登录则跳转登录页 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!getToken()) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter basename={adminBasePath}>
      <AntApp>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="courses" element={<Courses />} />
            <Route path="instructors" element={<Instructors />} />
            <Route path="lessons" element={<Lessons />} />
            <Route path="banners" element={<Banners />} />
            <Route path="categories" element={<Categories />} />
            <Route path="users" element={<Users />} />
            <Route path="orders" element={<Orders />} />
            <Route path="reviews" element={<Reviews />} />
            <Route path="feedbacks" element={<Feedbacks />} />
            <Route path="help-articles" element={<HelpArticles />} />
            <Route path="theme" element={<Theme />} />
            <Route path="module-modes" element={<ModuleModes />} />
            <Route path="wxshop-products" element={<WxshopProducts />} />
          </Route>
        </Routes>
      </AntApp>
    </BrowserRouter>
  )
}
