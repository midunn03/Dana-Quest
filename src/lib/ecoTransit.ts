import { distanceMeters } from './location'
import { GREEN_TRANSIT_STATIONS, type GreenTransitStation } from '../data/greenTransit'
import { authApiBase } from './auth'
import { getSyncAccountId } from './accountSync'
import { t, interpolate } from '../i18n/locale'

const STORAGE_KEY = 'dana_claimed_eco_transit_v2'
const LEGACY_STORAGE_KEY = 'dana_claimed_eco_transit'
const storageKey = () => {const owner=getSyncAccountId();return owner?`${STORAGE_KEY}:${owner}`:STORAGE_KEY}

export interface NearbyTransitResult {
  station: GreenTransitStation
  distance: number
  claimed: boolean
}

export interface ClaimTransitOptions {
  station: GreenTransitStation
  sample: { latitude: number; longitude: number; accuracy: number } | null
  dwellSeconds: number
  simulating?: boolean
}

export function getTodayDateKey(now = Date.now()): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(now))
  } catch {
    return new Date(now).toISOString().slice(0, 10)
  }
}

interface StoredClaimRecord {
  stationId: string
  dateKey: string
  claimedAt: number
}

function readStoredClaims(): StoredClaimRecord[] {
  try {
    const raw = localStorage.getItem(storageKey())
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed.filter(record=>record&&typeof record.stationId==='string'&&typeof record.dateKey==='string')
    }
  } catch {}
  return []
}

function writeStoredClaims(claims: StoredClaimRecord[]) {
  try {
    localStorage.setItem(storageKey(), JSON.stringify(claims))
  } catch {}
}

export function getClaimedTransitIds(): string[] {
  return readStoredClaims().map(c => c.stationId)
}

export function hasClaimedTransitToday(stationId: string, now = Date.now()): boolean {
  const dateKey = getTodayDateKey(now)
  const claims = readStoredClaims()
  return claims.some(c => c.stationId === stationId && c.dateKey === dateKey)
}

export function hasClaimedTransit(stationId: string): boolean {
  return hasClaimedTransitToday(stationId)
}

