import { useState } from 'react'
import { cityEvents, nextEventOccurrence } from './data/events'
import { disableEventReminders, enableEventReminders, remindersEnabled } from './lib/eventReminders'

export default function EventsPage() {
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
    <section className="reminder-card"><div><strong>Nhắc sự kiện nổi bật</strong><p>Thông báo khi app đang mở hoặc PWA đang hoạt động. Lịch có thể thay đổi; hãy kiểm tra nguồn trước khi đi.</p></div><button type="button" aria-pressed={enabled} onClick={() => void toggleReminders()}>{enabled ? 'Đang bật' : 'Bật nhắc'}</button></section>
    {error && <p className="error" role="alert">{error}</p>}
    <div className="event-list">{cityEvents.map(event => {
      const next = nextEventOccurrence(event)
      return <a className="event-card" href={`#/su-kien/${event.id}`} key={event.id}><span className="event-status">{event.status === 'confirmed' ? 'Đã công bố' : 'Dự kiến'}</span><h2>{event.title}</h2><p>{event.summary}</p><div><span>◷ {next ? next.toLocaleString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : event.scheduleLabel}</span><span>⌖ {event.location}</span></div></a>
    })}</div>
  </main>
}

