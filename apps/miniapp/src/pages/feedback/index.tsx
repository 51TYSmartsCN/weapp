import { useState } from 'react'
import { View, Text, ScrollView, Input, Textarea } from '@tarojs/components'
import Taro from '@tarojs/taro'
import NavBar from '../../components/NavBar'
import { createFeedback, showApiError } from '../../services'
import './index.scss'

const FEEDBACK_TYPES = ['功能建议', '问题反馈', '内容错误', '其他']
const MAX_LENGTH = 500
const MIN_LENGTH = 10

export default function Feedback() {
  const [type, setType] = useState(FEEDBACK_TYPES[0])
  const [content, setContent] = useState('')
  const [contact, setContact] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = () => {
    if (submitting) return
    if (content.trim().length < MIN_LENGTH) {
      Taro.showToast({ title: '反馈内容至少 10 个字', icon: 'none' })
      return
    }
    setSubmitting(true)
    createFeedback({
      type,
      content: content.trim(),
      contact: contact.trim() || undefined,
    })
      .then(() => {
        Taro.showToast({ title: '提交成功，感谢反馈', icon: 'success' })
        setTimeout(() => {
          Taro.navigateBack()
        }, 1500)
      })
      .catch((err) => showApiError(err, '提交失败'))
      .finally(() => setSubmitting(false))
  }

  return (
    <View className='feedback-page'>
      <NavBar title='意见反馈' />
      <ScrollView className='feedback-body' scrollY>
        {/* 类型 */}
        <View className='feedback-section'>
          <Text className='feedback-label'>类型</Text>
          <View className='feedback-pills'>
            {FEEDBACK_TYPES.map((t) => (
              <View
                key={t}
                className={`feedback-pill ${type === t ? 'feedback-pill--active' : ''}`}
                onClick={() => setType(t)}
              >
                <Text className='feedback-pill-text'>{t}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 内容 */}
        <View className='feedback-section'>
          <View className='feedback-label-row'>
            <Text className='feedback-label'>内容</Text>
            <Text className='feedback-counter'>{content.length}/{MAX_LENGTH}</Text>
          </View>
          <View className='feedback-textarea-wrap'>
            <Textarea
              className='feedback-textarea'
              value={content}
              placeholder='请详细描述你的反馈（至少 10 个字）'
              maxlength={MAX_LENGTH}
              onInput={(e) => setContent(e.detail.value)}
              placeholderClass='feedback-placeholder'
            />
          </View>
        </View>

        {/* 联系方式 */}
        <View className='feedback-section'>
          <Text className='feedback-label'>联系方式</Text>
          <View className='feedback-input-wrap'>
            <Input
              className='feedback-input'
              value={contact}
              placeholder='选填，方便我们联系你（手机/邮箱）'
              onInput={(e) => setContact(e.detail.value)}
              placeholderClass='feedback-placeholder'
            />
          </View>
        </View>

        {/* 提交按钮 */}
        <View
          className={`feedback-submit ${submitting ? 'feedback-submit--disabled' : ''}`}
          onClick={handleSubmit}
        >
          <Text className='feedback-submit-text'>
            {submitting ? '提交中...' : '提交反馈'}
          </Text>
        </View>

        <View className='safe-bottom' />
      </ScrollView>
    </View>
  )
}
