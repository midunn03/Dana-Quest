import { distanceMeters } from './location'
import { GREEN_TRANSIT_STATIONS, type GreenTransitStation } from '../data/greenTransit'

const STORAGE_KEY = 'dana_claimed_eco_transit'

export interface NearbyTransitResult {
  station: GreenTransitStation
  distance: number
  claimed: boolean
}

export function getClaimedTransitIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function hasClaimedTransit(stationId: string): boolean {
  return getClaimedTransitIds().includes(stationId)
}

export function claimTransitReward(station: GreenTransitStation): { success: boolean; message: string } {
  const claimed = getClaimedTransitIds()
  if (claimed.includes(station.id)) {
    return { success: false, message: 'Bạn đã nhận thưởng di chuyển xanh cho trạm này rồi!' }
  }

  const updated = [...claimed, station.id]
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {
    // Local storage fallback
  }

  const transitType = station.type === 'bike' ? 'xe đạp công cộng TNGo' : 'xe buýt xanh DanaBus'
  const message = `🎉 Tuyệt vời! Bạn đã chọn ${transitType} (+${station.bonusCoins} Green Coins) vì một Đà Nẵng xanh!`

  window.dispatchEvent(new CustomEvent('dana-toast', { detail: message }))
  window.dispatchEvent(new CustomEvent('dana-eco-coins-changed', { detail: { bonus: station.bonusCoins, stationId: station.id } }))

  return { success: true, message }
}

export function getNearbyGreenTransit(position: [number, number], maxMeters = 300): NearbyTransitResult[] {
  const claimedIds = new Set(getClaimedTransitIds())
  const results: NearbyTransitResult[] = []

  for (const station of GREEN_TRANSIT_STATIONS) {
    const distance = distanceMeters(position, station.position)
    if (distance <= maxMeters) {
      results.push({
        station,
        distance,
        claimed: claimedIds.has(station.id),
      })
    }
  }

  return results.sort((a, b) => a.distance - b.distance)
}

export function getTotalEcoTransitCoins(): number {
  const claimedIds = new Set(getClaimedTransitIds())
  return GREEN_TRANSIT_STATIONS
    .filter(s => claimedIds.has(s.id))
    .reduce((sum, s) => sum + s.bonusCoins, 0)
}
