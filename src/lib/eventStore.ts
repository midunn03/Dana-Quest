import { useSyncExternalStore } from 'react'
import { parseEvents, type EventItem } from './events'

let snapshot: EventItem[] = []
let timer: number | undefined
const listeners = new Set<() => void>()

function load() {
  if (typeof fetch !== 'function') return
  fetch('/api/events/feed').then(r => r.ok ? r.json() : null).then(data => {
    if (!data) return
    snapshot = parseEvents(data)
    listeners.forEach(listener => listener())
  }).catch(() => undefined) // lỗi mạng: giữ danh sách cũ
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (listeners.size === 1) { load(); timer = window.setInterval(load, 60_000) }
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0 && timer !== undefined) { window.clearInterval(timer); timer = undefined }
  }
}

/** Sự kiện từ Django (đang diễn ra và sắp tới). Dùng chung cho bản đồ, trang Sự kiện và thông báo; làm mới mỗi phút. */
export const useEvents = () => useSyncExternalStore(subscribe, () => snapshot, () => snapshot)
