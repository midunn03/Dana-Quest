import { distanceMeters, isFresh, MAX_ACCURACY, type LocationSample } from './location'
import type { CityEvent } from '../data/events'
import { occurrenceFor } from '../../shared/event-policy.mjs'
import type { EventItem } from './events'
import { showEventReminder } from './eventReminders'
import { timeRange } from './events'

export interface FeedNotice {
  key: string
  eventId: number
  title: string
  body: string
  reason: 'featured' | 'nearby'
}

const STORAGE_PREFIX = 'dana-event-feed-notified-v1'
const KEEP_MS = 3 * 24 * 60 * 60_000
const sessionNotified = new Map<string, Record<string, number>>()

export const formatEventDistance = (meters: number) => meters < 1000
  ? `${Math.max(10, Math.round(meters / 10) * 10)} m`
  : `${(meters / 1000).toFixed(1)} km`

function isCoveredByAccountEvent(event: EventItem, accountEvents: CityEvent[], now: number) {
  const start = Date.parse(event.start)
  return accountEvents.some(accountEvent => {
    if (accountEvent.status !== 'confirmed' || accountEvent.allDay || accountEvent.destinationId !== event.placeId) return false
    const sameSource = !!event.sourceUrl && event.sourceUrl === accountEvent.sourceUrl
    if (!sameSource && accountEvent.title.trim().toLocaleLowerCase() !== event.title.trim().toLocaleLowerCase()) return false
    const occurrence = occurrenceFor(accountEvent, now)
    return !!occurrence && Math.abs(occurrence.start - start) < 60_000
  })
}

export function dueFeedNotices(
  events: EventItem[],
  player: LocationSample | null,
  now: number,
  done: ReadonlySet<string>,
  accountEvents: CityEvent[] = [],
): FeedNotice[] {
  const notices: FeedNotice[] = []
  const usablePlayer = player && isFresh(player, now) && player.accuracy <= MAX_ACCURACY ? player : null

  for (const event of events) {
    const key = `${event.id}:${event.start}`
    if (done.has(key) || isCoveredByAccountEvent(event, accountEvents, now)) continue
    const start = Date.parse(event.start)
    const end = Date.parse(event.end)
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) continue
    const live = start <= now && now < end
    const minutes = Math.ceil((start - now) / 60_000)
    if (!live && !(minutes > 0 && minutes <= (event.notifyBefore ?? 30))) continue
    const when = live ? 'Đang diễn ra' : `Còn ${minutes} phút nữa`
    const where = event.placeName ? ` tại ${event.placeName}` : ''

    if (event.featured) {
      notices.push({
        key,
        eventId: event.id,
        reason: 'featured',
        title: `Nổi bật ở Đà Nẵng: ${event.title}`,
        body: `${when}${where} · ${timeRange(event)}`,
      })
      continue
    }

    if (!usablePlayer || event.placeLat === null || event.placeLat === undefined
      || event.placeLng === null || event.placeLng === undefined || (event.radiusM ?? 0) <= 0) continue
    const meters = distanceMeters(
      [usablePlayer.latitude, usablePlayer.longitude],
      [event.placeLat, event.placeLng],
    )
    if (meters <= (event.radiusM ?? 0)) {
      notices.push({
        key,
        eventId: event.id,
        reason: 'nearby',
        title: `${event.title}${where}`,
        body: `${when} · bạn đang cách ${formatEventDistance(meters)} · ${timeRange(event)}`,
      })
    }
  }
  return notices
}

function readNotified(owner: string, now: number) {
  const key = `${STORAGE_PREFIX}:${encodeURIComponent(owner)}`
  let stored: Record<string, number> = {}
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? '{}')
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      stored = Object.fromEntries(Object.entries(value).filter((entry): entry is [string, number] =>
        typeof entry[1] === 'number' && Number.isFinite(entry[1]) && now - entry[1] < KEEP_MS))
    }
  } catch {
    stored = {}
  }
  const session = sessionNotified.get(owner) ?? {}
  const merged = { ...stored, ...session }
  sessionNotified.set(owner, merged)
  return { key, notified: merged }
}

export function runEventFeedNotifications(
  events: EventItem[],
  player: LocationSample | null,
  now: number,
  owner: string,
  enabled: boolean,
  accountEvents: CityEvent[] = [],
) {
  if (!enabled || document.hidden) return []
  const { key, notified } = readNotified(owner, now)
  const due = dueFeedNotices(events, player, now, new Set(Object.keys(notified)), accountEvents)
  if (!due.length) return due

  for (const notice of due) {
    notified[notice.key] = now
    window.dispatchEvent(new CustomEvent('dana-toast', { detail: `${notice.title} — ${notice.body}` }))
    void showEventReminder(String(notice.eventId), notice.title, notice.body)
  }
  sessionNotified.set(owner, notified)
  try {
    localStorage.setItem(key, JSON.stringify(notified))
  } catch {
    // Keep this tab deduplicated even when persistent storage is unavailable.
  }
  return due
}
