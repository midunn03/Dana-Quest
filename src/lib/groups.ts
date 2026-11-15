export interface GroupMemberItem {
  userId: number
  displayName: string
  avatarId: string
  score: number
  rank: number
  isLeader: boolean
  isSelf: boolean
}

export interface PlayerGroupItem {
  id: number
  name: string
  code: string
  isLeader: boolean
  optIn: boolean
  memberCount: number
  leaderboard: GroupMemberItem[]
}

export async function fetchMyGroups(): Promise<PlayerGroupItem[]> {
  try {
    const res = await fetch('/api/game/groups/my', { credentials: 'include' })
    if (!res.ok) return []
    const data = await res.json()
    return data.groups ?? []
  } catch {
    return []
  }
}

export async function createGroup(name: string): Promise<{ success: boolean; group?: PlayerGroupItem; message?: string }> {
  try {
    const res = await fetch('/api/game/groups/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name }),
    })
    const data = await res.json()
    if (!res.ok) return { success: false, message: data.message || 'Không thể tạo nhóm.' }
    return { success: true, group: data }
  } catch {
    return { success: false, message: 'Lỗi mạng.' }
  }
}

export async function joinGroupByCode(code: string): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch('/api/game/groups/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ code }),
    })
    const data = await res.json()
    if (!res.ok) return { success: false, message: data.message || 'Không thể tham gia nhóm.' }
    return { success: true, message: data.message }
  } catch {
    return { success: false, message: 'Lỗi mạng.' }
  }
}

export async function leaveGroup(groupId: number): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch('/api/game/groups/leave', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ groupId }),
    })
    const data = await res.json()
    if (!res.ok) return { success: false, message: data.message || 'Không thể rời nhóm.' }
    return { success: true }
  } catch {
    return { success: false, message: 'Lỗi mạng.' }
  }
}

export async function recordCoCheckin(destinationId: string): Promise<{
  success: boolean
  cocheckinBonus: boolean
  bonusCoins: number
  message?: string
}> {
  try {
    const res = await fetch('/api/game/cocheckin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ destinationId }),
    })
    const data = await res.json()
    if (!res.ok) return { success: false, cocheckinBonus: false, bonusCoins: 0 }
    if (data.cocheckinBonus && data.bonusCoins > 0) {
      window.dispatchEvent(new CustomEvent('dana-cocheckin-bonus', { detail: data }))
    }
    return data
  } catch {
    return { success: false, cocheckinBonus: false, bonusCoins: 0 }
  }
}
