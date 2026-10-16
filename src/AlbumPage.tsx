import { useEffect, useState } from 'react'
import { deletePhoto, loadPhotos, type LocalPhoto } from './lib/photos'
import { hasSyncAccount } from './lib/accountSync'
import { destinations, getDestination } from './data/destinations'
import { getMissions } from './data/missions'
import { PhotoPreview } from './PhotoMission'
import LandmarkArt from './LandmarkArt'
import { notify } from './lib/notifications'
import ConfirmDialog from './ConfirmDialog'
import './Quest.css'
export default function AlbumPage() {
  const [photos, setPhotos] = useState<LocalPhoto[]>([])
  const [tab,setTab]=useState<'saved'|'discover'>('saved')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pendingDelete, setPendingDelete] = useState<LocalPhoto | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [accountMode] = useState(() => hasSyncAccount())
  useEffect(() => {
    let active = true
    loadPhotos().then(value => { if (active) setPhotos(value.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))) }).catch(() => { if (active) setError('Không đọc được album. Hãy tải lại trang.') }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])
  async function confirmDelete() {
    if (!pendingDelete || deleting) return
    setDeleting(true); setError('')
    try {
      await deletePhoto(pendingDelete.id)
      setPhotos(current => current.filter(photo => photo.id !== pendingDelete.id))
      setPendingDelete(null)
      notify('Ảnh đã xóa. Tiến độ và Green Coins không bị thay đổi.')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Không xóa được ảnh.') }
    finally { setDeleting(false) }
  }
  return <main className="album-screen screen-page"><header className="screen-heading"><a href="#/kham-pha" aria-label="Về bản đồ">‹</a><h1>Thư viện kỷ niệm</h1></header>
    <div className="album-tabs" role="group" aria-label="Lọc kỷ niệm"><button aria-pressed={tab==='saved'} onClick={()=>setTab('saved')}>Ảnh đã lưu ({photos.length})</button><button aria-pressed={tab==='discover'} onClick={()=>setTab('discover')}>Chưa khám phá</button></div>
    {loading && <p role="status">Đang đọc album…</p>}{error && <p role="alert" className="error">{error}</p>}
    {tab==='saved'&&<><div className="memory-grid">{photos.map(photo=>{
      const place=getDestination(photo.destinationId)
      const mission=place&&photo.missionId?getMissions(place).find(item=>item.id===photo.missionId):undefined
      const hasCaptureDate=typeof photo.createdAt==='number'&&Number.isFinite(photo.createdAt)
      return <article className="memory-card" key={photo.id}><PhotoPreview photo={photo} alt={`Ảnh tại ${place?.name??'điểm đến'}`} download/><div className="memory-info"><h2>{place?.name??'Điểm đến'}</h2><p>{mission?.title??'Chưa xác định nhiệm vụ'}</p>{hasCaptureDate?<time dateTime={new Date(photo.createdAt!).toISOString()}>{new Date(photo.createdAt!).toLocaleString('vi-VN')}</time>:<small>Ngày chụp chưa được lưu</small>}</div><button type="button" className="memory-delete" aria-label={`Xóa ảnh tại ${place?.name??'điểm đến'}`} title="Xóa ảnh" onClick={()=>setPendingDelete(photo)}>×</button><details><summary>Chi tiết kỷ niệm</summary><p>{mission?.title??'Chưa xác định nhiệm vụ'}</p>{hasCaptureDate&&<p>{new Date(photo.createdAt!).toLocaleString('vi-VN')}</p>}<a href={`#/nhiem-vu/${photo.destinationId}`}>Xem nhiệm vụ tại điểm đến</a></details></article>
    })}<a className="memory-add" href="#/kham-pha"><span>＋</span>Thêm kỷ niệm</a></div>{!loading&&photos.length===0&&<p className="album-note">Chưa có ảnh. Chọn một điểm đến và lưu ảnh nhiệm vụ đầu tiên của bạn.</p>}</>}
    {(tab==='discover'||photos.length===0)&&<><p className="album-note">Điểm đến gợi ý · hình minh họa, chưa phải ảnh của bạn</p><div className="memory-grid">{destinations.filter(place=>!photos.some(photo=>photo.destinationId===place.id)).map(place=><a className="memory-card illustrated-memory" key={place.id} href={`#/dia-diem/${place.id}`}><LandmarkArt id={place.id} sunset={place.id==='cau-rong'}/><h2>{place.name}</h2><small>Chưa có kỷ niệm</small></a>)}</div></>}
    <p className="album-note">{accountMode ? 'Ảnh của tài khoản được lưu trên máy chủ, chưa được AI xác minh. Hãy tải ảnh muốn giữ về máy.' : 'Ảnh được lưu trên trình duyệt này, chưa được AI xác minh. Hãy tải ảnh muốn giữ về máy.'}</p>
    <ConfirmDialog open={!!pendingDelete} title="Xóa ảnh này?" message="Ảnh đã lưu sẽ bị xóa vĩnh viễn. Tiến độ nhiệm vụ và Green Coins không thay đổi." confirmLabel="Xóa ảnh" busyLabel="Đang xóa…" busy={deleting} tone="danger" onCancel={()=>setPendingDelete(null)} onConfirm={()=>void confirmDelete()} />
  </main>
}
