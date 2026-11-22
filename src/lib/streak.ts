import {getSyncAccountId} from './accountSync'
import {authApiBase} from './auth'

export interface StreakMilestone {
  days: number
  bonusCoins: number
  bonusXp: number
  message?: string
}

export interface StreakData {
  currentStreak: number
  longestStreak: number
  lastActiveDate: string | null
  todayActive: boolean
  claimedMilestones: number[]
  milestones: StreakMilestone[]
}

const STREAK_CACHE_KEY = 'dana-streak-v1'
const cacheKey = () => {const owner=getSyncAccountId();return owner?`${STREAK_CACHE_KEY}:${owner}`:STREAK_CACHE_KEY}

export function getCachedStreak(): StreakData | null {
  try {
    const raw = localStorage.getItem(cacheKey())
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveCachedStreak(data: StreakData): void {
  try {
    localStorage.setItem(cacheKey(), JSON.stringify(data))
  } catch {}
}

export async function fetchStreak(): Promise<StreakData | null> {
  const owner=getSyncAccountId()
  try {
    const res = await fetch(`${authApiBase()}/streak`, { credentials: 'include',headers:owner?{'X-Dana-User':owner}:{} })
    if (!res.ok) return null
    const data = await res.json()
    if(getSyncAccountId()!==owner)return null
    saveCachedStreak(data)
    window.dispatchEvent(new CustomEvent('dana-streak-updated', { detail: data }))
    return data
  } catch {
    return getSyncAccountId()===owner?getCachedStreak():null
  }
}

export async function recordStreakActivity(timestamp = Date.now()): Promise<StreakData | null> {
  const owner=getSyncAccountId()
  try {
    const res = await fetch(`${authApiBase()}/streak/activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json',...(owner?{'X-Dana-User':owner}:{}) },
      credentials: 'include',
      body: JSON.stringify({ timestamp }),
    })
    if (!res.ok) return null
    const data = await res.json()
    if(getSyncAccountId()!==owner)return null
    saveCachedStreak(data)
    window.dispatchEvent(new CustomEvent('dana-streak-updated', { detail: data }))
    if (data.newlyClaimed && data.newlyClaimed.length > 0) {
      window.dispatchEvent(new CustomEvent('dana-wallet-updated', { detail: { balance: data.balance } }))
      window.dispatchEvent(new CustomEvent('dana-streak-milestone', { detail: data.newlyClaimed }))
    }
    return data
  } catch {
    return null
  }
}
