import { distanceMeters } from './location'
import { timeRange, type EventItem } from './events'
import { remindersEnabled, showSystemNotification } from './eventReminders'

export interface EventNotice { key: string; eventId: number; title: string; body: string; reason: 'featured' | 'nearby' }

const NOTIFIED_KEY = 'dana-event-notified-v1'
const KEEP_MS = 3 * 24 * 3600_000

export const formatDistance = (meters: number) => meters < 1000 ? `${Math.max(10, Math.round(meters / 10) * 10)} m` : `${(meters / 1000).toFixed(1)} km`

/**
 * Chọn các thông báo cần gửi lúc này (mỗi lần diễn ra chỉ báo một lần):
 * - Hoạt động nổi bật (featured): báo cho mọi người, bất kể vị trí.
 * - Sự kiện gắn địa điểm: chỉ báo khi người chơi nằm trong bán kính (radiusM) quanh địa điểm đó.
 * Cả hai chỉ báo khi sự kiện đang diễn ra hoặc sắp bắt đầu trong `notifyBefore` phút.
 */
export function dueNotices(events: EventItem[], player: { lat: number; lng: number } | null, now: number, done: ReadonlySet<string>): EventNotice[] {
  const notices: EventNotice[] = []
  for (const event of events) {
    const key = `${event.id}:${event.start}`
    if (done.has(key)) continue
    const start = Date.parse(event.start), end = Date.parse(event.end)
    const live = start <= now && now < end
    const minutes = Math.ceil((start - now) / 60_000)
    if (!live && !(minutes > 0 && minutes <= event.notifyBefore)) continue
    const when = live ? 'Đang diễn ra' : `Còn ${minutes} phút nữa`
    const where = event.placeName ? ` tại ${event.placeName}` : ''
    if (event.featured) {
      notices.push({ key, eventId: event.id, reason: 'featured', title: `Nổi bật ở Đà Nẵng: ${event.title}`, body: `${when}${where} · ${timeRange(event)}` })
      continue
    }
    if (player && event.radiusM > 0 && event.placeLat !== null && event.placeLng !== null) {
      const meters = distanceMeters([player.lat, player.lng], [event.placeLat, event.placeLng])
      if (meters <= event.radiusM) {
        notices.push({ key, eventId: event.id, reason: 'nearby', title: `${event.title}${where}`, body: `${when} · bạn đang cách ${formatDistance(meters)} · ${timeRange(event)}` })
      }
    }
  }
  return notices
}

function readDone(now: number): Record<string, number> {
  try {
    const stored = JSON.parse(localStorage.getItem(NOTIFIED_KEY) ?? '{}') as Record<string, number>
    return Object.fromEntries(Object.entries(stored).filter(([, at]) => Number.isFinite(at) && now - at < KEEP_MS))
  } catch { return {} }
}

/** Gửi các thông báo đến hạn: luôn hiện trong app, và thêm thông báo hệ thống nếu người chơi đã bật nhắc. */
export function runEventNotifications(events: EventItem[], player: { lat: number; lng: number } | null, now = Date.now()) {
  const done = readDone(now)
  const due = dueNotices(events, player, now, new Set(Object.keys(done)))
  if (!due.length) return due
  due.forEach(notice => {
    done[notice.key] = now
    window.dispatchEvent(new CustomEvent('dana-toast', { detail: `${notice.title} — ${notice.body}` }))
    if (remindersEnabled()) void showSystemNotification(String(notice.eventId), notice.title, notice.body).catch(() => undefined)
  })
  try { localStorage.setItem(NOTIFIED_KEY, JSON.stringify(done)) } catch { /* bộ nhớ đầy hoặc bị chặn: có thể báo lặp, không ảnh hưởng chức năng khác */ }
  return due
}
