import { View, Text, ScrollView, Image } from '@tarojs/components'
import NavBar from '../../components/NavBar'
import Icon from '../../components/Icon'
import wxQrcode from '../../assets/wx-qrcode.png'
import './index.scss'

const BENEFITS = [
  { icon: 'book-open', text: '咨询课程详情、报名优惠' },
  { icon: 'message-circle', text: '学习问题答疑与指导' },
  { icon: 'help-circle', text: '售后服务与意见反馈' },
] as const

export default function ContactWx() {
  return (
    <View className='contact-wx-page'>
      <NavBar title='加企业微信' />
      <ScrollView className='contact-wx-body' scrollY>
        {/* 助教信息卡 + 二维码 */}
        <View className='contact-wx-card'>
          <View className='contact-wx-avatar'>
            <Icon name='users' size={56} color='#FFFFFF' />
          </View>
          <Text className='contact-wx-name'>GEO 课程助教</Text>
          <Text className='contact-wx-desc'>课程咨询 · 学习答疑 · 服务支持</Text>

          {/* showMenuByLongpress=true：用户长按二维码会弹出「识别图中二维码」菜单，
              点击后跳转企业微信添加好友 */}
          <View className='contact-wx-qrcode-wrap'>
            <Image
              className='contact-wx-qrcode'
              src={wxQrcode}
              mode='aspectFit'
              showMenuByLongpress
            />
          </View>

          <View className='contact-wx-tip'>
            <Icon name='message-circle' size={28} color='#475569' />
            <Text className='contact-wx-tip-text'>长按二维码识别，添加企业微信</Text>
          </View>
        </View>

        {/* 福利清单 */}
        <View className='contact-wx-benefits'>
          <Text className='contact-wx-benefits-title'>添加后你可以</Text>
          {BENEFITS.map((item, index) => (
            <View key={item.text}>
              <View className='contact-wx-benefit-item'>
                <View className='contact-wx-benefit-icon'>
                  <Icon name={item.icon} size={32} color='var(--theme-primary, #0D9488)' />
                </View>
                <Text className='contact-wx-benefit-text'>{item.text}</Text>
              </View>
              {index < BENEFITS.length - 1 && <View className='contact-wx-divider' />}
            </View>
          ))}
        </View>

        <View className='safe-bottom' />
      </ScrollView>
    </View>
  )
}
