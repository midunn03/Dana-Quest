import { useState } from 'react'
import { dateLabel, timeRange, type EventItem } from './lib/events'
import { useEvents } from './lib/eventStore'
import { formatDistance } from './lib/eventNotifier'
import { disableEventReminders, enableEventReminders, remindersEnabled } from './lib/eventReminders'

const statusLabel = (event: EventItem) => event.status === 'live' ? 'Đang diễn ra' : event.status === 'soon' ? `Còn ${Math.max(1, event.minutesUntil)} phút` : 'Sắp tới'

export default function EventsPage() {
  const events = useEvents()
  const [enabled, setEnabled] = useState(remindersEnabled)
  const [error, setError] = useState('')
  async function toggleReminders() {
    setError('')
    if (enabled) { disableEventReminders(); setEnabled(false); return }
    try { await enableEventReminders(); setEnabled(true) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Không bật được thông báo.') }
  }
  return <main className="screen-page events-screen">
    <header className="screen-heading"><a href="#/kham-pha" aria-label="Về bản đồ">‹</a><h1>Sự kiện sắp tới</h1></header>
    <section className="reminder-card"><div><strong>Thông báo sự kiện</strong><p>Trong ứng dụng, bạn luôn được báo khi đến gần địa điểm có sự kiện hoặc có hoạt động nổi bật của Đà Nẵng. Bật thêm để nhận cả thông báo của thiết bị khi ứng dụng đang mở.</p></div><button type="button" aria-pressed={enabled} onClick={() => void toggleReminders()}>{enabled ? 'Đang bật' : 'Bật thông báo'}</button></section>
    {error && <p className="error" role="alert">{error}</p>}
    <div className="event-list">
      {!events.length && <p className="notice" role="status">Chưa có sự kiện sắp tới.</p>}
      {events.map(event => <a className="event-card" href={`#/su-kien/${event.id}`} key={`${event.id}-${event.start}`}>
        <span className="event-status">{event.featured ? 'Nổi bật · ' : ''}{statusLabel(event)}</span>
        <h2>{event.title}</h2>{event.description && <p>{event.description}</p>}
        <div><span>◷ {dateLabel(event.start)} · {timeRange(event)}</span>{event.placeName && <span>⌖ {event.placeName}</span>}</div>
        {!event.featured && event.radiusM > 0 && event.placeId && <small>Báo khi bạn trong {formatDistance(event.radiusM)} quanh địa điểm</small>}
      </a>)}
    </div>
  </main>
}
