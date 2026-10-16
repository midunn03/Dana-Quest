import { useCallback, useEffect, useRef, useState } from 'react'
import { isFresh, type LocationSample } from './location'
import { notifyLocationPermissionNeeded } from './locationPermission'

// Get an initial network/cached fix quickly while GPS improves in the background.
export const QUICK_LOCATION_OPTIONS = { enableHighAccuracy: false, maximumAge: 30_000, timeout: 5_000 }
export const LIVE_LOCATION_OPTIONS = { enableHighAccuracy: true, maximumAge: 5_000, timeout: 10_000 }
export const NAVIGATION_MAX_ACCURACY = 150
export function usePlayerLocation() {
  const [sample, setSample] = useState<LocationSample | null>(null)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const latest = useRef<LocationSample | null>(null)
  const updatePosition = useCallback((position: GeolocationPosition) => {
    const value = { latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy, timestamp: position.timestamp }
    if (!isFresh(value)) return false
    const previous = latest.current
    // A delayed network fix must not move a fresh precise GPS fix backwards.
    if (previous && isFresh(previous) && (value.timestamp < previous.timestamp || (previous.accuracy <= NAVIGATION_MAX_ACCURACY && value.accuracy > NAVIGATION_MAX_ACCURACY))) return false
    latest.current = value
    setSample(value)
    setError(value.accuracy > NAVIGATION_MAX_ACCURACY ? `Vị trí tạm có sai số khoảng ±${Math.ceil(value.accuracy)} m. Đang lấy GPS chính xác hơn.` : '')
    return true
  }, [])
  useEffect(() => {
    let active = true
    let denied = false
    let quickPending = false
    let quickGeneration = 0
    let lastQuick = -Infinity
    let quickDeadline = 0
    const geo = navigator.geolocation
    if (!geo) { queueMicrotask(() => setError('Trình duyệt không hỗ trợ định vị.')); return }
    const success = (position: GeolocationPosition) => { if (active) { denied = false; updatePosition(position) } }
    const failure = (cause: GeolocationPositionError) => {
      if (!active) return
      if (cause.code === 1) {
        denied = true; latest.current = null; setSample(null)
        setError('Bạn chưa cho phép định vị. Hãy bật quyền vị trí cho website rồi thử lại.')
        notifyLocationPermissionNeeded()
      } else if (!latest.current || !isFresh(latest.current)) {
        setError(cause.code === 3 ? 'Chưa nhận được vị trí thiết bị. Đang thử lại; hãy bật dịch vụ vị trí.' : 'Chưa lấy được vị trí thiết bị. Hãy bật dịch vụ vị trí; hệ thống đang thử lại.')
      }
    }
    const quick = () => {
      if (!active || denied || quickPending || Date.now() - lastQuick < 10000 || !geo.getCurrentPosition) return
      lastQuick = Date.now()
      quickPending = true
      const generation = ++quickGeneration
      quickDeadline = window.setTimeout(() => { quickPending = false; if (active && !latest.current && !denied) setError('Chưa nhận được vị trí. Hãy cho phép truy cập vị trí và bật dịch vụ vị trí trên thiết bị.') }, 6500)
      geo.getCurrentPosition(position => { if (!active || generation !== quickGeneration) return; window.clearTimeout(quickDeadline); quickPending = false; success(position) }, cause => { if (!active || generation !== quickGeneration) return; window.clearTimeout(quickDeadline); quickPending = false; failure(cause) }, QUICK_LOCATION_OPTIONS)
    }
    const watch = geo.watchPosition(success, failure, LIVE_LOCATION_OPTIONS)
    quick()
    const timer = window.setInterval(() => {
      if (latest.current && !isFresh(latest.current)) { latest.current = null; setSample(null); setError('Vị trí đã cũ. Đang lấy lại vị trí thiết bị…') }
      if (!latest.current || latest.current.accuracy > NAVIGATION_MAX_ACCURACY) quick()
    }, 5000)
    return () => { active = false; geo.clearWatch(watch); window.clearInterval(timer); window.clearTimeout(quickDeadline) }
  }, [attempt, updatePosition])
  return { sample, error, updatePosition, retry: () => { setError(''); setAttempt(value => value + 1) } }
}
