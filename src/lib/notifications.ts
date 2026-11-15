let notificationOwner: string | null = null
export function setNotificationOwner(id: string | null) { notificationOwner = id }
export function setInAppNotifications(id: string, enabled: boolean) {
  try { const key=`dana-in-app-notifications:${id}`,value=enabled?'enabled':'disabled';if(localStorage.getItem(key)!==value){localStorage.setItem(key,value);window.dispatchEvent(new Event('dana-event-preferences'))} } catch { /* Inline feedback remains available if storage is blocked. */ }
}
export function notify(message: string) {
  try { if (notificationOwner && localStorage.getItem(`dana-in-app-notifications:${notificationOwner}`) === 'disabled') return } catch { /* Continue with the default when storage is unavailable. */ }
  window.dispatchEvent(new CustomEvent('dana-toast', { detail: message }))
}
