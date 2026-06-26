import { View, Input, Text } from '@tarojs/components'
import Icon from '../Icon'
import './index.scss'

interface SearchBarProps {
  value?: string
  placeholder?: string
  onChange?: (value: string) => void
  onConfirm?: (value: string) => void
}

export default function SearchBar({
  value = '',
  placeholder = '搜索 GEO 课程...',
  onChange,
  onConfirm
}: SearchBarProps) {
  return (
    <View className='search-bar'>
      <Icon name='search' size={36} color='#94A3B8' />
      <Input
        className='search-input'
        type='text'
        value={value}
        placeholder={placeholder}
        placeholderStyle='color: #94A3B8'
        confirmType='search'
        onInput={(e) => onChange?.(e.detail.value)}
        onConfirm={(e) => onConfirm?.(e.detail.value)}
      />
      {value && (
        <View className='search-clear' onClick={() => onChange?.('')}>
          <Text>×</Text>
        </View>
      )}
    </View>
  )
}
