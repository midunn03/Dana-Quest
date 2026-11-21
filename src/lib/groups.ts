import {authApiBase} from './auth'
import {getSyncAccountId} from './accountSync'

export interface GroupMemberItem {
  userId: number | string
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

async function groupRequest(path:string,body?:unknown) {
  const owner=getSyncAccountId()
  const csrf=decodeURIComponent(document.cookie.split('; ').find(row=>row.startsWith('csrftoken='))?.slice(10)??'')
  const response=await fetch(`${authApiBase()}/groups/${path}`,{method:body?'POST':'GET',credentials:'include',headers:{'Content-Type':'application/json','X-CSRFToken':csrf,...(owner?{'X-Dana-User':owner}:{})},body:body?JSON.stringify(body):undefined})
  const value=await response.json().catch(()=>null)
  if(owner!==getSyncAccountId())throw new Error('Tài khoản đã thay đổi. Hãy tải lại trang.')
  if(!response.ok||!value)throw new Error(value?.message||'Chưa kết nối được dịch vụ nhóm. Hãy thử lại.')
  return value
}

export async function fetchMyGroups(): Promise<PlayerGroupItem[]> {
  const data=await groupRequest('my')
  if(!Array.isArray(data.groups))throw new Error('Danh sách nhóm không hợp lệ. Hãy thử lại.')
  return data.groups
}

export async function createGroup(name: string): Promise<{ success: boolean; group?: PlayerGroupItem; message?: string }> {
  try {
    const data = await groupRequest('create',{name})
    return { success: true, group: data }
  } catch (error) {
    return { success: false, message: error instanceof Error?error.message:'Lỗi mạng.' }
  }
}

export async function joinGroupByCode(code: string): Promise<{ success: boolean; message?: string }> {
  try {
    const data = await groupRequest('join',{code})
    return { success: true, message: data.message }
  } catch (error) {
    return { success: false, message: error instanceof Error?error.message:'Lỗi mạng.' }
  }
}

export async function leaveGroup(groupId: number): Promise<{ success: boolean; message?: string }> {
  try {
    await groupRequest('leave',{groupId})
    return { success: true }
  } catch (error) {
    return { success: false, message: error instanceof Error?error.message:'Lỗi mạng.' }
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
