import {getSyncAccountId} from './accountSync'
import {authApiBase} from './auth'

export interface TrackPoint {
  lat: number
  lng: number
  timestamp: number
  accuracy?: number
  speed?: number | null
}

export interface TrackSessionSummary {
  totalMeters: number
  durationSeconds: number
  avgSpeedKmh: number
  modes: { walk: number; bike: number; transit: number }
  coinsAwarded: number
  visitedCount: number
}

const TRACK_STORAGE_KEY = 'dana-journey-track-v1'
const storageKey = () => {const owner=getSyncAccountId();return owner?`${TRACK_STORAGE_KEY}:${owner}`:TRACK_STORAGE_KEY}

function calculateDist(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3
  const phi1 = (lat1 * Math.PI) / 180
  const phi2 = (lat2 * Math.PI) / 180
  const dPhi = ((lat2 - lat1) * Math.PI) / 180
  const dLambda = ((lon2 - lon1) * Math.PI) / 180
  const a = Math.sin(dPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function getRecordedTrack(): TrackPoint[] {
  try {
    const raw = localStorage.getItem(storageKey())
    const points: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(points) ? points.filter((point): point is TrackPoint => !!point && [point.lat, point.lng, point.timestamp].every(Number.isFinite) && Math.abs(point.lat) <= 90 && Math.abs(point.lng) <= 180) : []
  } catch {
    return []
  }
}

export function saveRecordedTrack(points: TrackPoint[]): void {
  try {
    localStorage.setItem(storageKey(), JSON.stringify(points))
  } catch {}
}

export function clearRecordedTrack(): void {
  try {
    localStorage.removeItem(storageKey())
  } catch {}
}

export function recordTrackPoint(sample: {
  latitude: number
  longitude: number
  accuracy?: number
  isSimulated?: boolean
  speed?: number | null
  timestamp?: number
}): boolean {
  if (sample.isSimulated) return false
  if (![sample.latitude, sample.longitude].every(Number.isFinite) || Math.abs(sample.latitude) > 90 || Math.abs(sample.longitude) > 180) return false
  if (sample.accuracy !== undefined && (!Number.isFinite(sample.accuracy) || sample.accuracy <= 0 || sample.accuracy > 40)) return false

  const points = getRecordedTrack()
  const now = sample.timestamp ?? Date.now()
  if (!Number.isFinite(now)) return false
  const newPt: TrackPoint = {
    lat: sample.latitude,
    lng: sample.longitude,
    timestamp: now,
    accuracy: sample.accuracy,
    speed: sample.speed,
  }

  if (points.length === 0) {
    points.push(newPt)
    saveRecordedTrack(points)
    return true
  }

  const last = points[points.length - 1]
  const dist = calculateDist(last.lat, last.lng, newPt.lat, newPt.lng)
  const timeDiff = (now - last.timestamp) / 1000
  if (timeDiff <= 0) return false

  // Filter teleportation jumps (>120 km/h)
  if (timeDiff > 0 && (dist / timeDiff) * 3.6 > 120) return false

  // Sample sparsely: only add if moved >= 15m or >= 10s elapsed
  if (dist >= 15 || timeDiff >= 10) {
    points.push(newPt)
    if (points.length > 1000) points.shift()
    saveRecordedTrack(points)
    return true
  }

  return false
}

/**
 * Trims initial and final meters off the path to protect privacy around home / hotel.
 */
export function trimTrack(points: TrackPoint[], trimMeters = 200): TrackPoint[] {
  if (trimMeters <= 0) return [...points]

  let startIdx = points.length
  let cumStart = 0
  for (let i = 1; i < points.length; i++) {
    cumStart += calculateDist(points[i - 1].lat, points[i - 1].lng, points[i].lat, points[i].lng)
    if (cumStart >= trimMeters) {
      startIdx = i
      break
    }
  }

  let endIdx = -1
  let cumEnd = 0
  for (let i = points.length - 2; i >= 0; i--) {
    cumEnd += calculateDist(points[i].lat, points[i].lng, points[i + 1].lat, points[i + 1].lng)
    if (cumEnd >= trimMeters) {
      endIdx = i
      break
    }
  }

  return startIdx <= endIdx ? points.slice(startIdx, endIdx + 1) : []
}

export async function finishTrackSession(points: TrackPoint[]): Promise<{
  success: boolean
  coinsAwarded?: number
  message?: string
}> {
  const owner=getSyncAccountId()
  try {
    const res = await fetch(`${authApiBase()}/journey/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json',...(owner?{'X-Dana-User':owner}:{}) },
      credentials: 'include',
      body: JSON.stringify({ points, isSimulated: false }),
    })
    const data = await res.json()
    if(getSyncAccountId()!==owner)return {success:false,message:'Tài khoản đã thay đổi. Hãy tải lại trang.'}
    if (!res.ok) return { success: false, message: data.message }
    window.dispatchEvent(new CustomEvent('dana-wallet-updated', { detail: { balance: data.balance } }))
    return { success: true, coinsAwarded: data.coinsAwarded }
  } catch {
    return { success: false, message: 'Lỗi mạng.' }
  }
}
