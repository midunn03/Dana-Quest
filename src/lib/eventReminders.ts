import { cityEvents, nextEventOccurrence } from '../data/events'

const ENABLED_KEY = 'dana-event-reminders-v1'
let timers: number[] = []

export const remindersEnabled = () => localStorage.getItem(ENABLED_KEY) === 'enabled'

async function showEventReminder(eventId: string, title: string, body: string) {
  const registration = await navigator.serviceWorker?.ready.catch(() => null)
  if (registration) return registration.showNotification(title, { body, icon: `${import.meta.env.BASE_URL}dana-quest.svg`, data: { url: `#/su-kien/${eventId}` }, tag: `dana-event-${eventId}` })
  if ('Notification' in window && Notification.permission === 'granted') new Notification(title, { body, icon: `${import.meta.env.BASE_URL}dana-quest.svg` })
}

export function scheduleEventReminders(now = new Date()) {
  timers.forEach(window.clearTimeout)
  timers = []
  if (!remindersEnabled()) return
  cityEvents.forEach(event => {
    if (!event.reminderMinutes) return
    const occurrence = nextEventOccurrence(event, now)
    if (!occurrence) return
    const delay = occurrence.getTime() - now.getTime() - event.reminderMinutes * 60_000
    if (delay <= 0 || delay > 2_147_000_000) return
    timers.push(window.setTimeout(() => void showEventReminder(event.id, `Sắp diễn ra: ${event.title}`, `${event.scheduleLabel} · ${event.location}`), delay))
  })
}

export async function enableEventReminders() {
  if (!('Notification' in window)) throw new Error('Trình duyệt này chưa hỗ trợ thông báo hệ thống.')
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('Bạn chưa cho phép DANA QUEST gửi thông báo.')
  localStorage.setItem(ENABLED_KEY, 'enabled')
  scheduleEventReminders()
}

export function disableEventReminders() {
  localStorage.removeItem(ENABLED_KEY)
  scheduleEventReminders()
}

