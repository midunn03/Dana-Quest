export interface EventItem {
  id: number
  title: string
  description: string
  kind: string
  placeId: string | null
  placeName: string
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
    .map(item => ({ ...item, description: String(item.description ?? ''), kind: String(item.kind ?? 'other'), placeId: typeof item.placeId === 'string' ? item.placeId : null, placeName: String(item.placeName ?? ''), minutesUntil: Number(item.minutesUntil) || 0 }))
}

const hhmm = (iso: string) => new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Ho_Chi_Minh' })
const dayLabel = (iso: string) => new Date(iso).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' })

export const timeRange = (event: EventItem) => `${hhmm(event.start)}–${hhmm(event.end)}`
export const dateLabel = dayLabel

/** Câu nhắc ngắn cho sự kiện đang diễn ra hoặc sắp diễn ra. */
export function reminderText(event: EventItem): string | null {
  const where = event.placeName ? ` tại ${event.placeName}` : ''
  if (event.status === 'live') return `Đang diễn ra: ${event.title}${where} (${timeRange(event)})`
  if (event.status === 'soon') return `Còn ${Math.max(1, event.minutesUntil)} phút nữa: ${event.title}${where} (${timeRange(event)})`
  return null
}
