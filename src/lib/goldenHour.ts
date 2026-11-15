export interface GoldenHourItem {
  id: string
  destinationId: string
  title: string
  description: string
  daysOfWeek: number[]
  startTime: string
  endTime: string
  bonusCoins: number
  multiplier: number
  latitude: number
  longitude: number
  radiusMeters: number
  isActive?: boolean
  isUpcoming?: boolean
  minutesUntil?: number | null
  claimedToday?: boolean
}

export interface GoldenHourResponse {
  serverDateKey: string
  serverTime: string
  challenges: GoldenHourItem[]
}

export async function fetchGoldenHours(): Promise<GoldenHourResponse | null> {
  try {
    const res = await fetch('/api/auth/golden-hours', { credentials: 'include' })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function claimGoldenHourReward(
  challengeId: string,
  sample: { latitude: number; longitude: number; accuracy: number; isSimulated?: boolean }
): Promise<{ success: boolean; bonusCoins?: number; message?: string }> {
  try {
    const res = await fetch('/api/auth/golden-hours/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        challengeId,
        latitude: sample.latitude,
        longitude: sample.longitude,
        accuracy: sample.accuracy,
        isSimulated: sample.isSimulated ?? false,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      return { success: false, message: data.message || 'Không thể nhận thưởng giờ vàng.' }
    }
    window.dispatchEvent(new CustomEvent('dana-wallet-updated', { detail: { balance: data.balance } }))
    return { success: true, bonusCoins: data.bonusCoins, message: data.message }
  } catch {
    return { success: false, message: 'Lỗi mạng khi kết nối máy chủ.' }
  }
}
