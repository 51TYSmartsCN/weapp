import { View } from '@tarojs/components'
import Icon from '../Icon'
import './index.scss'

interface MenuItemProps {
  icon: string
  label: string
  onClick?: () => void
}

export default function MenuItem({ icon, label, onClick }: MenuItemProps) {
  return (
    <View className='menu-item' onClick={onClick}>
      <View className='menu-icon-wrap'>
        <Icon name={icon as any} size={32} color='#475569' />
      </View>
      <View className='menu-label'>{label}</View>
      <Icon name='chevron-right' size={28} color='#94A3B8' />
    </View>
  )
}
