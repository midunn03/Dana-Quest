import { getCityEvent, nextEventOccurrence } from './data/events'

export default function EventDetailsPage({ id }: { id: string }) {
  const event = getCityEvent(id)
  if (!event) return <main className="screen-page"><h1>Không tìm thấy sự kiện</h1><a href="#/su-kien">← Sự kiện</a></main>
  const next = nextEventOccurrence(event)
  return <main className="quest-page event-details">
    <nav className="quest-nav"><a href="#/su-kien">← Danh sách sự kiện</a><span className="event-status">{event.status === 'confirmed' ? 'Đã công bố' : 'Thời gian dự kiến'}</span></nav>
    <p className="eyebrow">SỰ KIỆN · ĐÀ NẴNG</p><h1>{event.title}</h1><p>{event.summary}</p>
    <section className="quest-panel"><h2>Thông tin</h2><dl className="event-facts"><div><dt>Thời gian</dt><dd>{next ? next.toLocaleString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : event.scheduleLabel}</dd></div><div><dt>Địa điểm</dt><dd>{event.location}</dd></div></dl></section>
    <p className="notice">Lịch có thể được đơn vị tổ chức điều chỉnh. Hãy kiểm tra nguồn chính thức trước khi khởi hành.</p>
    <div className="event-actions">{event.destinationId && <a className="primary-button" href={`#/dia-diem/${event.destinationId}`}>Xem địa điểm</a>}<a className="detail-secondary" href={event.sourceUrl} target="_blank" rel="noreferrer">Nguồn chính thức ↗</a></div>
  </main>
}

