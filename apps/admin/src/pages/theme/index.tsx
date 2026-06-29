import { useEffect, useState } from 'react'
import { Card, Form, Button, ColorPicker, Space, message, Typography, Divider, Upload, Input } from 'antd'
import type { Color } from 'antd/es/color-picker'
import { UploadOutlined } from '@ant-design/icons'
import { appConfigApi } from '../../api'

const { Title, Text } = Typography

interface TabItem {
  text: string
  iconUrl: string
  activeIconUrl: string
}

interface ThemeColors {
  primary: string
  primaryLight: string
  primaryLighter: string
  primaryLightest: string
  primaryDark: string
  primaryDarker: string
  tabBarSelectedColor: string
  tabBarColor: string
  tabBarBgColor: string
  tabItems: TabItem[]
}

interface AppInfo {
  appName: string
  appLogo?: string
  appDescription?: string
}

const colorLabels: Record<string, string> = {
  primary: '主色',
  primaryLight: '浅主色',
  primaryLighter: '更浅主色',
  primaryLightest: '最浅主色',
  primaryDark: '深主色',
  primaryDarker: '更深主色',
  tabBarSelectedColor: 'TabBar 选中色',
  tabBarColor: 'TabBar 未选中色',
  tabBarBgColor: 'TabBar 背景色',
}

const defaultColors: ThemeColors = {
  primary: '#6366F1',
  primaryLight: '#818CF8',
  primaryLighter: '#C7D2FE',
  primaryLightest: '#EEF2FF',
  primaryDark: '#4F46E5',
  primaryDarker: '#4338CA',
  tabBarSelectedColor: '#6366F1',
  tabBarColor: '#94A3B8',
  tabBarBgColor: '#FFFFFF',
  tabItems: [
    { text: '首页', iconUrl: '', activeIconUrl: '' },
    { text: '课程', iconUrl: '', activeIconUrl: '' },
    { text: '学习', iconUrl: '', activeIconUrl: '' },
    { text: '我的', iconUrl: '', activeIconUrl: '' },
  ],
}

const defaultAppInfo: AppInfo = {
  appName: 'GEO 课程',
  appDescription: '专注 GEO 领域的实战学习平台',
}

// 主题色字段
const themeColorKeys = ['primary', 'primaryLight', 'primaryLighter', 'primaryLightest', 'primaryDark', 'primaryDarker']
// TabBar 颜色字段
const tabBarColorKeys = ['tabBarSelectedColor', 'tabBarColor', 'tabBarBgColor']

