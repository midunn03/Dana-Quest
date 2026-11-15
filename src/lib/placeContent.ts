import { useEffect, useSyncExternalStore } from 'react'
import { categoryLabels, setLiveDestinations, type Destination, type DestinationCategory, type PlacePhoto } from '../data/destinations'

/** Ảnh dán xuống mặt đất: tâm (lat,lng), kích thước ngoài đời (mét) và góc xoay (độ). */
export interface GroundInfo { lat: number; lng: number; widthM: number; heightM: number; rotation: number }
export interface PlaceSpriteInfo { url: string; meters: number; ground?: GroundInfo }
export interface PlaceData { sprites: Record<string, PlaceSpriteInfo>; /** null = chưa quản lý trong admin: dùng danh sách mẫu */ places: Destination[] | null }

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const text = (value: unknown, max = 5000) => typeof value === 'string' ? value.slice(0, max) : ''
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)
// Chỉ nhận đường dẫn ảnh do máy chủ của mình trả về (hoặc https), không nhận javascript: hay data:
const safeUrl = (value: unknown) => typeof value === 'string' && /^(\/[^/]|https?:\/\/)/.test(value) ? value : ''
const stringList = (value: unknown, max = 300) => Array.isArray(value) ? value.filter((line): line is string => typeof line === 'string' && line.trim() !== '').map(line => line.trim().slice(0, max)) : []

export function parseGround(raw: unknown): GroundInfo | undefined {
  if (!isObject(raw)) return undefined
  const { lat, lng, widthM, heightM, rotation } = raw
  if (!finite(lat) || !finite(lng) || !finite(widthM) || !finite(heightM) || widthM <= 0 || heightM <= 0) return undefined
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return undefined
  return { lat, lng, widthM, heightM, rotation: finite(rotation) ? rotation : 0 }
}

/** Đọc một địa điểm do admin tạo; thiếu mã, tên hoặc tọa độ hợp lệ thì bỏ qua. */
export function parseAdminPlace(raw: unknown): Destination | null {
  if (!isObject(raw)) return null
  const id = text(raw.id, 80)
  const name = text(raw.name, 120).trim()
  const { lat, lng } = raw
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id) || !name || !finite(lat) || !finite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null
  const category = (typeof raw.category === 'string' && raw.category !== 'legacy' && raw.category in categoryLabels ? raw.category : 'landmark') as DestinationCategory
  const crowd = Array.isArray(raw.crowd) && raw.crowd.length === 18 && raw.crowd.every(finite) ? raw.crowd.map(value => Math.max(0, Math.min(100, Math.round(value)))) : []
  const photos: PlacePhoto[] = Array.isArray(raw.photos) ? raw.photos.flatMap((photo): PlacePhoto[] => {
    if (!isObject(photo)) return []
    const url = safeUrl(photo.url)
    return url ? [{ url, caption: text(photo.caption, 200), credit: text(photo.credit, 200) }] : []
  }) : []
  return {
    id, name, position: [lat, lng], category, location: text(raw.area, 200), tags: stringList(raw.tags, 60),
    description: text(raw.description), detail: text(raw.detail), suggestedActivities: stringList(raw.activities),
    featuredScore: finite(raw.featuredScore) ? raw.featuredScore : 50, highlightReason: text(raw.highlight, 200),
    markerAsset: '', sourceUrl: '', coordinateSourceUrl: '', source: 'admin',
    hours: text(raw.hours, 200), hoursNote: text(raw.hoursNote), tip: text(raw.tip), address: text(raw.address, 300),
    crowd, crowdNote: text(raw.crowdNote, 200), photos,
  }
}

export function parsePlaceData(raw: unknown): PlaceData {
  const data: PlaceData = { sprites: {}, places: null }
  if (!isObject(raw)) return data
  if (isObject(raw.items)) {
    for (const [id, item] of Object.entries(raw.items)) {
      if (!isObject(item)) continue
      const url = safeUrl(item.url)
      if (!url) continue
      const ground = parseGround(item.ground)
      data.sprites[id] = { url, meters: finite(item.meters) && item.meters > 0 ? item.meters : 200, ...(ground ? { ground } : {}) }
    }
  }
  if (raw.managed === true && Array.isArray(raw.places)) {
    const seen = new Set<string>()
    data.places = raw.places.map(parseAdminPlace).filter((place): place is Destination => !!place && !seen.has(place.id) && !!seen.add(place.id))
  }
  return data
}

let snapshot: PlaceData = { sprites: {}, places: null }
let requested = false
let retryTimer: number | null = null
const listeners = new Set<() => void>()

export function reloadPlaceData() {
  requested = false
  ensureLoaded()
}

function ensureLoaded() {
  if (requested || typeof fetch !== 'function') return
  requested = true
  fetch('/api/pixel/places')
    .then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      return r.json()
    })
    .then(raw => {
      if (!raw) throw new Error('Empty payload')
      snapshot = parsePlaceData(raw)
      setLiveDestinations(snapshot.places) // trước khi báo cho giao diện, để getDestination đã thấy địa điểm mới
      listeners.forEach(listener => listener())
    })
    .catch(() => {
      requested = false
      // Tự động thử lại nếu Django chưa bật hoặc đang khởi động
      if (typeof window !== 'undefined' && !retryTimer) {
        retryTimer = window.setTimeout(() => {
          retryTimer = null
          ensureLoaded()
        }, 4000)
      }
    })
}

const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } }

/** Ảnh pixel do admin cài đặt; đồng thời kích hoạt việc tải danh sách địa điểm từ Django. Tự làm mới khi đổi tab. */
export function usePlaceData(): PlaceData {
  useEffect(() => {
    ensureLoaded()
    const handleFocus = () => { reloadPlaceData() }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])
  return useSyncExternalStore(subscribe, () => snapshot, () => snapshot)
}
