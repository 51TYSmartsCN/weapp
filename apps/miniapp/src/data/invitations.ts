import type { InvitationSummary } from '../types'

/** 邀请好友汇总信息（3 位邀请，每人奖励 20，合计 60） */
export const invitationsSummary: InvitationSummary = {
  invitedCount: 3,
  rewardTotal: 60,
  invitations: [
    {
      id: 1,
      inviterId: 1,
      inviteeId: 101,
      reward: 20,
      createdAt: '2026-06-01T10:00:00.000Z',
    },
    {
      id: 2,
      inviterId: 1,
      inviteeId: 102,
      reward: 20,
      createdAt: '2026-06-10T15:00:00.000Z',
    },
    {
      id: 3,
      inviterId: 1,
      inviteeId: 103,
      reward: 20,
      createdAt: '2026-06-20T18:00:00.000Z',
    },
  ],
}
