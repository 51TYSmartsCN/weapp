import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useNavBarRect } from '../../hooks/useNavBarRect'
import Icon from '../Icon'
import './index.scss'

interface NavBarProps {
  title: string
  /** 是否显示分享按钮（Button openType='share'，触发页面 onShareAppMessage） */
  share?: boolean
  /** 复制链接的文本内容，提供后显示复制链接按钮 */
  copyPath?: string
}

export default function NavBar({ title, share = false, copyPath }: NavBarProps) {
  const { statusBarHeight, contentHeight, totalHeight, menuWidth, menuRightGap } = useNavBarRect()

  // 左右占位宽度 = 胶囊宽度 + 左右间隙，保证标题严格居中且不被胶囊遮挡
  const sideWidth = menuWidth + menuRightGap * 2

  const handleBack = () => {
    Taro.navigateBack()
  }

  const handleCopyLink = () => {
    if (!copyPath) return
    Taro.setClipboardData({ data: copyPath })
      .then(() => Taro.showToast({ title: '链接已复制', icon: 'none' }))
      .catch(() => Taro.showToast({ title: '复制失败', icon: 'none' }))
  }

  const showRightActions = share || copyPath

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
          {/* 右侧：分享 / 复制链接 按钮 */}
          <View className={`nav-side nav-side-right ${showRightActions ? 'nav-side-actions' : ''}`} style={{ width: `${sideWidth}px` }}>
            {share && (
              <Button className='nav-btn nav-share-btn' openType='share'>
                <Icon name='share-2' size={40} color='#0F172A' />
              </Button>
            )}
            {copyPath && (
              <View className='nav-btn' onClick={handleCopyLink}>
                <Icon name='link' size={40} color='#0F172A' />
              </View>
            )}
          </View>
        </View>
      </View>
      {/* 占位元素：撑开文档流，让后续内容排在 NavBar 下方，避免被 fixed 导航栏遮挡 */}
      <View className='nav-bar-placeholder' style={{ height: `${totalHeight}px` }} />
    </>
  )
}
