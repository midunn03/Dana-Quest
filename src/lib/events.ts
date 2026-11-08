import { localeTag } from '../i18n/locale'
import { interpolate } from '../i18n/locale'
export interface EventItem {
  id: number
  title: string
  description: string
  kind: string
  placeId: string | null
  placeName: string
  placeLat?: number | null
  placeLng?: number | null
  radiusM?: number
  notifyBefore?: number
  featured?: boolean
  sourceUrl?: string
  start: string
  end: string
  status: 'live' | 'soon' | 'later'
  minutesUntil: number
}

/** Kiểm tra dữ liệu từ API trước khi dùng; bỏ qua mục sai dạng. */
export function parseEvents(data: unknown): EventItem[] {
  const items = (data as { items?: unknown })?.items
  if (!Array.isArray(items)) return []
  return items.filter((item): item is EventItem => !!item && typeof item === 'object'
    && typeof item.id === 'number' && typeof item.title === 'string'
    && typeof item.start === 'string' && typeof item.end === 'string'
    && (item.status === 'live' || item.status === 'soon' || item.status === 'later')
    && Number.isFinite(Date.parse(item.start)) && Number.isFinite(Date.parse(item.end)))
    .map(item => {
      const raw = item as unknown as Record<string, unknown>
      const lat = raw.placeLat, lng = raw.placeLng
      const hasPlace = typeof lat === 'number' && typeof lng === 'number'
        && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
      const radius = raw.radiusM
      const notifyBefore = raw.notifyBefore
      return {
        ...item,
        description: String(item.description ?? ''),
        kind: String(item.kind ?? 'other'),
        placeId: typeof item.placeId === 'string' ? item.placeId : null,
        placeName: String(item.placeName ?? ''),
        placeLat: hasPlace ? lat : null,
        placeLng: hasPlace ? lng : null,
        radiusM: typeof radius === 'number' && Number.isFinite(radius) && radius > 0 ? radius : 0,
        notifyBefore: typeof notifyBefore === 'number' && Number.isFinite(notifyBefore) && notifyBefore >= 0 ? notifyBefore : 30,
        featured: raw.featured === true,
        sourceUrl: typeof raw.sourceUrl === 'string' && /^https?:\/\//.test(raw.sourceUrl) ? raw.sourceUrl : '',
        minutesUntil: Number(item.minutesUntil) || 0,
      }
    })
}

const hhmm = (iso: string) => new Date(iso).toLocaleTimeString(localeTag(), { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Ho_Chi_Minh' })
const dayLabel = (iso: string) => new Date(iso).toLocaleDateString(localeTag(), { weekday: 'short', day: '2-digit', month: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' })

export const timeRange = (event: EventItem) => `${hhmm(event.start)}–${hhmm(event.end)}`
export const dateLabel = dayLabel

/** Câu nhắc ngắn cho sự kiện đang diễn ra hoặc sắp diễn ra. */
export function reminderText(event: EventItem): string | null {
  const where = event.placeName ? ` ${interpolate("tại ${0}",[event.placeName])}` : ''
  if (event.status === 'live') return interpolate("Đang diễn ra: ${0}${1} (${2})",[event.title,where,timeRange(event)])
  if (event.status === 'soon') return interpolate("Còn ${0} phút nữa: ${1}${2} (${3})",[Math.max(1, event.minutesUntil),event.title,where,timeRange(event)])
  return null
}
