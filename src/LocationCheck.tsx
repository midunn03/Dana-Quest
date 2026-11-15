import { localeTag } from './i18n/locale'
import { interpolate } from './i18n/locale'
import { t } from './i18n/locale'
import { distanceMeters, hasArrived, isFresh, MAX_ACCURACY } from './lib/location'
import type { useLocation } from './lib/useLocation'

export default function LocationCheck({ location, target }: { location: ReturnType<typeof useLocation>; target: [number, number] }) {
  const { sample, busy, refreshing, error, now, request } = location
  const distance = sample ? distanceMeters([sample.latitude, sample.longitude], target) : null
  const distanceLabel = distance === null ? '' : distance < 1000 ? `${Math.round(distance)} m` : `${(distance / 1000).toLocaleString(localeTag(), { maximumFractionDigits: 1 })} km`
  return <section className="quest-panel" aria-label={t("Kiểm tra vị trí")}>
    <h2>{busy ? (sample ? t("Đang cập nhật vị trí của bạn…") : t("Đang xác định vị trí của bạn…")) : sample && hasArrived(sample, target, now) ? t("Bạn đã đến nơi!") : sample ? interpolate("Bạn còn cách ${0}",[distanceLabel]) : t("Khoảng cách đến điểm này")}</h2>
    {!sample && !busy && <p>{t("Cho phép dùng vị trí để DANA QUEST tự báo khi bạn đến gần và mở nhiệm vụ có mặt.")}</p>}
    {refreshing && <p className="muted">{t("Đang đo lại — vẫn hiển thị vị trí đo được trước đó.")}</p>}
    <button disabled={busy} onClick={request}>{busy ? t("Đang kiểm tra…") : sample ? t("Cập nhật khoảng cách") : t("Dùng vị trí của tôi")}</button>
    <div role="status">
      {error && <p className="error">{t(error)}</p>}
      {sample && <>
        <p>{t("Cập nhật lúc") + " "}{new Date(sample.timestamp).toLocaleTimeString(localeTag())} {" " + t("· độ chính xác khoảng") + " "}<strong>±{Math.ceil(sample.accuracy)} m</strong>.</p>
        <p className={hasArrived(sample, target, now) ? 'success' : 'notice'}>{!isFresh(sample, now) ? t("Vị trí đã cũ. Hãy cập nhật lại khoảng cách.") : sample.accuracy > MAX_ACCURACY ? t("Tín hiệu vị trí chưa đủ chính xác. Hãy thử lại ở nơi thoáng hơn.") : hasArrived(sample, target, now) ? t("Bạn đang ở đủ gần để thực hiện nhiệm vụ tại địa điểm.") : interpolate("Bạn chưa đến nơi. Còn khoảng ${0}.",[distanceLabel])}</p>
      </>}
    </div>
    <p className="muted">{t("Vị trí chỉ được dùng để tính khoảng cách và xác nhận bạn đã đến điểm khám phá.")}</p>
  </section>
}
