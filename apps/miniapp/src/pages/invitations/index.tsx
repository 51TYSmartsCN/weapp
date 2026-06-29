import { useEffect, useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import NavBar from '../../components/NavBar'
import Skeleton from '../../components/Skeleton'
import Icon from '../../components/Icon'
import { getInvitations, showApiError } from '../../services'
import type { InvitationSummary } from '../../types'
import './index.scss'

function formatDate(iso: string): string {
  return iso.slice(0, 10)
}

export default function Invitations() {
  const [summary, setSummary] = useState<InvitationSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getInvitations()
      .then(setSummary)
      .catch((err) => showApiError(err, '邀请信息加载失败'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <View className='invitations-page'>
      <NavBar title='邀请好友' />
      <ScrollView className='invitations-body' scrollY>
        {loading ? (
          <>
            <Skeleton rows={3} title />
            <Skeleton rows={2} horizontal avatar />
            <Skeleton rows={2} horizontal avatar />
          </>
        ) : (
          <>
            <View className='invite-summary'>
              <View className='invite-stat'>
                <Text className='invite-stat-value'>{summary?.invitedCount ?? 0}</Text>
                <Text className='invite-stat-label'>已邀请人数</Text>
              </View>
              <View className='invite-stat-divider' />
              <View className='invite-stat'>
                <Text className='invite-stat-value'>¥{summary?.rewardTotal ?? 0}</Text>
                <Text className='invite-stat-label'>累计奖励</Text>
              </View>
            </View>

            <Text className='invite-section-title'>邀请记录</Text>

            {summary && summary.invitations.length > 0 ? (
              <View className='invite-list'>
                {summary.invitations.map((item) => (
                  <View key={item.id} className='invite-item'>
                    <View className='invite-item-icon'>
                      <Icon name='gift' size={40} color='var(--theme-primary, #0D9488)' />
                    </View>
                    <View className='invite-item-info'>
                      <Text className='invite-item-name'>好友 {item.inviteeId}</Text>
                      <Text className='invite-item-date'>{formatDate(item.createdAt)}</Text>
                    </View>
                    <Text className='invite-item-reward'>+¥{item.reward}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View className='invite-empty'>
                <Icon name='gift' size={96} color='#94A3B8' />
                <Text className='invite-empty-text'>暂无邀请记录</Text>
                <Text className='invite-empty-hint'>邀请好友赚奖励</Text>
              </View>
            )}
          </>
        )}
        <View className='safe-bottom' />
      </ScrollView>
    </View>
  )
}
