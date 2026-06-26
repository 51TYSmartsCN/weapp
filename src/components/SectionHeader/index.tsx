import { View, Text } from '@tarojs/components'
import './index.scss'

interface SectionHeaderProps {
  title: string
  linkText?: string
  onLinkClick?: () => void
}

export default function SectionHeader({ title, linkText, onLinkClick }: SectionHeaderProps) {
  return (
    <View className='section-header'>
      <Text className='section-title'>{title}</Text>
      {linkText && (
        <Text className='section-link' onClick={onLinkClick}>
          {linkText} &gt;
        </Text>
      )}
    </View>
  )
}
