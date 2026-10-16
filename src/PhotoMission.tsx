import CameraCapture from './CameraCapture'
import { notify } from './lib/notifications'
import { useEffect, useRef, useState } from 'react'
import { loadPhotos, photoKey, preparePhoto, savePhoto, type LocalPhoto } from './lib/photos'
import { checkImageLocally, type ImageCheckResult } from './lib/localImageCheck'

export function PhotoPreview({ photo, alt, download = false }: { photo: LocalPhoto; alt: string; download?: boolean }) {
  const image = useRef<HTMLImageElement>(null)
  const link = useRef<HTMLAnchorElement>(null)
  useEffect(() => {
    const url = URL.createObjectURL(photo.blob)
    if (image.current) image.current.src = url
    if (link.current) link.current.href = url
    return () => URL.revokeObjectURL(url)
  }, [photo, download])
  return <><img ref={image} className="mission-photo" alt={alt} />{download && <a ref={link} download={`dana-quest-${photo.id.replace(':', '-')}.jpg`}>Tải ảnh về máy</a>}</>
}

export default function PhotoMission({ destinationId, missionId, completed, busy, onComplete, immersive = false }: { destinationId: string; missionId: string; completed: boolean; busy: boolean; onComplete: () => void; immersive?: boolean }) {
  const [photo, setPhoto] = useState<LocalPhoto | null>(null)
  const [draft, setDraft] = useState<LocalPhoto | null>(null)
  const [cameraKey, setCameraKey] = useState(0)
  const lock = useRef(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [imageCheck, setImageCheck] = useState<ImageCheckResult | null>(null)
  // Người dùng đã tự kiểm tra và chấp nhận dùng ảnh dù kiểm tra tự động fail
  // (ví dụ ảnh chụp ban đêm). Đặt lại mỗi khi có ảnh mới cần kiểm tra.
  const [allowFail, setAllowFail] = useState(false)
  useEffect(() => {
    let active = true
    loadPhotos().then(async photos => { const saved = photos.find(item => item.id === photoKey(destinationId, missionId)) ?? null; if (active) setPhoto(saved); if (saved) { const result = await checkImageLocally(saved.blob); if (active) setImageCheck(result) } }).catch(() => { if (active) setError('Không đọc được ảnh đã lưu. Hãy tải lại trang.') })
    return () => { active = false }
  }, [destinationId, missionId])
  async function upload(file?: File) {
    if (!file || lock.current) return
    lock.current = true; setCameraKey(key => key + 1)
    setSaving(true); setError('')
    try {
      const blob = await preparePhoto(file)
      const value = { id: photoKey(destinationId, missionId), destinationId, missionId, blob, createdAt: Date.now() }
      setDraft(value); setAllowFail(false); setImageCheck({ status: 'checking', message: 'Đang kiểm tra chất lượng ảnh ngay trên thiết bị…' }); setImageCheck(await checkImageLocally(blob))
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Không lưu được ảnh.') }
    finally { lock.current = false; setSaving(false) }
  }
  async function saveDraft() {
    if (!draft || lock.current) return
    lock.current = true; setSaving(true); setError('')
    try { await savePhoto(draft); setPhoto(draft); setDraft(null); notify('Đã lưu ảnh vào album.') }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Không lưu được ảnh. Hãy thử lại.') }
    finally { lock.current = false; setSaving(false) }
  }
  async function setCapturedDraft(value: LocalPhoto) { setError(''); setDraft(value); setAllowFail(false); setImageCheck({ status: 'checking', message: 'Đang kiểm tra chất lượng ảnh ngay trên thiết bị…' }); setImageCheck(await checkImageLocally(value.blob)) }
  return <div className="photo-mission-flow">
    <p className="notice">Kiểm tra ảnh miễn phí trên thiết bị: phát hiện ảnh quá tối, quá sáng, quá nhỏ hoặc thiếu chi tiết. Công cụ không nhận diện chính xác địa danh.</p>
    {photo && <PhotoPreview photo={photo} alt="Ảnh bạn đã lưu cho nhiệm vụ" />}
    {!completed && <>
      <CameraCapture immersive={immersive} key={cameraKey} disabled={saving || busy} onCapture={blob => void setCapturedDraft({ id: photoKey(destinationId, missionId), destinationId, missionId, blob, createdAt: Date.now() })} />
      {draft && <section aria-label="Xem trước ảnh"><p>Ảnh xem trước — chưa lưu</p><PhotoPreview photo={draft} alt="Ảnh xem trước trước khi lưu" /><div className="camera-actions"><button disabled={saving || busy} onClick={() => void saveDraft()}>Lưu ảnh</button><button disabled={saving || busy} onClick={() => setDraft(null)}>Bỏ ảnh này</button></div></section>}      <label className="photo-input">Chọn ảnh từ thiết bị<input type="file" accept="image/jpeg,image/png,image/webp" disabled={saving || busy} onChange={event => { void upload(event.target.files?.[0]); event.target.value = '' }} /></label>
      <p className="muted">JPG, PNG, WebP · Tối đa 10 MB. Lưu 1 ảnh/nhiệm vụ; ảnh mới thay ảnh cũ trước khi hoàn thành. Ảnh được thu nhỏ để tiết kiệm bộ nhớ.</p>
      <p role="status">{saving ? 'Đang xử lý và lưu ảnh…' : photo ? 'Đã lưu ảnh. Chưa tự động hoàn thành nhiệm vụ.' : 'Chưa có ảnh được lưu.'}</p>
      {imageCheck && <p className={`image-check ${imageCheck.status}`} role="status"><strong>{imageCheck.status === 'pass' ? '✓ Ảnh đạt kiểm tra' : imageCheck.status === 'fail' ? 'Ảnh chưa đạt' : 'Cần bạn kiểm tra'}:</strong> {imageCheck.message}</p>}
      {imageCheck?.status === 'fail' && <div className="notice" role="note"><p>Kiểm tra tự động chỉ mang tính gợi ý — ví dụ ảnh chụp ban đêm thường bị đánh giá là "quá tối" dù hoàn toàn hợp lệ. Nếu bạn đã xem ảnh và thấy phù hợp với nhiệm vụ, hãy tick bên dưới để tiếp tục.</p><label className="image-check-override"><input type="checkbox" checked={allowFail} disabled={saving || busy} onChange={event => setAllowFail(event.target.checked)} /> Tôi đã tự kiểm tra ảnh và vẫn muốn dùng ảnh này</label></div>}
      <div className="photo-complete-bar"><button disabled={!photo || !!draft || saving || busy || imageCheck?.status === 'checking' || (imageCheck?.status === 'fail' && !allowFail)} onClick={onComplete}>{imageCheck?.status === 'pass' ? 'Xác nhận ảnh và hoàn thành' : 'Tôi đã kiểm tra · Hoàn thành'}</button></div>
    </>}
    {error && <p role="alert" className="error">{error}</p>}
  </div>
}

