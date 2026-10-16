import { useEffect, useRef, useState } from 'react'
import LandmarkArt from './LandmarkArt'

function cameraError(cause: unknown) {
  const name = cause && typeof cause === 'object' && 'name' in cause ? String(cause.name) : ''
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'Chưa được phép dùng camera. Bạn có thể cho phép camera trong trình duyệt hoặc chọn ảnh từ thiết bị bên dưới.'
  if (name === 'NotFoundError') return 'Không tìm thấy webcam. Hãy kết nối camera hoặc chọn ảnh từ thiết bị bên dưới.'
  if (name === 'NotReadableError') return 'Không mở được webcam. Camera có thể đang được ứng dụng khác sử dụng hoặc bị hệ thống chặn. Bạn vẫn có thể tải ảnh lên.'
  return 'Không mở được camera. Hãy thử lại hoặc chọn ảnh từ thiết bị bên dưới.'
}

export default function CameraCapture({ disabled, onCapture, immersive = false }: { disabled: boolean; onCapture: (blob: Blob) => void; immersive?: boolean }) {
  const video = useRef<HTMLVideoElement>(null)
  const stream = useRef<MediaStream | null>(null)
  const generation = useRef(0)
  const pending = useRef(false)
  const [opened, setOpened] = useState(false)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [working, setWorking] = useState(false)
  function release() {
    generation.current++
    stream.current?.getTracks().forEach(track => track.stop())
    stream.current = null
    if (video.current) video.current.srcObject = null
    pending.current = false
  }
  useEffect(() => () => release(), [])
  function close() { release(); setOpened(false); setReady(false); setWorking(false) }
  async function start() {
    if (pending.current || stream.current) return
    pending.current = true
    const token = ++generation.current
    setError(''); setOpened(true); setWorking(true)
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera yêu cầu HTTPS hoặc localhost và trình duyệt hỗ trợ webcam. Bạn có thể chọn ảnh từ thiết bị.')
      const media = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false })
      if (token !== generation.current) { media.getTracks().forEach(track => track.stop()); return }
      stream.current = media
      if (video.current) { video.current.srcObject = media; await video.current.play() }
    } catch (cause) {
      if (token !== generation.current) return
      close()
      setError(cause instanceof Error && cause.message.startsWith('Camera yêu cầu') ? cause.message : cameraError(cause))
    } finally {
      if (token === generation.current) { pending.current = false; setWorking(false) }
    }
  }
  async function capture() {
    const element = video.current
    if (!element || !element.videoWidth || !element.videoHeight || pending.current) return
    pending.current = true; setWorking(true)
    const token = generation.current
    try {
      const canvas = document.createElement('canvas')
      const scale = Math.min(1, 1600 / Math.max(element.videoWidth, element.videoHeight))
      canvas.width = Math.round(element.videoWidth * scale); canvas.height = Math.round(element.videoHeight * scale)
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Không thể xử lý ảnh.')
      context.drawImage(element, 0, 0, canvas.width, canvas.height)
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Không chụp được ảnh.')), 'image/jpeg', .82))
      if (token !== generation.current) return
      close(); onCapture(blob)
    } catch { if (token === generation.current) { pending.current = false; setWorking(false); setError('Không chụp được ảnh. Hãy thử lại hoặc tải ảnh lên.') } }
  }
  return <div className={immersive ? 'immersive-camera' : undefined}>
    {immersive && !opened && <div className="camera-illustration"><LandmarkArt sunset/><span>Minh họa khung chụp · camera chưa bật</span></div>}
    {!opened && <button disabled={disabled} onClick={() => void start()}>Mở webcam</button>}
    {opened && <>
      <video ref={video} className="camera-preview" autoPlay muted playsInline aria-label="Hình ảnh trực tiếp từ webcam" onCanPlay={() => setReady(true)} />
      <p>{ready ? 'Camera đang bật. Ảnh chỉ được lưu sau khi bạn xác nhận.' : 'Đang chờ camera. Nếu trình duyệt hỏi, hãy chọn quyền bạn muốn cấp.'}</p>
      <div className="camera-actions"><button className={immersive ? 'shutter-button' : undefined} disabled={!ready || working || disabled} onClick={() => void capture()}>Chụp ảnh</button><button onClick={close}>Tắt camera</button></div>
    </>}
    {error && <p role="alert" className="error">{error}</p>}
  </div>
}


