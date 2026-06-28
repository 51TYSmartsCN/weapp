import { useEffect, useState } from 'react'
import { Card, Form, Radio, Input, Button, Space, message, Typography, Divider, Alert } from 'antd'
import { AppstoreOutlined } from '@ant-design/icons'
import { appConfigApi } from '../../api'

const { Title, Text } = Typography

interface ModuleDisplayModes {
  lessonPlayer: {
    contentMode: 'video' | 'text-image'
  }
  courseDetailCover: {
    mode: 'image' | 'video'
    videoUrl?: string
  }
}

const DEFAULT_MODES: ModuleDisplayModes = {
  lessonPlayer: { contentMode: 'video' },
  courseDetailCover: { mode: 'image' },
}

export default function ModuleModes() {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm<any>()
  const [coverMode, setCoverMode] = useState<'image' | 'video'>('image')

  const load = async () => {
    setLoading(true)
    try {
      const data = await appConfigApi.getModuleModes()
      // 后端返回 { value: {...} } 或直接 {...}
      const modes: ModuleDisplayModes = { ...DEFAULT_MODES, ...((data && (data as any).value) || data || {}) }
      form.setFieldsValue({
        lessonPlayerContentMode: modes.lessonPlayer.contentMode,
        courseDetailCoverMode: modes.courseDetailCover.mode,
        courseDetailCoverVideoUrl: modes.courseDetailCover.videoUrl || '',
      })
      setCoverMode(modes.courseDetailCover.mode)
    } catch {
      message.error('加载模块配置失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleSave = async () => {
    try {
      const values = form.getFieldsValue()
      const payload: ModuleDisplayModes = {
        lessonPlayer: { contentMode: values.lessonPlayerContentMode },
        courseDetailCover: {
          mode: values.courseDetailCoverMode,
          videoUrl: values.courseDetailCoverVideoUrl || '',
        },
      }
      setSaving(true)
      await appConfigApi.updateModuleModes(payload as any)
      message.success('模块展示模式已保存')
    } catch {
      message.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    form.setFieldsValue({
      lessonPlayerContentMode: DEFAULT_MODES.lessonPlayer.contentMode,
      courseDetailCoverMode: DEFAULT_MODES.courseDetailCover.mode,
      courseDetailCoverVideoUrl: '',
    })
    setCoverMode(DEFAULT_MODES.courseDetailCover.mode)
  }

  return (
    <Card loading={loading}>
      <Title level={4} style={{ marginBottom: 24 }}>
        <AppstoreOutlined style={{ marginRight: 8 }} />
        模块展示模式配置
      </Title>

      <Text type="secondary">
        控制小程序各模块的展示形式（视频/图文）。修改保存后，用户下次冷启动或切回前台时生效。
        所有环境（含审核环境）表现一致，请确保配置内容合规。
      </Text>

      <Divider />

      <Form form={form} layout="vertical" onFinish={handleSave}>
        {/* 课时播放页 */}
        <Card title="课时播放页 - 内容展示模式" size="small" style={{ marginBottom: 24, background: '#fafafa' }}>
          <Alert
            type="info"
            showIcon
            message="该配置控制「课时播放页」顶部内容区域的展示形式"
            description={
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                <li><b>视频</b>：默认模式，展示课程视频播放器（需用户已购或免费课程）</li>
                <li><b>图文教程</b>：展示课时下方的「图文教程内容」字段（在课时管理中编辑）</li>
              </ul>
            }
            style={{ marginBottom: 16 }}
          />
          <Form.Item name="lessonPlayerContentMode" label="展示模式">
            <Radio.Group>
              <Radio value="video">视频播放</Radio>
              <Radio value="text-image">图文教程</Radio>
            </Radio.Group>
          </Form.Item>
        </Card>

        {/* 课程详情页封面 */}
        <Card title="课程详情页 - 封面展示模式" size="small" style={{ marginBottom: 24, background: '#fafafa' }}>
          <Alert
            type="info"
            showIcon
            message="该配置控制「课程详情页」顶部封面的展示形式"
            description={
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                <li><b>图片</b>：默认模式，展示课程封面图</li>
                <li><b>视频预览</b>：展示下方填写的视频 URL（为空时回退到图片）</li>
              </ul>
            }
            style={{ marginBottom: 16 }}
          />
          <Form.Item name="courseDetailCoverMode" label="展示模式">
            <Radio.Group
              onChange={(e) => setCoverMode(e.target.value)}
            >
              <Radio value="image">静态封面图</Radio>
              <Radio value="video">视频预览</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item
            name="courseDetailCoverVideoUrl"
            label="封面视频 URL"
            tooltip="仅当上方选择「视频预览」时生效。为空时回退到静态封面图。"
          >
            <Input
              placeholder="例如：https://example.com/cover-preview.mp4"
              disabled={coverMode !== 'video'}
            />
          </Form.Item>
        </Card>

        <Divider />

        <Space>
          <Button type="primary" htmlType="submit" loading={saving}>
            保存配置
          </Button>
          <Button onClick={handleReset}>恢复默认</Button>
        </Space>
      </Form>
    </Card>
  )
}