export default function ThemeConfig() {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm<any>()
  const [colors, setColors] = useState<ThemeColors>(defaultColors)
  const [tabItems, setTabItems] = useState<TabItem[]>(defaultColors.tabItems)
  const [uploadingIndex, setUploadingIndex] = useState<string>('')

  // 应用信息（名称、描述、Logo）
  const [appInfo, setAppInfo] = useState<AppInfo>(defaultAppInfo)
  const [savingAppInfo, setSavingAppInfo] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  // 加载主题配置
  const loadTheme = async () => {
    setLoading(true)
    try {
      const data = await appConfigApi.getTheme()
      const themeData: ThemeColors = { ...defaultColors, ...((data && (data as any).value) || data || {}) }
      themeData.tabItems = (themeData.tabItems && themeData.tabItems.length === 4)
        ? themeData.tabItems
        : defaultColors.tabItems
      setColors(themeData)
      setTabItems(themeData.tabItems)
      form.setFieldsValue(themeData)
    } catch {
      message.error('加载主题配置失败')
    } finally {
      setLoading(false)
    }
  }

  // 加载应用信息
  const loadAppInfo = async () => {
    try {
      const data = await appConfigApi.getAppInfo()
      const info: AppInfo = { ...defaultAppInfo, ...((data && (data as any).value) || data || {}) }
      setAppInfo(info)
    } catch {
      // 忽略，使用默认值
    }
  }

  // 保存应用信息
  const handleSaveAppInfo = async () => {
    if (!appInfo.appName.trim()) {
      message.error('应用名称不能为空')
      return
    }
    setSavingAppInfo(true)
    try {
      await appConfigApi.updateAppInfo(appInfo)
      message.success('应用信息已保存')
    } catch {
      message.error('保存失败')
    } finally {
      setSavingAppInfo(false)
    }
  }

  // 上传 Logo
  const handleUploadLogo = async (file: File) => {
    setUploadingLogo(true)
    try {
      const { url } = await appConfigApi.uploadLogo(file)
      setAppInfo((prev) => ({ ...prev, appLogo: url }))
      message.success('Logo 上传成功，请点击保存应用信息生效')
    } catch {
      message.error('Logo 上传失败')
    } finally {
      setUploadingLogo(false)
    }
    return false
  }

  useEffect(() => {
    loadTheme()
    loadAppInfo()
  }, [])

  // 保存主题配置
  const handleSave = async () => {
    try {
      const values = form.getFieldsValue()
      values.tabItems = tabItems
      setSaving(true)
      await appConfigApi.updateTheme(values)
      setColors(values)
      message.success('主题配置已保存')
    } catch {
      message.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  // 重置为默认蓝紫色
  const handleReset = () => {
    form.setFieldsValue(defaultColors)
    setColors(defaultColors)
    setTabItems(defaultColors.tabItems)
  }

  // 颜色变化时更新预览
  const handleColorChange = (key: string, color: Color) => {
    const hex = color.toHexString()
    setColors((prev) => ({ ...prev, [key]: hex }))
  }

  // 上传图标
  const handleUpload = async (index: number, state: 'normal' | 'active', file: File) => {
    const key = `${index}-${state}`
    setUploadingIndex(key)
    try {
      const { url } = await appConfigApi.uploadTabIcon(index, state, file)
      const newItems = [...tabItems]
      if (state === 'normal') {
        newItems[index] = { ...newItems[index], iconUrl: url }
      } else {
        newItems[index] = { ...newItems[index], activeIconUrl: url }
      }
      setTabItems(newItems)
      message.success('图标上传成功，请点击保存配置生效')
    } catch {
      message.error('图标上传失败')
    } finally {
      setUploadingIndex('')
    }
    return false // 阻止 antd Upload 自动上传
  }

  // 修改 tab 文字
  const handleTabTextChange = (index: number, text: string) => {
    const newItems = [...tabItems]
    newItems[index] = { ...newItems[index], text }
    setTabItems(newItems)
  }

  const renderColorPicker = (key: string) => (
    <Form.Item
      key={key}
      name={key}
      label={colorLabels[key]}
      style={{ marginBottom: 16 }}
      getValueFromEvent={(color: Color) => color.toHexString()}
    >
      <ColorPicker
        showText
        format="hex"
        onChange={(color: Color) => handleColorChange(key, color)}
        presets={[
          { label: '推荐蓝紫色', colors: ['#6366F1', '#818CF8', '#C7D2FE', '#EEF2FF', '#4F46E5', '#4338CA'] },
          { label: '原青绿色', colors: ['#0D9488', '#14B8A6', '#99F6E4', '#F0FDFA', '#0F766E', '#115E59'] },
          { label: 'TabBar 常用', colors: ['#6366F1', '#94A3B8', '#FFFFFF', '#0D9488', '#000000', '#F8FAFC'] },
        ]}
      />
    </Form.Item>
  )

  return (
    <Card loading={loading}>
      <Title level={4} style={{ marginBottom: 24 }}>主题配置</Title>

      <Text type="secondary">
        在此配置小程序的主题色、底部 TabBar 颜色与图标，修改保存后将同步到小程序端生效。
      </Text>

      <Divider />

      {/* 应用信息配置 */}
      <Card title="应用信息" size="small" style={{ marginBottom: 24, background: '#fafafa' }}>
        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          配置小程序的应用名称、描述与 Logo，修改保存后将同步到登录页等位置生效。
        </Text>
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 24, alignItems: 'start' }}>
          {/* Logo 上传 */}
          <div>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>应用 Logo</Text>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              {appInfo.appLogo ? (
                <img src={appInfo.appLogo} alt="logo" style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '1px solid #e2e8f0' }} />
              ) : (
                <div style={{ width: 100, height: 100, borderRadius: '50%', border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)' }}>
                  <Text style={{ color: '#fff', fontSize: 32 }}>GEO</Text>
                </div>
              )}
              <Upload
                accept="image/png,image/jpeg"
                showUploadList={false}
                beforeUpload={(file) => handleUploadLogo(file)}
              >
                <Button size="small" icon={<UploadOutlined />} loading={uploadingLogo}>
                  上传 Logo
                </Button>
              </Upload>
            </div>
          </div>
          {/* 名称与描述 */}
          <div>
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>应用名称</Text>
              <Input
                value={appInfo.appName}
                onChange={(e) => setAppInfo((prev) => ({ ...prev, appName: e.target.value }))}
                placeholder="如：GEO 课程"
                maxLength={20}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>应用描述</Text>
              <Input.TextArea
                value={appInfo.appDescription || ''}
                onChange={(e) => setAppInfo((prev) => ({ ...prev, appDescription: e.target.value }))}
                placeholder="如：专注 GEO 领域的实战学习平台"
                rows={3}
                maxLength={100}
                showCount
              />
            </div>
            <Button type="primary" onClick={handleSaveAppInfo} loading={savingAppInfo}>
              保存应用信息
            </Button>
          </div>
        </div>
      </Card>

      {/* 主题色预览区 */}
      <Card title="主题色预览" size="small" style={{ marginBottom: 24, background: '#fafafa' }}>
        <Space wrap>
          {themeColorKeys.map((key) => (
            <div key={key} style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: 60, height: 60, borderRadius: 8,
                  background: (colors as any)[key], marginBottom: 8,
                  border: key === 'primaryLightest' ? '1px solid #e2e8f0' : 'none',
                }}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>{colorLabels[key]}</Text>
            </div>
          ))}
        </Space>
      </Card>

      {/* TabBar 预览区 */}
      <Card title="TabBar 预览" size="small" style={{ marginBottom: 24, background: '#fafafa' }}>
        <div
          style={{
            display: 'flex', justifyContent: 'space-around', alignItems: 'center',
            padding: '12px 0', background: colors.tabBarBgColor,
            borderRadius: 8, boxShadow: '0 -1px 4px rgba(0,0,0,0.06) inset',
          }}
        >
          {tabItems.map((item, idx) => (
            <div key={idx} style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4, height: 24 }}>
                {item.iconUrl ? (
                  <img src={item.iconUrl} alt="" style={{ width: 24, height: 24, opacity: idx === 0 ? 0.5 : 1 }} />
                ) : (
                  <div style={{
                    width: 24, height: 24, borderRadius: 6,
                    background: colors.tabBarColor, opacity: 0.5,
                  }} />
                )}
              </div>
              <span style={{
                fontSize: 12,
                color: idx === 0 ? colors.tabBarSelectedColor : colors.tabBarColor,
                fontWeight: idx === 0 ? 600 : 400,
              }}>
                {item.text || `Tab${idx + 1}`}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* 颜色配置表单 */}
      <Form form={form} layout="vertical" onFinish={handleSave}>
        <Divider plain>主题色</Divider>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {themeColorKeys.map(renderColorPicker)}
        </div>

        <Divider plain>TabBar 颜色</Divider>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {tabBarColorKeys.map(renderColorPicker)}
        </div>

        <Divider plain>TabBar 图标配置</Divider>
        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          建议使用 81×81px 的 PNG 透明背景图标，单文件不超过 40kb。上传后需点击底部"保存配置"才会生效。
        </Text>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
          {tabItems.map((item, index) => (
            <Card key={index} size="small" title={`Tab ${index + 1}`} style={{ background: '#fafafa' }}>
              <Form.Item label="文字" style={{ marginBottom: 12 }}>
                <Input
                  value={item.text}
                  onChange={(e) => handleTabTextChange(index, e.target.value)}
                  placeholder={`如：首页`}
                />
              </Form.Item>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>默认图标</Text>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {item.iconUrl ? (
                      <img src={item.iconUrl} alt="" style={{ width: 40, height: 40, border: '1px solid #e2e8f0', borderRadius: 4 }} />
                    ) : (
                      <div style={{ width: 40, height: 40, border: '1px dashed #cbd5e1', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Text type="secondary" style={{ fontSize: 10 }}>无</Text>
                      </div>
                    )}
                    <Upload
                      accept="image/png,image/jpeg"
                      showUploadList={false}
                      beforeUpload={(file) => handleUpload(index, 'normal', file)}
                    >
                      <Button size="small" icon={<UploadOutlined />} loading={uploadingIndex === `${index}-normal`}>
                        上传
                      </Button>
                    </Upload>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>选中图标</Text>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {item.activeIconUrl ? (
                      <img src={item.activeIconUrl} alt="" style={{ width: 40, height: 40, border: '1px solid #e2e8f0', borderRadius: 4 }} />
                    ) : (
                      <div style={{ width: 40, height: 40, border: '1px dashed #cbd5e1', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Text type="secondary" style={{ fontSize: 10 }}>无</Text>
                      </div>
                    )}
                    <Upload
                      accept="image/png,image/jpeg"
                      showUploadList={false}
                      beforeUpload={(file) => handleUpload(index, 'active', file)}
                    >
                      <Button size="small" icon={<UploadOutlined />} loading={uploadingIndex === `${index}-active`}>
                        上传
                      </Button>
                    </Upload>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Divider />

        <Space>
          <Button type="primary" htmlType="submit" loading={saving}>
            保存配置
          </Button>
          <Button onClick={handleReset}>重置为默认蓝紫色</Button>
        </Space>
      </Form>
    </Card>
  )
}
