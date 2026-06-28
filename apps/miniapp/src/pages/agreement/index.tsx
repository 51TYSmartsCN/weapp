import { View, Text, ScrollView } from '@tarojs/components'
import NavBar from '../../components/NavBar'
import './index.scss'

export default function Agreement() {
  return (
    <View className='agreement-page'>
      <NavBar title='用户协议' />
      <ScrollView className='agreement-body' scrollY>
        <View className='agreement-content'>
          <Text className='agreement-updated'>最后更新：2026年6月28日</Text>

          <Text className='agreement-h2'>一、服务说明</Text>
          <Text className='agreement-p'>
            GEO 课程（以下简称"本应用"）是一款专注于 GEO（生成式引擎优化）领域实战学习的在线教育小程序。本应用提供课程浏览、学习、证书颁发等服务。使用本应用即表示您同意本协议各项条款。
          </Text>

          <Text className='agreement-h2'>二、账号注册与使用</Text>
          <Text className='agreement-p'>
            1. 您通过微信授权方式登录本应用，授权后即完成账号注册。{'\n'}
            2. 您应提供真实、准确的个人信息，因信息不实导致的损失由您自行承担。{'\n'}
            3. 您不得将账号转让、出借给他人使用，否则承担由此产生的一切责任。{'\n'}
            4. 如发现账号存在安全风险，请立即联系客服处理。
          </Text>

          <Text className='agreement-h2'>三、用户行为规范</Text>
          <Text className='agreement-p'>
            您在使用本应用时应遵守以下规范：{'\n'}
            1. 遵守中华人民共和国相关法律法规；{'\n'}
            2. 不得发布违法、淫秽、暴力、歧视等不良信息；{'\n'}
            3. 不得干扰本应用正常运行，或利用技术手段破坏系统；{'\n'}
            4. 不得未经授权爬取、复制、传播本应用的课程内容；{'\n'}
            5. 不得冒充他人或虚构身份进行活动。
          </Text>

          <Text className='agreement-h2'>四、知识产权</Text>
          <Text className='agreement-p'>
            1. 本应用所有课程内容（包括视频、文档、图片等）的版权归本应用或相关讲师所有。{'\n'}
            2. 未经书面许可，您不得录制、复制、传播课程内容。{'\n'}
            3. 您在社区发表的原创内容，版权归您所有，但您授予本应用免费的展示和推广权。
          </Text>

          <Text className='agreement-h2'>五、付费服务</Text>
          <Text className='agreement-p'>
            1. 部分课程为付费内容，支付成功后即可学习。{'\n'}
            2. 虚拟商品一经购买，原则上不支持退款。如遇特殊情况，请联系客服处理。{'\n'}
            3. 本应用可能提供优惠券等促销活动，活动规则以页面说明为准。
          </Text>

          <Text className='agreement-h2'>六、免责声明</Text>
          <Text className='agreement-p'>
            1. 因网络故障、系统维护等原因导致服务中断，本应用不承担责任。{'\n'}
            2. 本应用提供的内容仅供参考，不构成任何投资或决策建议。{'\n'}
            3. 因您违反本协议导致的损失，本应用不承担责任。
          </Text>

          <Text className='agreement-h2'>七、协议变更</Text>
          <Text className='agreement-p'>
            本应用有权根据业务发展需要修改本协议，修改后的协议自发布之日起生效。继续使用本应用即视为您同意修改后的协议。
          </Text>

          <Text className='agreement-h2'>八、联系方式</Text>
          <Text className='agreement-p'>
            如对本协议有任何疑问，请通过"意见反馈"功能联系我们。
          </Text>

          <View className='agreement-bottom-space' />
        </View>
      </ScrollView>
    </View>
  )
}