export async function claimTransitReward(
  options: ClaimTransitOptions | GreenTransitStation
): Promise<{ success: boolean; message: string; code?: string; balance?: number }> {
  // Tương thích ngược: nếu truyền vào chỉ GreenTransitStation
  const isOptions = 'sample' in options
  const station = isOptions ? options.station : options
  const sample = isOptions ? options.sample : null
  const dwellSeconds = isOptions ? options.dwellSeconds : 60
  const simulating = isOptions ? Boolean(options.simulating) : false

  // 1. Kiểm tra mô phỏng (Chống gian lận Lỗi 3)
  if (simulating) {
    const msg = t('Không thể nhận thưởng khi đang dùng chế độ mô phỏng.')
    window.dispatchEvent(new CustomEvent('dana-toast', { detail: msg }))
    return { success: false, code: 'SIMULATION_BLOCKED', message: msg }
  }

  // 2. Kiểm tra GPS (Lỗi 2)
  if (!sample) {
    const msg = t('Chưa xác định được vị trí GPS của bạn.')
    window.dispatchEvent(new CustomEvent('dana-toast', { detail: msg }))
    return { success: false, code: 'NO_GPS', message: msg }
  }

  if (!Number.isFinite(sample.accuracy) || sample.accuracy <= 0 || sample.accuracy > 50) {
    const msg = interpolate('Độ chính xác GPS (${0}m) chưa đủ (cần ≤ 50m).', [Math.round(sample.accuracy)])
    window.dispatchEvent(new CustomEvent('dana-toast', { detail: msg }))
    return { success: false, code: 'ACCURACY_TOO_LOW', message: msg }
  }

  const dist = distanceMeters([sample.latitude, sample.longitude], station.position)
  if (dist > 80) {
    const msg = interpolate('Bạn đang cách trạm ${0}m (yêu cầu trong phạm vi 80m).', [Math.round(dist)])
    window.dispatchEvent(new CustomEvent('dana-toast', { detail: msg }))
    return { success: false, code: 'TOO_FAR', message: msg }
  }

  if (dwellSeconds < 60) {
    const msg = interpolate('Cần ở lại trạm tối thiểu 60 giây (đã ở ${0}s).', [Math.round(dwellSeconds)])
    window.dispatchEvent(new CustomEvent('dana-toast', { detail: msg }))
    return { success: false, code: 'DWELL_TOO_SHORT', message: msg }
  }

  // 3. Kiểm tra đã nhận hôm nay
  const todayKey = getTodayDateKey()
  if (hasClaimedTransitToday(station.id)) {
    const msg = t('Bạn đã nhận thưởng trạm này trong ngày hôm nay rồi.')
    window.dispatchEvent(new CustomEvent('dana-toast', { detail: msg }))
    return { success: false, code: 'ALREADY_CLAIMED_TODAY', message: msg }
  }

  // 4. Gửi lên server để ghi nhận vào ví chính (Lỗi 1)
  const owner = getSyncAccountId()
  try {
    const response = await fetch(`${authApiBase()}/transit/claim`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(owner ? { 'X-Dana-User': owner } : {}),
      },
      body: JSON.stringify({
        stationId: station.id,
        coordinates: [sample.latitude, sample.longitude],
        accuracy: sample.accuracy,
        dwellSeconds,
        simulating: false,
      }),
    })

    if (response.status === 401) {
      const msg = t('Vui lòng đăng nhập để nhận và tích lũy Xu Dana vào ví của bạn.')
      window.dispatchEvent(new CustomEvent('dana-toast', { detail: msg }))
      return { success: false, code: 'AUTH_REQUIRED', message: msg }
    }

    const payload = await response.json()
    if(getSyncAccountId()!==owner)return {success:false,code:'OWNER_CHANGED',message:t('Tài khoản đã thay đổi. Hãy tải lại trang.')}
    if (!response.ok) {
      const msg = payload.message || payload.error || t('Chưa nhận được thưởng di chuyển xanh.')
      window.dispatchEvent(new CustomEvent('dana-toast', { detail: msg }))
      return { success: false, code: payload.code || 'CLAIM_FAILED', message: msg }
    }

    // Cập nhật bộ nhớ đệm client
    const existing = readStoredClaims()
    existing.push({ stationId: station.id, dateKey: todayKey, claimedAt: Date.now() })
    writeStoredClaims(existing)
    try {
      localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(existing.map(c => c.stationId)))
    } catch {}

    // Phát sự kiện cập nhật ví xu toàn app
    window.dispatchEvent(new Event('dana-wallet-updated'))

    const transitType = station.type === 'bike' ? t('xe đạp công cộng TNGo') : t('xe buýt xanh DanaBus')
    const successMsg = interpolate('🎉 Tuyệt vời! Bạn đã đến trạm ${0} (+${1} Xu Dana) vì một Đà Nẵng xanh!', [transitType, station.bonusCoins])
    window.dispatchEvent(new CustomEvent('dana-toast', { detail: successMsg }))

    return { success: true, balance: payload.balance, message: successMsg }
  } catch (cause) {
    const msg = cause instanceof Error ? cause.message : t('Lỗi kết nối khi nhận thưởng.')
    window.dispatchEvent(new CustomEvent('dana-toast', { detail: msg }))
    return { success: false, code: 'NETWORK_ERROR', message: msg }
  }
}

export function getNearbyGreenTransit(
  position: [number, number],
  maxMeters = 300,
  stations = GREEN_TRANSIT_STATIONS
): NearbyTransitResult[] {
  const results: NearbyTransitResult[] = []

  for (const station of stations) {
    // Chỉ hiển thị các trạm đã xác minh
    if (station.verified === false) continue
    const distance = distanceMeters(position, station.position)
    if (distance <= maxMeters) {
      results.push({
        station,
        distance,
        claimed: hasClaimedTransitToday(station.id),
      })
    }
  }

  return results.sort((a, b) => a.distance - b.distance)
}

export function getTotalEcoTransitCoins(): number {
  const claims = readStoredClaims()
  const claimedMap = new Map(claims.map(c => [c.stationId, true]))
  return GREEN_TRANSIT_STATIONS
    .filter(s => claimedMap.has(s.id))
    .reduce((sum, s) => sum + s.bonusCoins, 0)
}
