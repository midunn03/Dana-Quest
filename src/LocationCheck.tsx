import { distanceMeters, hasArrived, isFresh, MAX_ACCURACY } from './lib/location'
import type { useLocation } from './lib/useLocation'

export default function LocationCheck({ location, target }: { location: ReturnType<typeof useLocation>; target: [number, number] }) {
  const { sample, busy, refreshing, error, now, request } = location
  const distance = sample ? distanceMeters([sample.latitude, sample.longitude], target) : null
  const distanceLabel = distance === null ? '' : distance < 1000 ? `${Math.round(distance)} m` : `${(distance / 1000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} km`
  return <section className="quest-panel" aria-label="Kiểm tra vị trí">
    <h2>{busy ? (sample ? 'Đang cập nhật vị trí của bạn…' : 'Đang xác định vị trí của bạn…') : sample && hasArrived(sample, target, now) ? 'Bạn đã đến nơi!' : sample ? `Bạn còn cách ${distanceLabel}` : 'Khoảng cách đến điểm này'}</h2>
    {!sample && !busy && <p>Cho phép dùng vị trí để DANA QUEST tự báo khi bạn đến gần và mở nhiệm vụ có mặt.</p>}
    {refreshing && <p className="muted">Đang đo lại — vẫn hiển thị vị trí đo được trước đó.</p>}
    <button disabled={busy} onClick={request}>{busy ? 'Đang kiểm tra…' : sample ? 'Cập nhật khoảng cách' : 'Dùng vị trí của tôi'}</button>
    <div role="status">
      {error && <p className="error">{error}</p>}
      {sample && <>
        <p>Cập nhật lúc {new Date(sample.timestamp).toLocaleTimeString('vi-VN')} · độ chính xác khoảng <strong>±{Math.ceil(sample.accuracy)} m</strong>.</p>
        <p className={hasArrived(sample, target, now) ? 'success' : 'notice'}>{!isFresh(sample, now) ? 'Vị trí đã cũ. Hãy cập nhật lại khoảng cách.' : sample.accuracy > MAX_ACCURACY ? 'Tín hiệu vị trí chưa đủ chính xác. Hãy thử lại ở nơi thoáng hơn.' : hasArrived(sample, target, now) ? 'Bạn đang ở đủ gần để thực hiện nhiệm vụ tại địa điểm.' : `Bạn chưa đến nơi. Còn khoảng ${distanceLabel}.`}</p>
      </>}
    </div>
    <p className="muted">Vị trí chỉ được dùng để tính khoảng cách và xác nhận bạn đã đến điểm khám phá.</p>
  </section>
}
