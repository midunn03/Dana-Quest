import { formatMeters } from './routing'

export type BusNotifPermission = NotificationPermission | 'unsupported'

export function getBusNotificationPermission(): BusNotifPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  return Notification.permission
}

export async function requestBusNotificationPermission(): Promise<BusNotifPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  try {
    return await Notification.requestPermission()
  } catch {
    return Notification.permission
  }
}

export function playBusArrivalChime(urgent = false): void {
  if (typeof window === 'undefined') return
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioCtx) return
  try {
    const ctx = new AudioCtx()
    const notes = urgent ? [880, 1174.66, 880, 1174.66] : [783.99, 1046.5]
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      const start = ctx.currentTime + idx * 0.22
      gain.gain.setValueAtTime(0.001, start)
      gain.gain.exponentialRampToValueAtTime(0.22, start + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(start)
      osc.stop(start + 0.21)
    })
    window.setTimeout(() => { void ctx.close().catch(() => {}) }, 1200)
  } catch {
    // Browser autoplay policies may block sound before user gesture.
  }
}

export async function sendBusSystemNotification(
  tag: string,
  title: string,
  body: string,
  opts: { silent?: boolean; requireInteraction?: boolean; url?: string } = {},
): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
    return false
  }
  const icon = `${import.meta.env.BASE_URL}brand/icon-192.png`
  const payload: NotificationOptions & { renotify?: boolean; vibrate?: number[] } = {
    body,
    icon,
    tag,
    silent: opts.silent ?? false,
    requireInteraction: opts.requireInteraction ?? false,
    data: { url: opts.url || window.location.hash || '#/map' },
  }
  if (!opts.silent) {
    payload.renotify = true
    payload.vibrate = [250, 100, 250, 100, 350]
  }

  try {
    const reg = await navigator.serviceWorker?.getRegistration()
    if (reg) {
      await reg.showNotification(title, payload)
      return true
    }
    new Notification(title, payload)
    return true
  } catch {
    return false
  }
}

export function triggerBusStopAlert(params: {
  stage: 'approaching' | 'arrived'
  routeCode: string
  stopName: string
  destinationName: string
  remainingMeters: number
  url?: string
}): void {
  const { stage, routeCode, stopName, destinationName, remainingMeters, url } = params
  const urgent = stage === 'arrived'

  playBusArrivalChime(urgent)
  try {
    navigator.vibrate?.(urgent ? [300, 120, 300, 120, 450] : [200, 100, 250])
  } catch {}

  const title = urgent
    ? `🔔 ĐÃ ĐẾN TRẠM XUỐNG · Tuyến ${routeCode}!`
    : `🚌 Sắp đến trạm xuống · Tuyến ${routeCode}`
  const body = urgent
    ? `Xuống tại ${stopName} để đi bộ tới ${destinationName}!`
    : `Còn ${formatMeters(remainingMeters)} tới trạm ${stopName} — chuẩn bị bấm chuông xuống xe!`

  window.dispatchEvent(new CustomEvent('dana-toast', { detail: `${title} — ${body}` }))
  void sendBusSystemNotification(
    urgent ? 'danabus-alight-now' : 'danabus-alight-soon',
    title,
    body,
    { silent: false, requireInteraction: urgent, url },
  )
}
