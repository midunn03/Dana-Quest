import PixelLogo from './PixelLogo'
import { interpolate } from './i18n/locale'
import { t } from './i18n/locale'
import LandmarkArt from './LandmarkArt'
import PixelAvatar from './PixelAvatar'
import { avatars, readAvatar } from './lib/avatar'
import { useState } from 'react'
import { getDestination } from './data/destinations'
import { getMissions } from './data/missions'
import { emptyProgress, isDestinationComplete, requiredCount } from './lib/rules'
import './Quest.css'
import { useProgress } from './lib/useProgress'
import { useLocation } from './lib/useLocation'
import { hasArrived } from './lib/location'
import LocationCheck from './LocationCheck'
import PhotoMission from './PhotoMission'
import QuestLinks from './QuestLinks'
import ConfirmDialog from './ConfirmDialog'
import { usePlaceData } from './lib/placeContent'

export default function DestinationPage({ id }: { id: string }) {
  const [count, setCount] = useState(5)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const place = getDestination(id)
  const custom = usePlaceData().content[id]
  const heroPhoto = custom?.photos[0]
  const { state, loading, busy, error, corrupt, dispatch, resetProgress } = useProgress()
  const location = useLocation()
  const progress = state.destinations[id] ?? emptyProgress()
  if (loading) return <main className="quest-page arrival-screen"><p role="status">{t("Đang đọc tiến độ đã lưu…")}</p></main>
  if (!place) return <main className="quest-page arrival-screen"><a href="#/map">{t("← Bản đồ")}</a><h1>{t("Không tìm thấy điểm đến")}</h1></main>
  const missions = getMissions(place)
  const needed = requiredCount(progress.selected.length)
  return <main className="quest-page arrival-screen">
    <nav className="quest-nav"><a className="back-link" href="#/map">{t("← Bản đồ")}</a><a href="#/album">{t("Album ảnh")}</a><a href="#/" lang="en" aria-label="DANA QUEST"><PixelLogo compact/></a></nav>
    <h1>{location.sample && hasArrived(location.sample, place.position, location.now) ? interpolate("Đã đến ${0}!",[place.name]) : interpolate("Khám phá ${0}",[place.name])}</h1><div className="arrival-hero">{custom
      ? (heroPhoto ? <img className="destination-photo" src={heroPhoto.url} alt={heroPhoto.caption || place.name} /> : <span className="admin-hero-empty" aria-hidden="true" />)
      : place.photo
      ? <img className="destination-photo" src={`${import.meta.env.BASE_URL}${place.photo.replace(/^\//, '')}`} alt={interpolate("Ảnh thật ${0}",[place.name])} />
      : <LandmarkArt id={id}/>}<div className="arrival-explorer"><PixelAvatar avatar={readAvatar()??avatars[0]}/></div><span className="arrival-bubble">!</span>{!custom && place.photo && place.photoCredit && <span className="photo-credit">{t("Ảnh:") + " "}{place.photoCredit}</span>}</div>
    <details className="more-info"><summary>{t("Tiện ích hành trình")}</summary><QuestLinks /></details>
    {error && <p className="notice error" role="alert">{t(error)}</p>}
    {corrupt && <div className="notice error" role="alert"><p>{t("Dữ liệu tiến độ đã lưu bị hỏng nên không thể tiếp tục. Bạn có thể đặt lại tiến độ để chơi tiếp — một bản sao dữ liệu hỏng được giữ lại để khôi phục thủ công, ảnh đã lưu không bị xóa.")}</p><button type="button" className="cancel-quest-button" disabled={busy} onClick={() => setResetOpen(true)}>{t("Đặt lại tiến độ")}</button></div>}
    <ConfirmDialog open={resetOpen} title={t("Đặt lại tiến độ?")} message={t("Toàn bộ tiến độ nhiệm vụ, xu và voucher đã đổi sẽ bị xóa và bắt đầu lại từ đầu. Ảnh trong album được giữ lại. Bạn có chắc chắn?")} confirmLabel={t("Đặt lại")} busyLabel={t("Đang đặt lại…")} busy={busy} tone="danger" onCancel={() => setResetOpen(false)} onConfirm={() => void resetProgress().then(ok => { if (ok) setResetOpen(false) })} />
    <details className="more-info"><summary>{t("Kiểm tra đến nơi · thông tin địa điểm")}</summary>
      {custom ? <>{custom.description && <p>{custom.description}</p>}{custom.detail && <p>{custom.detail}</p>}{custom.address && <p>{custom.address}</p>}</> : <><p>{place.description}</p><p>{place.detail}</p><p>{place.location}</p></>}
      <LocationCheck location={location} target={place.position} />
      <p>{t("Tiến độ lưu theo tài khoản. Mỗi nhiệm vụ hoàn thành nhận 10 Xu Dana một lần.","Progress is saved to your account. Each completed mission awards 10 Dana Coins once.")}</p>
    </details>    <section className={`quest-panel ${progress.started ? 'compact-progress' : ''}`}>
      <h2>{progress.started ? t("Nhiệm vụ của bạn") : t("Chọn số lượng nhiệm vụ")}</h2>
      <p>{t("Bạn tự chọn điểm đến, không cần theo thứ tự. Hệ thống tự giao nhiệm vụ từ bộ 10 nhiệm vụ.")}</p>
      {progress.started ? <>
        <p>{t("Đã giao") + " "}{progress.selected.length} {" " + t("nhiệm vụ. Cần hoàn thành") + " "}{needed} {" " + t("nhiệm vụ (80%, làm tròn lên).")}</p>
        <progress max={progress.selected.length} value={progress.completed.length} aria-label={t("Tiến độ nhiệm vụ")} />
        <p>{progress.completed.length}/{progress.selected.length} {" " + t("nhiệm vụ đã xong.") + " "}{isDestinationComplete(progress) ? t("Đã hoàn thành điểm đến!") : interpolate("Cần thêm ${0} nhiệm vụ để hoàn thành điểm đến.",[needed - progress.completed.length])}</p>
        {progress.completed.length === 0 ? <button className="cancel-quest-button" type="button" disabled={busy} onClick={() => setCancelOpen(true)}>{t("Hủy hành trình này")}</button> : <p className="muted">{t("Hành trình đã có nhiệm vụ hoàn thành nên không thể hủy, tránh làm mất xu và tiến độ.")}</p>}
      </> : <>
        <label>{t("Số lượng nhiệm vụ") + " "}<select value={count} disabled={busy} onChange={event => setCount(Number(event.target.value))}>{[5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}</select></label>
        <p>{t("Cần hoàn thành") + " "}{requiredCount(count)}/{count} {" " + t("nhiệm vụ. Danh sách được giao và tiến độ sẽ giữ nguyên khi tải lại trang.")}</p>
        <button className="primary-button" disabled={busy} onClick={() => void dispatch({ type: 'assign', destinationId: id, count })}>{t("Nhận") + " "}{count} {" " + t("nhiệm vụ")}</button>
      </>}    </section>
    <div className="mission-list">{missions.filter(mission => progress.started && progress.selected.includes(mission.id)).sort((a,b) => Number(b.kind === 'photo') - Number(a.kind === 'photo')).map(mission => <article className="quest-panel" key={mission.id}>
      <h2>{mission.title}</h2>
      <p>{mission.description}</p>
      {progress.started && progress.completed.includes(mission.id) && <div><p className="success">{t("Đã hoàn thành · Đã nhận 10 Xu Dana","Completed · 10 Dana Coins received")}</p><a className="completion-link" href={`#/hoan-thanh/${id}/${mission.id}`}>{t("Xem phần thưởng đã nhận →")}</a></div>}
      {progress.started && (mission.kind === 'photo' ? <><a className="blue-button" href={`#/may-anh/${id}/${mission.id}`}>{t("Chụp ảnh toàn màn hình")}</a><PhotoMission destinationId={id} missionId={mission.id} completed={progress.completed.includes(mission.id)} busy={busy} onComplete={() => void dispatch({ type: 'complete', destinationId: id, missionId: mission.id })} /></> : !progress.completed.includes(mission.id) && <>
        <button disabled={busy || (mission.kind === 'arrival' && (!location.sample || !hasArrived(location.sample, place.position, location.now)))} onClick={() => void dispatch({ type: 'complete', destinationId: id, missionId: mission.id, location: location.sample ?? undefined })}>{mission.kind === 'arrival' ? t("Ghi nhận nhiệm vụ có mặt") : t("Tôi xác nhận đã hoàn thành")}</button>
        {mission.kind === 'arrival' && !location.sample && !location.busy && <p className="notice">{t("Chưa có vị trí của bạn. Hãy mở mục “Kiểm tra đến nơi · thông tin địa điểm” ở trên và bấm “Dùng vị trí của tôi”.")}</p>}
        {mission.kind === 'arrival' && location.sample && !hasArrived(location.sample, place.position, location.now) && <p className="notice">{t("Bạn chưa ở đủ gần điểm đến để ghi nhận. Mở mục “Kiểm tra đến nơi” ở trên để xem khoảng cách và cập nhật vị trí.")}</p>}
      </>)}
    </article>)}</div>
    <ConfirmDialog open={cancelOpen} title={t("Hủy hành trình này?")} message={interpolate("Danh sách nhiệm vụ tại ${0} sẽ bị xóa. Bạn có thể nhận một danh sách mới sau đó.",[place.name])} confirmLabel={t("Hủy hành trình")} busyLabel={t("Đang hủy…")} busy={busy} tone="danger" onCancel={() => setCancelOpen(false)} onConfirm={() => void dispatch({ type: 'cancel', destinationId: id }).then(ok => { if (ok) setCancelOpen(false) })} />
  </main>
}




