import { useEffect, useState } from 'react'
import {
  Card,
  Form,
  Input,
  Button,
  message,
  Space,
  Descriptions,
  Alert,
} from 'antd'
import { SaveOutlined, ShopOutlined } from '@ant-design/icons'
import { appConfigApi } from '../../api'

interface WxshopConfigForm {
  appid: string
  shopName: string
  productPath: string
}

export default function WxshopConfig() {
  const [form] = Form.useForm<WxshopConfigForm>()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<WxshopConfigForm | null>(null)

  const loadConfig = async () => {
    setLoading(true)
    try {
      const res = await appConfigApi.getWxshopConfig()
      const data = res?.value || {}
      setConfig(data)
      form.setFieldsValue({
        appid: data.appid || '',
        shopName: data.shopName || '微信小店',
        productPath: data.productPath || '/pages/product/detail/index',
      })
    } catch {
      // 配置不存在或加载失败，使用默认值
      const defaults: WxshopConfigForm = {
        appid: '',
        shopName: '微信小店',
        productPath: '/pages/product/detail/index',
      }
      setConfig(defaults)
      form.setFieldsValue(defaults)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConfig()
  }, [])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setSaving(true)
      await appConfigApi.updateWxshopConfig(values)
      message.success('保存成功')
      setConfig(values)
    } catch (err: any) {
      if (err?.message) {
        // form validation error
      } else {
        message.error('保存失败')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <Card
        title={
          <Space>
            <ShopOutlined />
            <span>微信小店配置</span>
          </Space>
        }
        loading={loading}
      >
        {config && !config.appid && (
          <Alert
            type="warning"
            showIcon
            message="尚未配置小店 AppID"
            description="配置后小程序端的「去微信小店购买」按钮才能正常跳转。"
            style={{ marginBottom: 24 }}
          />
        )}

        <Form
          form={form}
          layout="vertical"
          style={{ maxWidth: 560 }}
        >
          <Form.Item
            label="小店 AppID"
            name="appid"
            rules={[{ required: true, message: '请输入微信小店的 AppID' }]}
            extra="微信小店或视频号小店的 AppID，用于小程序跳转"
          >
            <Input placeholder="wxxxxxxxxxxxxxxxx" />
          </Form.Item>

          <Form.Item
            label="小店名称"
            name="shopName"
            extra="显示在小程序端的小店名称（选填）"
          >
            <Input placeholder="微信小店" />
          </Form.Item>

          <Form.Item
            label="商品详情页路径"
            name="productPath"
            extra="微信小店商品详情页的路径，默认 /pages/product/detail/index"
          >
            <Input placeholder="/pages/product/detail/index" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSubmit}
                loading={saving}
              >
                保存配置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card title="配置说明" style={{ marginTop: 16 }}>
        <Descriptions column={1} size="small">
          <Descriptions.Item label="AppID">
            微信小店的原始 ID，在微信公众平台或视频号助手后台可查看。
          </Descriptions.Item>
          <Descriptions.Item label="商品路径">
            跳转微信小店时打开的页面路径，productId 参数会自动追加。
          </Descriptions.Item>
          <Descriptions.Item label="生效范围">
            保存后立即生效，小程序端进入课程详情页时会读取此配置。
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  )
}
