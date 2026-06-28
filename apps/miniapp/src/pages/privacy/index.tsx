import { View, Text, ScrollView } from '@tarojs/components'
import NavBar from '../../components/NavBar'
import './index.scss'

export default function Privacy() {
  return (
    <View className='agreement-page'>
      <NavBar title='隐私政策' />
      <ScrollView className='agreement-body' scrollY>
        <View className='agreement-content'>
          <Text className='agreement-updated'>最后更新：2026年6月28日</Text>

          <Text className='agreement-h2'>一、引言</Text>
          <Text className='agreement-p'>
            GEO 课程（以下简称"本应用"）非常重视用户隐私保护。本政策说明我们如何收集、使用、存储和保护您的个人信息。使用本应用即表示您同意本政策。
          </Text>

          <Text className='agreement-h2'>二、我们收集的信息</Text>
          <Text className='agreement-p'>
            1. 微信授权信息：包括您的 openid、昵称、头像，用于账号登录与展示。{'\n'}
            2. 学习记录：包括课程进度、观看时长、学习证书等，用于提供学习服务。{'\n'}
            3. 订单信息：包括购买的课程、支付金额、订单号等，用于交易管理。{'\n'}
            4. 反馈内容：您主动提交的意见反馈，用于改进服务。
          </Text>

          <Text className='agreement-h2'>三、信息使用</Text>
          <Text className='agreement-p'>
            我们收集的信息仅用于：{'\n'}
            1. 提供登录、学习、证书等核心服务；{'\n'}
            2. 个性化推荐课程内容；{'\n'}
            3. 处理订单与售后；{'\n'}
            4. 改进产品体验与功能优化；{'\n'}
            5. 在您同意的前提下，发送课程更新通知。
          </Text>

          <Text className='agreement-h2'>四、信息存储与保护</Text>
          <Text className='agreement-p'>
            1. 您的信息存储于安全的服务器，采用加密传输与存储。{'\n'}
            2. 我们建立严格的数据访问权限控制，仅授权人员可访问。{'\n'}
            3. 我们会采取合理的安全措施防止信息泄露、篡改、丢失。{'\n'}
            4. 除法律法规要求外，我们不会向第三方提供您的个人信息。
          </Text>

          <Text className='agreement-h2'>五、信息共享</Text>
          <Text className='agreement-p'>
            1. 我们不会向第三方出售您的个人信息。{'\n'}
            2. 为完成支付等服务，我们可能与微信支付等合作方共享必要信息。{'\n'}
            3. 在获得您明确同意后，我们可能共享您的部分信息。
          </Text>

          <Text className='agreement-h2'>六、您的权利</Text>
          <Text className='agreement-p'>
            1. 您有权访问、更正、删除个人信息。{'\n'}
            2. 您有权撤回授权，撤回后我们将删除相关信息。{'\n'}
            3. 您有权注销账号，注销后信息将不可恢复。
          </Text>

          <Text className='agreement-h2'>七、未成年人保护</Text>
          <Text className='agreement-p'>
            本应用主要面向成年人。如未成年人在监护人不知情下使用，监护人可通过"意见反馈"联系我们删除相关信息。
          </Text>

          <Text className='agreement-h2'>八、Cookie 与同类技术</Text>
          <Text className='agreement-p'>
            本应用使用本地存储技术保存登录状态与学习进度，不使用 Cookie。
          </Text>

          <Text className='agreement-h2'>九、政策变更</Text>
          <Text className='agreement-p'>
            本政策可能根据法律法规或业务调整进行更新，更新后将在应用内提示。继续使用即视为同意更新后的政策。
          </Text>

          <Text className='agreement-h2'>十、联系我们</Text>
          <Text className='agreement-p'>
            如对本政策有任何疑问，请通过"意见反馈"功能联系我们。
          </Text>

          <View className='agreement-bottom-space' />
        </View>
      </ScrollView>
    </View>
  )
}
