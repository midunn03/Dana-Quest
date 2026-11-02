const ENABLED_KEY = 'dana-event-reminders-v1'

export const remindersEnabled = () => {
  try { return localStorage.getItem(ENABLED_KEY) === 'enabled' } catch { return false }
}

/** Thông báo hệ thống (cần người chơi cho phép). Thông báo trong app luôn hiện, không phụ thuộc hàm này. */
export async function showSystemNotification(eventId: string, title: string, body: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  const icon = `${import.meta.env.BASE_URL}dana-quest.svg`
  const registration = await navigator.serviceWorker?.ready.catch(() => null)
  if (registration) return registration.showNotification(title, { body, icon, data: { url: `#/su-kien/${eventId}` }, tag: `dana-event-${eventId}` })
  new Notification(title, { body, icon })
}

export async function enableEventReminders() {
  if (!('Notification' in window)) throw new Error('Trình duyệt này chưa hỗ trợ thông báo hệ thống.')
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('Bạn chưa cho phép DANA QUEST gửi thông báo.')
  localStorage.setItem(ENABLED_KEY, 'enabled')
}

export function disableEventReminders() {
  localStorage.removeItem(ENABLED_KEY)
}
