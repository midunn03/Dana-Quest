import { useState } from 'react'
import { getCityEvent, nextEventOccurrence } from './data/events'
import { enableEventReminders, remindersEnabled } from './lib/eventReminders'

const SAVED_EVENTS_KEY = 'dana-saved-events-v1'

export default function EventDetailsPage({ id }: { id: string }) {
  const event = getCityEvent(id)
  const [saved, setSaved] = useState(() => JSON.parse(localStorage.getItem(SAVED_EVENTS_KEY) || '[]').includes(id))
  const [reminders, setReminders] = useState(remindersEnabled)
  const [error, setError] = useState('')
  if (!event) return <main className="screen-page"><h1>Không tìm thấy sự kiện</h1><a href="#/su-kien">← Sự kiện</a></main>
  const next = nextEventOccurrence(event)
  function toggleSaved() {
    const current: string[] = JSON.parse(localStorage.getItem(SAVED_EVENTS_KEY) || '[]')
    const updated = saved ? current.filter(item => item !== id) : [...new Set([...current, id])]
    localStorage.setItem(SAVED_EVENTS_KEY, JSON.stringify(updated)); setSaved(!saved)
  }
  async function turnOnReminder() {
    setError('')
    try { await enableEventReminders(); setReminders(true) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Không bật được thông báo.') }
  }
  return <main className="quest-page event-details">
    <nav className="quest-nav"><a href="#/su-kien">← Danh sách sự kiện</a><span className="event-status">{event.status === 'confirmed' ? 'Đã công bố' : 'Thời gian dự kiến'}</span></nav>
    <p className="eyebrow">SỰ KIỆN · ĐÀ NẴNG</p><h1>{event.title}</h1><p>{event.summary}</p>
    <section className="quest-panel"><h2>Thông tin</h2><dl className="event-facts"><div><dt>Thời gian</dt><dd>{next ? next.toLocaleString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : event.scheduleLabel}</dd></div><div><dt>Địa điểm</dt><dd>{event.location}</dd></div></dl></section>
    <p className="notice">Lịch có thể được đơn vị tổ chức điều chỉnh. Hãy kiểm tra nguồn chính thức trước khi khởi hành.</p>
    {error && <p className="error" role="alert">{error}</p>}
    <div className="event-actions">
      {event.destinationId && <a className="primary-button" href={`#/chi-duong/${event.destinationId}`}>Đi đến sự kiện</a>}
      {event.destinationId && <a className="detail-secondary" href={`#/dia-diem/${event.destinationId}`}>Xem địa điểm</a>}
      <button type="button" className="detail-secondary" aria-pressed={saved} onClick={toggleSaved}>{saved ? 'Đã lưu sự kiện' : 'Lưu sự kiện'}</button>
      <button type="button" className="detail-secondary" disabled={reminders} onClick={() => void turnOnReminder()}>{reminders ? 'Đã bật nhắc sự kiện' : 'Bật nhắc sự kiện'}</button>
      <a className="detail-secondary" href={event.sourceUrl} target="_blank" rel="noreferrer">Nguồn chính thức ↗</a>
    </div>
  </main>
}

