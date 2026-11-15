export interface BadgeItem {
  id: string
  title: string
  description: string
  rarity: 'common' | 'rare' | 'legendary'
  icon: string
  image?: string | null
  requiredDestinations: string[]
  bonusCoins: number
  bonusXp: number
  unlocked?: boolean
}

export interface BadgeThemeItem {
  slug: string
  name: string
  description: string
  icon: string
  order: number
  completionBonusCoins: number
  completionBonusXp: number
  completed: boolean
  unlockedCount: number
  totalCount: number
  badges: BadgeItem[]
}

export interface BadgeResponse {
  owner?: string
  totalBadges: number
  totalUnlocked: number
  themes: BadgeThemeItem[]
}

export async function fetchUserBadges(): Promise<BadgeResponse | null> {
  try {
    const res = await fetch('/api/auth/badges', { credentials: 'include' })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}
