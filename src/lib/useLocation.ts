import { t } from '../i18n/locale'
import { useEffect, useRef, useState } from 'react'
import { validLocation, type LocationSample } from './location'
import { notifyLocationPermissionNeeded } from './locationPermission'

export function useLocation(autoRequest = false) {
  const [sample, setSample] = useState<LocationSample | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [now, setNow] = useState(Date.now)
  const lifecycle = useRef({ generation: 0 })
  useEffect(() => {
    const active = lifecycle.current
    const timer = window.setInterval(() => setNow(Date.now()), 5000)
    return () => { window.clearInterval(timer); active.generation++ }
  }, [])
  useEffect(() => {
    if (autoRequest) request()
  }, [autoRequest])
  function request() {
    // Giữ vị trí cũ trong lúc đo lại: chỉ thay thế khi có kết quả mới hợp lệ.
    // Nếu lần đo mới thất bại, vị trí cũ (nếu còn dùng được) vẫn được giữ.
    setError('')
    if (!window.isSecureContext || !navigator.geolocation) { setError(t("Định vị cần trình duyệt hỗ trợ và địa chỉ HTTPS hoặc localhost.")); return }
    const current = ++lifecycle.current.generation
    setBusy(true)
    navigator.geolocation.getCurrentPosition(position => {
      if (current !== lifecycle.current.generation) return
      const value = { latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy, timestamp: position.timestamp }
      if (validLocation(value)) { setSample(value); setError('') }
      else setError(t("Thiết bị trả về vị trí không hợp lệ. Vẫn giữ vị trí đo được trước đó."))
      setNow(Date.now()); setBusy(false)
    }, cause => {
      if (current !== lifecycle.current.generation) return
      setError(cause.code === 1 ? t("Bạn chưa cho phép truy cập vị trí. Hãy cấp quyền trong trình duyệt rồi thử lại.") : cause.code === 3 ? t("Hết thời gian lấy vị trí. Vẫn giữ vị trí đo được trước đó; hãy thử lại ở nơi thoáng.") : t("Chưa lấy được vị trí. Vẫn giữ vị trí đo được trước đó; hãy bật dịch vụ vị trí rồi thử lại."))
      if (cause.code === 1) notifyLocationPermissionNeeded()
      setBusy(false)
    }, { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 })
  }
  // Đang đo lại trong khi đã có vị trí cũ: giao diện hiện "đang cập nhật".
  return { sample, busy, refreshing: busy && sample !== null, error, now, request }
}
