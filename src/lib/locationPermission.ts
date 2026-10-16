import { notify } from './notifications'

let lastPermissionNotice = 0

export function requestLocationAfterAuthentication() {
  if (!window.isSecureContext || !navigator.geolocation) {
    notify('Thiết bị chưa hỗ trợ định vị. Bạn vẫn có thể khám phá địa điểm thủ công.')
    return
  }
  navigator.geolocation.getCurrentPosition(
    () => notify('Đã bật vị trí. DANA QUEST sẽ tự tính khoảng cách đến điểm bạn khám phá.'),
    error => {
      if (error.code === 1) notifyLocationPermissionNeeded()
      else notify('Chưa lấy được vị trí. Bạn có thể thử lại khi dùng tính năng gần bạn.')
    },
    { enableHighAccuracy: false, maximumAge: 30_000, timeout: 5_000 },
  )
}

export function notifyLocationPermissionNeeded() {
  const now = Date.now()
  if (now - lastPermissionNotice < 3000) return
  lastPermissionNotice = now
  notify('Tính năng này cần vị trí của bạn. Hãy cho phép truy cập vị trí trong trình duyệt rồi thử lại.')
}
