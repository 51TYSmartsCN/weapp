import { View, Text } from '@tarojs/components'
import type { HomeStatItem } from '../../types'
import './index.scss'

interface StatsCardProps {
  items: HomeStatItem[]
  bg?: string
  dividerColor?: string
  valueColor?: string
}

export default function StatsCard({
  items,
  bg,
  dividerColor,
  valueColor
}: StatsCardProps) {
  return (
    <View className='stats-card' style={{ backgroundColor: bg }}>
      {items.map((item, index) => (
        <View key={item.label} className='stats-item'>
          <Text className='stats-value' style={{ color: valueColor }}>
            {item.value}
          </Text>
          <Text className='stats-label'>{item.label}</Text>
          {index < items.length - 1 && (
            <View className='stats-divider' style={{ backgroundColor: dividerColor }} />
          )}
        </View>
      ))}
    </View>
  )
}
