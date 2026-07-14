import { useEffect, useState } from 'react'
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Switch,
  Popconfirm,
  message,
  Tag,
  Image,
  Upload,
} from 'antd'
import { PlusOutlined, UploadOutlined } from '@ant-design/icons'
import { bannerApi } from '../../api'

const BANNER_IMAGE_MAX_SIZE_MB = 2

interface BannerItem {
  id: number
  title: string
  subtitle: string
  image: string
  linkType: string
  linkValue: string
  sort: number
  status: number
  createdAt: string
}

const linkTypeOptions = [
  { label: '无', value: 'none' },
  { label: '课程', value: 'course' },
  { label: '页面', value: 'page' },
]

const linkTypeLabelMap: Record<string, string> = {
  none: '无',
  course: '课程',
  page: '页面',
}

export default function Banners() {
  const [list, setList] = useState<BannerItem[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<BannerItem | null>(null)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [form] = Form.useForm()

  const fetchList = async () => {
    setLoading(true)
    try {
      const data = await bannerApi.getList()
      setList(data)
    } catch {
      message.error('获取轮播图列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchList()
  }, [])

  const handleAdd = () => {
    setEditingItem(null)
    form.resetFields()
    form.setFieldsValue({ sort: 0, status: 1, linkType: 'none' })
    setImageUrl('')
    setModalOpen(true)
  }

  const handleEdit = (record: BannerItem) => {
    setEditingItem(record)
    form.setFieldsValue({
      title: record.title,
      subtitle: record.subtitle,
      image: record.image,
      linkType: record.linkType,
      linkValue: record.linkValue,
      sort: record.sort,
      status: record.status === 1,
    })
    setImageUrl(record.image || '')
    setModalOpen(true)
  }

  const handleToggleStatus = async (record: BannerItem) => {
    try {
      await bannerApi.toggleStatus(record.id)
      message.success(record.status === 1 ? '已禁用' : '已启用')
      fetchList()
    } catch {
      message.error('操作失败')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await bannerApi.remove(id)
      message.success('删除成功')
      fetchList()
    } catch {
      message.error('删除失败')
    }
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()
      const payload = {
        ...values,
        status: values.status ? 1 : 0,
      }
      setConfirmLoading(true)
      if (editingItem) {
        await bannerApi.update(editingItem.id, payload)
        message.success('更新成功')
      } else {
        await bannerApi.create(payload)
        message.success('创建成功')
      }
      setModalOpen(false)
      setImageUrl('')
      fetchList()
    } catch {
      // validation error or api error
    } finally {
      setConfirmLoading(false)
    }
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 60,
    },
    {
      title: '标题',
      dataIndex: 'title',
      ellipsis: true,
    },
    {
      title: '副标题',
      dataIndex: 'subtitle',
      ellipsis: true,
    },
    {
      title: '图片',
      dataIndex: 'image',
      width: 120,
      render: (url: string) =>
        url ? (
          <Image src={url} width={120} height={40} style={{ objectFit: 'cover', borderRadius: 4 }} />
        ) : (
          '-'
        ),
    },
    {
      title: '跳转类型',
      dataIndex: 'linkType',
      width: 100,
      render: (val: string) => linkTypeLabelMap[val] || val,
    },
    {
      title: '跳转值',
      dataIndex: 'linkValue',
      ellipsis: true,
    },
    {
      title: '排序',
      dataIndex: 'sort',
      width: 80,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (val: number) =>
        val === 1 ? (
          <Tag color='green'>启用</Tag>
        ) : (
          <Tag color='default'>禁用</Tag>
        ),
    },
    {
      title: '操作',
      width: 200,
      render: (_: unknown, record: BannerItem) => (
        <Space>
          <Button type='link' size='small' onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type='link' size='small' onClick={() => handleToggleStatus(record)}>
            {record.status === 1 ? '禁用' : '启用'}
          </Button>
          <Popconfirm title='确认删除该轮播图？' onConfirm={() => handleDelete(record.id)} okText='确定' cancelText='取消'>
            <Button type='link' size='small' danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>轮播图管理</h2>
        <Button type='primary' icon={<PlusOutlined />} onClick={handleAdd}>
          新增轮播图
        </Button>
      </div>

      <Table
        rowKey='id'
        columns={columns}
        dataSource={list}
        loading={loading}
        pagination={false}
        size='middle'
      />

      <Modal
        title={editingItem ? '编辑轮播图' : '新增轮播图'}
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={() => {
          setModalOpen(false)
          setUploadingImage(false)
        }}
        confirmLoading={confirmLoading}
        destroyOnClose
        width={560}
      >
        <Form form={form} layout='vertical' autoComplete='off'>
          <Form.Item name='title' label='标题' rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder='请输入轮播图标题' />
          </Form.Item>
          <Form.Item name='subtitle' label='副标题'>
            <Input placeholder='请输入副标题' />
          </Form.Item>
          <Form.Item label='图片'>
            <Space direction='vertical' style={{ width: '100%' }} size={12}>
              <Upload
                accept='image/png,image/jpeg'
                showUploadList={false}
                beforeUpload={(file) => {
                  const isAllowedType = ['image/png', 'image/jpeg'].includes(file.type)
                  if (!isAllowedType) {
                    message.error('仅支持 JPG/PNG 格式')
                    return Upload.LIST_IGNORE
                  }

                  const isAllowedSize = file.size / 1024 / 1024 <= BANNER_IMAGE_MAX_SIZE_MB
                  if (!isAllowedSize) {
                    message.error(`Banner 图片大小不能超过 ${BANNER_IMAGE_MAX_SIZE_MB}MB`)
                    return Upload.LIST_IGNORE
                  }

                  return true
                }}
                customRequest={async (options) => {
                  const { file, onSuccess, onError } = options
                  setUploadingImage(true)
                  try {
                    const { url } = await bannerApi.uploadImage(file as File)
                    form.setFieldValue('image', url)
                    setImageUrl(url)
                    message.success('Banner 图片上传成功')
                    onSuccess?.({ url })
                  } catch (err) {
                    message.error('Banner 图片上传失败')
                    onError?.(err as Error)
                  } finally {
                    setUploadingImage(false)
                  }
                }}
              >
                <Button icon={<UploadOutlined />} loading={uploadingImage}>
                  上传 Banner 图片
                </Button>
              </Upload>
              {imageUrl ? (
                <Image src={imageUrl} width={200} height={80} style={{ objectFit: 'cover', borderRadius: 8 }} />
              ) : null}
              <Form.Item name='image' rules={[{ required: true, message: '请上传图片或填写图片地址' }]} style={{ marginBottom: 0 }}>
                <Input
                  placeholder='仅支持 JPG/PNG，最大 2MB；上传后会自动回填，也可手动输入图片地址'
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </Form.Item>
            </Space>
          </Form.Item>
          <Form.Item name='linkType' label='跳转类型'>
            <Select options={linkTypeOptions} />
          </Form.Item>
          <Form.Item name='linkValue' label='跳转值'>
            <Input placeholder='请输入跳转值' />
          </Form.Item>
          <Form.Item name='sort' label='排序'>
            <InputNumber min={0} style={{ width: '100%' }} placeholder='数值越小越靠前' />
          </Form.Item>
          <Form.Item name='status' label='状态' valuePropName='checked'>
            <Switch checkedChildren='启用' unCheckedChildren='禁用' />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
