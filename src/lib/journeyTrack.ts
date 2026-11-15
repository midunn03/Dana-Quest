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
    const raw = localStorage.getItem(TRACK_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveRecordedTrack(points: TrackPoint[]): void {
  try {
    localStorage.setItem(TRACK_STORAGE_KEY, JSON.stringify(points))
  } catch {}
}

export function clearRecordedTrack(): void {
  try {
    localStorage.removeItem(TRACK_STORAGE_KEY)
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
  if (sample.accuracy && sample.accuracy > 40) return false

  const points = getRecordedTrack()
  const now = sample.timestamp || Date.now()
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
  if (points.length < 4 || trimMeters <= 0) return [...points]

  let startIdx = 0
  let cumStart = 0
  for (let i = 1; i < points.length - 2; i++) {
    cumStart += calculateDist(points[i - 1].lat, points[i - 1].lng, points[i].lat, points[i].lng)
    if (cumStart >= trimMeters) {
      startIdx = i
      break
    }
  }

  let endIdx = points.length - 1
  let cumEnd = 0
  for (let i = points.length - 2; i > startIdx + 1; i--) {
    cumEnd += calculateDist(points[i].lat, points[i].lng, points[i + 1].lat, points[i + 1].lng)
    if (cumEnd >= trimMeters) {
      endIdx = i
      break
    }
  }

  return points.slice(startIdx, endIdx + 1)
}

export async function finishTrackSession(points: TrackPoint[]): Promise<{
  success: boolean
  coinsAwarded?: number
  message?: string
}> {
  try {
    const res = await fetch('/api/auth/journey/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ points, isSimulated: false }),
    })
    const data = await res.json()
    if (!res.ok) return { success: false, message: data.message }
    window.dispatchEvent(new CustomEvent('dana-wallet-updated', { detail: { balance: data.balance } }))
    return { success: true, coinsAwarded: data.coinsAwarded }
  } catch {
    return { success: false, message: 'Lỗi mạng.' }
  }
}
