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

export function getCachedStreak(): StreakData | null {
  try {
    const raw = localStorage.getItem(STREAK_CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveCachedStreak(data: StreakData): void {
  try {
    localStorage.setItem(STREAK_CACHE_KEY, JSON.stringify(data))
  } catch {}
}

export async function fetchStreak(): Promise<StreakData | null> {
  try {
    const res = await fetch('/api/auth/streak', { credentials: 'include' })
    if (!res.ok) return null
    const data = await res.json()
    saveCachedStreak(data)
    window.dispatchEvent(new CustomEvent('dana-streak-updated', { detail: data }))
    return data
  } catch {
    return getCachedStreak()
  }
}

export async function recordStreakActivity(timestamp = Date.now()): Promise<StreakData | null> {
  try {
    const res = await fetch('/api/auth/streak/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ timestamp }),
    })
    if (!res.ok) return null
    const data = await res.json()
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
