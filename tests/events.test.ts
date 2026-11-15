import { describe, expect, it } from 'vitest'
import { parseEvents, reminderText } from '../src/lib/events'
import { dueFeedNotices } from '../src/lib/eventNotifier'
import { cityEvents, nextEventOccurrence } from '../src/data/events'

const base = { id: 1, title: 'Cầu Rồng phun lửa', description: '', kind: 'show', placeId: 'cau-rong', placeName: 'Cầu Rồng', start: '2026-10-17T16:00:00+07:00', end: '2026-10-17T18:00:00+07:00', status: 'soon', minutesUntil: 25 }

describe('Dữ liệu sự kiện', () => {
  it('bỏ qua dữ liệu sự kiện sai dạng', () => {
    expect(parseEvents(null)).toEqual([])
    expect(parseEvents({ items: [base, { id: 'x' }, { ...base, start: 'không phải ngày' }] })).toHaveLength(1)
  })

  it('parses safe location and notification metadata for public event notices', () => {
    const [event] = parseEvents({ items: [{ ...base, placeLat: 16.06, placeLng: 108.22, radiusM: 1200, notifyBefore: 45, featured: true, sourceUrl: 'https://example.com/event' }] })
    expect(event).toMatchObject({
      placeLat: 16.06, placeLng: 108.22, radiusM: 1200, notifyBefore: 45,
      featured: true, sourceUrl: 'https://example.com/event',
    })
    const [invalid] = parseEvents({ items: [{ ...base, placeLat: 91, placeLng: 108.22, radiusM: -4, notifyBefore: -1, sourceUrl: 'javascript:alert(1)' }] })
    expect(invalid).toMatchObject({ placeLat: null, placeLng: null, radiusM: 0, notifyBefore: 30, sourceUrl: '' })
  })

  it('notifies featured events without GPS and nearby events only with a fresh accurate fix', () => {
    const now = Date.parse('2026-10-17T15:40:00+07:00')
    const [featured, nearby] = parseEvents({ items: [
      { ...base, id: 11, featured: true, notifyBefore: 30 },
      { ...base, id: 12, title: 'Hoạt động gần đây', featured: false, placeLat: 16.06, placeLng: 108.22, radiusM: 500, notifyBefore: 30 },
    ] })
    expect(dueFeedNotices([featured, nearby], null, now, new Set()).map(notice => notice.reason)).toEqual(['featured'])
    const player = { latitude: 16.06, longitude: 108.22, accuracy: 10, timestamp: now }
    expect(dueFeedNotices([featured, nearby], player, now, new Set()).map(notice => notice.reason)).toEqual(['featured', 'nearby'])
    expect(dueFeedNotices([nearby], { ...player, timestamp: now - 61_000 }, now, new Set())).toEqual([])
    expect(dueFeedNotices([nearby], { ...player, accuracy: 80 }, now, new Set())).toEqual([])
  })

  it('avoids a second notice for an occurrence handled by the existing account event flow', () => {
    const now = Date.parse(base.start)
    const [feedEvent] = parseEvents({ items: [{ ...base, featured: true }] })
    const legacyEvent = cityEvents.find(event => event.id === 'cau-rong-phun-lua')!
    const matchingEvent = { ...legacyEvent, title: feedEvent.title, destinationId: feedEvent.placeId, recurring: undefined, startAt: feedEvent.start, endAt: feedEvent.end }
    expect(dueFeedNotices([feedEvent], null, now, new Set(), [matchingEvent])).toEqual([])
  })

  it('tạo câu nhắc theo trạng thái', () => {
    const [event] = parseEvents({ items: [base] })
    expect(reminderText(event)).toContain('Còn 25 phút nữa')
    expect(reminderText({ ...event, status: 'live' })).toContain('Đang diễn ra')
    expect(reminderText({ ...event, status: 'later' })).toBeNull()
  })

  it('schedules the next Dragon Bridge show only on Friday, Saturday or Sunday at 21:00', () => {
    const event = cityEvents.find(item => item.id === 'cau-rong-phun-lua')!
    const next = nextEventOccurrence(event, new Date('2026-10-21T10:00:00+07:00'))!
    expect(next.getDay()).toBe(5)
    expect(next.getHours()).toBe(21)
    expect(next.getMinutes()).toBe(0)
  })
  it('keeps dated events attributable and does not invent reminder times', () => {
    expect(cityEvents.every(event => event.sourceUrl.startsWith('https://'))).toBe(true)
    expect(cityEvents.filter(event => event.startAt).every(event => event.reminderMinutes === undefined)).toBe(true)
  })
})
