import { View, Text, ScrollView } from '@tarojs/components'
import NavBar from '../../components/NavBar'
import Icon from '../../components/Icon'
// 企业微信「联系我」二维码替换步骤：
// 1. 企业微信管理后台 → 客户联系 → 联系我 → 生成二维码并下载
// 2. 将二维码图片保存为 apps/miniapp/src/assets/wx-qrcode.png
// 3. 取消下方 import 注释，并将占位 View 替换为 <Image showMenuByLongpress />（见下方注释块）
// 4. 同时从 '@tarojs/components' 引入 Image：import { View, Text, ScrollView, Image } from '@tarojs/components'
// import wxQrcode from '../../assets/wx-qrcode.png'
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

          <View className='contact-wx-qrcode-wrap'>
            {/*
              替换为企业微信二维码后，删除下方占位 View，改用：
              <Image
                className='contact-wx-qrcode'
                src={wxQrcode}
                mode='aspectFit'
                showMenuByLongpress
              />
              showMenuByLongpress 为 true 时，用户长按二维码会弹出
              「识别图中二维码」菜单，点击后跳转企业微信添加好友。
            */}
            <View className='contact-wx-qrcode-placeholder'>
              <Icon name='qr-code' size={120} color='#CBD5E1' />
              <Text className='contact-wx-placeholder-title'>企业微信二维码</Text>
              <Text className='contact-wx-placeholder-hint'>
                请将二维码保存为{'\n'}src/assets/wx-qrcode.png
              </Text>
            </View>
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
                  <Icon name={item.icon} size={32} color='#0D9488' />
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
