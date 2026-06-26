import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useNavBarRect } from '../../hooks/useNavBarRect'
import Icon from '../Icon'
import './index.scss'

interface NavBarProps {
  title: string
}

export default function NavBar({ title }: NavBarProps) {
  const { statusBarHeight, contentHeight, totalHeight, menuWidth, menuRightGap } = useNavBarRect()

  // 左右占位宽度 = 胶囊宽度 + 左右间隙，保证标题严格居中且不被胶囊遮挡
  const sideWidth = menuWidth + menuRightGap * 2

  const handleBack = () => {
    Taro.navigateBack()
  }

  return (
    <>
      {/* 固定在顶部的导航栏 */}
      <View
        className='nav-bar'
        style={{ height: `${totalHeight}px`, paddingTop: `${statusBarHeight}px` }}
      >
        <View className='nav-bar-content' style={{ height: `${contentHeight}px` }}>
          <View className='nav-side' style={{ width: `${sideWidth}px` }}>
            <View className='nav-btn' onClick={handleBack}>
              <Icon name='arrow-left' size={44} color='#0F172A' />
            </View>
          </View>
          <Text className='nav-title'>{title}</Text>
          {/* 右侧占位：与左侧等宽，保持标题居中；右上角不放按钮，避免被微信胶囊遮挡 */}
          <View className='nav-side nav-side-right' style={{ width: `${sideWidth}px` }} />
        </View>
      </View>
      {/* 占位元素：撑开文档流，让后续内容排在 NavBar 下方，避免被 fixed 导航栏遮挡 */}
      <View className='nav-bar-placeholder' style={{ height: `${totalHeight}px` }} />
    </>
  )
}
