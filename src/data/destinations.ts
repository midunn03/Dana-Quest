import { useSyncExternalStore } from 'react'
import destinationRecords from './destinations.json'
import historicRecords from './historicalDestinations.json'

export type DestinationCategory = 'landmark' | 'museum' | 'park' | 'beach' | 'pagoda' | 'nature' | 'heritage' | 'legacy'
export type ActivityAvailability = 'unknown' | 'verified'

export interface PlacePhoto { url: string; caption: string; credit: string }

export interface Destination {
  id: string
  name: string
  position: [number, number]
  location: string
  category: DestinationCategory
  tags: string[]
  description: string
  detail: string
  suggestedActivities: string[]
  featuredScore: number
  highlightReason: string
  markerAsset: string
  /** Ghim đại diện cho bao nhiêu mét ngoài đời; quyết định kích thước khi zoom (mặc định 70). */
  markerMeters?: number
  sourceUrl: string
  coordinateSourceUrl: string
  photo?: string
  photoCredit?: string
  photoSourceUrl?: string
  coordinateNote?: string
  activityAvailability?: ActivityAvailability
  verificationNote?: string
  /** 'admin' = địa điểm do Django admin quản lý (nội dung và ảnh lấy từ máy chủ); mặc định là địa điểm mẫu trong code. */
  source?: 'builtin' | 'admin'
  hours?: string
  hoursNote?: string
  tip?: string
  address?: string
  /** 18 mức đông đúc (0–100) cho 6:00 → 23:00; rỗng = chưa có dữ liệu. */
  crowd?: number[]
  crowdNote?: string
  photos?: PlacePhoto[]
}

type DestinationRecord = Omit<Destination, 'position'> & { position: number[] }

function normalizeDestinations(records: DestinationRecord[]): Destination[] {
  return records.map(record => ({
  ...record,
  position: record.position as [number, number],
  }))
}

// Danh sách mẫu trong code: dùng khi chưa có máy chủ Django hoặc admin chưa có địa điểm nào.
export const destinations = normalizeDestinations(destinationRecords as unknown as DestinationRecord[])
export const historicalDestinations = normalizeDestinations(historicRecords as unknown as DestinationRecord[])

// Danh sách đang dùng: lấy từ Django admin khi có (thêm/sửa/xóa địa điểm ở đó), nếu không thì dùng danh sách mẫu.
let current: Destination[] = destinations
const listeners = new Set<() => void>()
export const getDestinations = () => current
export function setLiveDestinations(list: Destination[] | null) {
  current = list ?? destinations
  listeners.forEach(listener => listener())
}
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } }
/** Danh sách địa điểm hiện hành; tự cập nhật khi tải được dữ liệu từ Django. */
export const useDestinations = () => useSyncExternalStore(subscribe, getDestinations, getDestinations)

// Địa điểm đã bị xóa khỏi admin vẫn tra được (từ danh sách mẫu/lưu trữ) để tiến độ cũ của người chơi không bị hỏng.
export const getDestination = (id: string) => current.find(place => place.id === id)
  ?? destinations.find(place => place.id === id) ?? historicalDestinations.find(place => place.id === id)

export const categoryLabels: Record<DestinationCategory, string> = {
  landmark: 'Kiến trúc',
  museum: 'Bảo tàng',
  park: 'Công viên',
  beach: 'Biển',
  pagoda: 'Chùa',
  nature: 'Thiên nhiên',
  heritage: 'Di tích',
  legacy: 'Lưu trữ',
}
