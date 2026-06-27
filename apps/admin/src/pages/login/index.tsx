import { useState } from 'react'
import { Form, Input, Button, Card, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { login } from '../../api'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const onFinish = async (values: { username: string; password: string }) => {
    try {
      setLoading(true)
      await login(values.username, values.password)
      message.success('登录成功')
      navigate('/', { replace: true })
    } catch {
      message.error('用户名或密码错误')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #f0fdfa 0%, #e6fffa 50%, #f0fdfa 100%)',
    }}>
      <Card
        title="GEO 后台管理系统"
        style={{ width: 400, borderRadius: 8 }}
        styles={{ header: { textAlign: 'center', fontSize: 20, fontWeight: 600 } }}
      >
        <Form
          initialValues={{ username: 'admin', password: 'admin123' }}
          onFinish={onFinish}
          size="large"
        >
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{ background: '#0D9488', borderColor: '#0D9488' }}
            >
              登 录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
