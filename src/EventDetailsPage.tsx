import { dateLabel, timeRange } from './lib/events'
import { useEvents } from './lib/eventStore'
import { getDestination } from './data/destinations'
import { formatDistance } from './lib/eventNotifier'

export default function EventDetailsPage({ id }: { id: string }) {
  const events = useEvents()
  const event = events.find(item => String(item.id) === id)
  if (!event) return <main className="screen-page"><h1>Không tìm thấy sự kiện</h1><p>Sự kiện có thể đã kết thúc hoặc đang tải.</p><a href="#/su-kien">← Sự kiện</a></main>
  const place = event.placeId ? getDestination(event.placeId) : undefined
  return <main className="quest-page event-details">
    <nav className="quest-nav"><a href="#/su-kien">← Danh sách sự kiện</a><span className="event-status">{event.featured ? 'Hoạt động nổi bật' : event.status === 'live' ? 'Đang diễn ra' : 'Sắp tới'}</span></nav>
    <p className="eyebrow">SỰ KIỆN · ĐÀ NẴNG</p><h1>{event.title}</h1>{event.description && <p>{event.description}</p>}
    <section className="quest-panel"><h2>Thông tin</h2><dl className="event-facts">
      <div><dt>Thời gian</dt><dd>{dateLabel(event.start)} · {timeRange(event)}</dd></div>
      {event.placeName && <div><dt>Địa điểm</dt><dd>{event.placeName}</dd></div>}
      {!event.featured && event.radiusM > 0 && event.placeId && <div><dt>Thông báo</dt><dd>Khi bạn trong {formatDistance(event.radiusM)} quanh địa điểm</dd></div>}
    </dl></section>
    <p className="notice">Lịch có thể được đơn vị tổ chức điều chỉnh. Hãy kiểm tra nguồn chính thức trước khi khởi hành.</p>
    <div className="event-actions">{place && <a className="primary-button" href={`#/dia-diem/${place.id}`}>Xem địa điểm</a>}{event.sourceUrl && <a className="detail-secondary" href={event.sourceUrl} target="_blank" rel="noreferrer">Nguồn thông tin ↗</a>}</div>
  </main>
}
