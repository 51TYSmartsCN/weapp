import type { MenuGroup } from '../types'

export const menuGroups: MenuGroup[] = [
  {
    items: [
      { icon: 'book-open', label: '我的课程' },
      { icon: 'clock', label: '学习记录' },
      { icon: 'heart', label: '收藏课程' },
      { icon: 'award', label: '学习证书' }
    ]
  },
  {
    items: [
      { icon: 'receipt', label: '我的订单' },
      { icon: 'ticket', label: '优惠券' },
      { icon: 'gift', label: '邀请好友' }
    ]
  },
  {
    items: [
      { icon: 'help-circle', label: '帮助中心' },
      { icon: 'qr-code', label: '加企业微信' },
      { icon: 'message-square', label: '意见反馈' },
      { icon: 'settings', label: '设置' }
    ]
  }
]
