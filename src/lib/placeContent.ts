import { useEffect, useSyncExternalStore } from 'react'

/** Ảnh dán xuống mặt đất: tâm (lat,lng), kích thước ngoài đời (mét) và góc xoay (độ). */
export interface GroundInfo { lat: number; lng: number; widthM: number; heightM: number; rotation: number }
export interface PlaceSpriteInfo { url: string; meters: number; ground?: GroundInfo }
export interface AdminPhoto { url: string; caption: string; credit: string }
/** Nội dung trang chi tiết do admin (Django) viết cho từng địa điểm. */
export interface AdminContent {
  description: string; detail: string; highlight: string; activities: string[]
  hours: string; hoursNote: string; tip: string; address: string; photos: AdminPhoto[]
}
export interface PlaceData { sprites: Record<string, PlaceSpriteInfo>; content: Record<string, AdminContent> }

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const text = (value: unknown, max = 5000) => typeof value === 'string' ? value.slice(0, max) : ''
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)
// Chỉ nhận đường dẫn ảnh do máy chủ của mình trả về (hoặc https), không nhận javascript: hay data:
const safeUrl = (value: unknown) => typeof value === 'string' && /^(\/[^/]|https?:\/\/)/.test(value) ? value : ''

export function parseGround(raw: unknown): GroundInfo | undefined {
  if (!isObject(raw)) return undefined
  const { lat, lng, widthM, heightM, rotation } = raw
  if (!finite(lat) || !finite(lng) || !finite(widthM) || !finite(heightM) || widthM <= 0 || heightM <= 0) return undefined
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return undefined
  return { lat, lng, widthM, heightM, rotation: finite(rotation) ? rotation : 0 }
}

export function parsePlaceData(raw: unknown): PlaceData {
  const data: PlaceData = { sprites: {}, content: {} }
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
  if (isObject(raw.content)) {
    for (const [id, item] of Object.entries(raw.content)) {
      if (!isObject(item)) continue
      const photos = Array.isArray(item.photos) ? item.photos.flatMap((photo): AdminPhoto[] => {
        if (!isObject(photo)) return []
        const url = safeUrl(photo.url)
        return url ? [{ url, caption: text(photo.caption, 200), credit: text(photo.credit, 200) }] : []
      }) : []
      data.content[id] = {
        description: text(item.description), detail: text(item.detail), highlight: text(item.highlight, 200),
        activities: Array.isArray(item.activities) ? item.activities.filter((line): line is string => typeof line === 'string' && line.trim() !== '').map(line => line.slice(0, 300)) : [],
        hours: text(item.hours, 200), hoursNote: text(item.hoursNote), tip: text(item.tip), address: text(item.address, 300), photos,
      }
    }
  }
  return data
}

let snapshot: PlaceData = { sprites: {}, content: {} }
let requested = false
const listeners = new Set<() => void>()

function ensureLoaded() {
  if (requested || typeof fetch !== 'function') return
  requested = true
  fetch('/api/pixel/places').then(r => r.ok ? r.json() : null).then(raw => {
    if (!raw) return
    snapshot = parsePlaceData(raw)
    listeners.forEach(listener => listener())
  }).catch(() => { requested = false })
}

const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } }

/** Dữ liệu địa điểm do admin cài đặt. Chưa tải được thì rỗng (giao diện dùng nội dung mặc định). */
export function usePlaceData(): PlaceData {
  useEffect(() => { ensureLoaded() }, [])
  return useSyncExternalStore(subscribe, () => snapshot, () => snapshot)
}
