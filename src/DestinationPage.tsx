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

export default function DestinationPage({ id }: { id: string }) {
  const [count, setCount] = useState(5)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const place = getDestination(id)
  const { state, loading, busy, error, corrupt, dispatch, resetProgress } = useProgress()
  const location = useLocation()
  const progress = state.destinations[id] ?? emptyProgress()
  if (loading) return <main className="quest-page arrival-screen"><p role="status">Đang đọc tiến độ đã lưu…</p></main>
  if (!place) return <main className="quest-page arrival-screen"><a href="#/kham-pha">← Bản đồ</a><h1>Không tìm thấy điểm đến</h1></main>
  const missions = getMissions(place)
  const needed = requiredCount(progress.selected.length)
  return <main className="quest-page arrival-screen">
    <nav className="quest-nav"><a className="back-link" href="#/kham-pha">← Bản đồ</a><a href="#/album">Album ảnh</a><a href="#/">DANA QUEST</a></nav>
    <h1>{location.sample && hasArrived(location.sample, place.position, location.now) ? `Đã đến ${place.name}!` : `Khám phá ${place.name}`}</h1><div className="arrival-hero">{place.photo
      ? <img className="destination-photo" src={`${import.meta.env.BASE_URL}${place.photo.replace(/^\//, '')}`} alt={`Ảnh thật ${place.name}`} />
      : <LandmarkArt id={id}/>}<div className="arrival-explorer"><PixelAvatar avatar={readAvatar()??avatars[0]}/></div><span className="arrival-bubble">!</span>{place.photo && place.photoCredit && <span className="photo-credit">Ảnh: {place.photoCredit}</span>}</div>
    <details className="more-info"><summary>Tiện ích hành trình</summary><QuestLinks /></details>
    {error && <p className="notice error" role="alert">{error}</p>}
    {corrupt && <div className="notice error" role="alert"><p>Dữ liệu tiến độ đã lưu bị hỏng nên không thể tiếp tục. Bạn có thể đặt lại tiến độ để chơi tiếp — một bản sao dữ liệu hỏng được giữ lại để khôi phục thủ công, ảnh đã lưu không bị xóa.</p><button type="button" className="cancel-quest-button" disabled={busy} onClick={() => setResetOpen(true)}>Đặt lại tiến độ</button></div>}
    <ConfirmDialog open={resetOpen} title="Đặt lại tiến độ?" message="Toàn bộ tiến độ nhiệm vụ, xu và voucher đã đổi sẽ bị xóa và bắt đầu lại từ đầu. Ảnh trong album được giữ lại. Bạn có chắc chắn?" confirmLabel="Đặt lại" busyLabel="Đang đặt lại…" busy={busy} tone="danger" onCancel={() => setResetOpen(false)} onConfirm={() => void resetProgress().then(ok => { if (ok) setResetOpen(false) })} />
    <details className="more-info"><summary>Kiểm tra đến nơi · thông tin địa điểm</summary>
      <p>{place.description}</p><p>{place.detail}</p><p>{place.location}</p>
      <LocationCheck location={location} target={place.position} />
      <p>Tiến độ lưu trên trình duyệt này. Mỗi nhiệm vụ hoàn thành nhận 10 Green Coins demo một lần. Chưa có xác minh AI.</p>
    </details>    <section className={`quest-panel ${progress.started ? 'compact-progress' : ''}`}>
      <h2>{progress.started ? 'Nhiệm vụ của bạn' : 'Chọn số lượng nhiệm vụ'}</h2>
      <p>Bạn tự chọn điểm đến, không cần theo thứ tự. Hệ thống tự giao nhiệm vụ từ bộ 10 nhiệm vụ.</p>
      {progress.started ? <>
        <p>Đã giao {progress.selected.length} nhiệm vụ. Cần hoàn thành {needed} nhiệm vụ (80%, làm tròn lên).</p>
        <progress max={progress.selected.length} value={progress.completed.length} aria-label="Tiến độ nhiệm vụ" />
        <p>{progress.completed.length}/{progress.selected.length} nhiệm vụ đã xong. {isDestinationComplete(progress) ? 'Đã hoàn thành điểm đến!' : `Cần thêm ${needed - progress.completed.length} nhiệm vụ để hoàn thành điểm đến.`}</p>
        {progress.completed.length === 0 ? <button className="cancel-quest-button" type="button" disabled={busy} onClick={() => setCancelOpen(true)}>Hủy hành trình này</button> : <p className="muted">Hành trình đã có nhiệm vụ hoàn thành nên không thể hủy, tránh làm mất xu và tiến độ.</p>}
      </> : <>
        <label>Số lượng nhiệm vụ <select value={count} disabled={busy} onChange={event => setCount(Number(event.target.value))}>{[5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}</select></label>
        <p>Cần hoàn thành {requiredCount(count)}/{count} nhiệm vụ. Danh sách được giao và tiến độ sẽ giữ nguyên khi tải lại trang.</p>
        <button className="primary-button" disabled={busy} onClick={() => void dispatch({ type: 'assign', destinationId: id, count })}>Nhận {count} nhiệm vụ</button>
      </>}    </section>
    <div className="mission-list">{missions.filter(mission => progress.started && progress.selected.includes(mission.id)).sort((a,b) => Number(b.kind === 'photo') - Number(a.kind === 'photo')).map(mission => <article className="quest-panel" key={mission.id}>
      <h2>{mission.title}</h2>
      <p>{mission.description}</p>
      {progress.started && progress.completed.includes(mission.id) && <div><p className="success">Đã hoàn thành · Đã nhận 10 xu demo</p><a className="completion-link" href={`#/hoan-thanh/${id}/${mission.id}`}>Xem phần thưởng đã nhận →</a></div>}
      {progress.started && (mission.kind === 'photo' ? <><a className="blue-button" href={`#/may-anh/${id}/${mission.id}`}>Chụp ảnh toàn màn hình</a><PhotoMission destinationId={id} missionId={mission.id} completed={progress.completed.includes(mission.id)} busy={busy} onComplete={() => void dispatch({ type: 'complete', destinationId: id, missionId: mission.id })} /></> : !progress.completed.includes(mission.id) && <>
        <button disabled={busy || (mission.kind === 'arrival' && (!location.sample || !hasArrived(location.sample, place.position, location.now)))} onClick={() => void dispatch({ type: 'complete', destinationId: id, missionId: mission.id, location: location.sample ?? undefined })}>{mission.kind === 'arrival' ? 'Ghi nhận nhiệm vụ có mặt' : 'Tôi xác nhận đã hoàn thành'}</button>
        {mission.kind === 'arrival' && !location.sample && !location.busy && <p className="notice">Chưa có vị trí của bạn. Hãy mở mục “Kiểm tra đến nơi · thông tin địa điểm” ở trên và bấm “Dùng vị trí của tôi”.</p>}
        {mission.kind === 'arrival' && location.sample && !hasArrived(location.sample, place.position, location.now) && <p className="notice">Bạn chưa ở đủ gần điểm đến để ghi nhận. Mở mục “Kiểm tra đến nơi” ở trên để xem khoảng cách và cập nhật vị trí.</p>}
      </>)}
    </article>)}</div>
    <ConfirmDialog open={cancelOpen} title="Hủy hành trình này?" message={`Danh sách nhiệm vụ tại ${place.name} sẽ bị xóa. Bạn có thể nhận một danh sách mới sau đó.`} confirmLabel="Hủy hành trình" busyLabel="Đang hủy…" busy={busy} tone="danger" onCancel={() => setCancelOpen(false)} onConfirm={() => void dispatch({ type: 'cancel', destinationId: id }).then(ok => { if (ok) setCancelOpen(false) })} />
  </main>
}




