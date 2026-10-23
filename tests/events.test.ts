<<<<<<< HEAD
import { expect, it } from 'vitest'
import { parseEvents, reminderText } from '../src/lib/events'

const base = { id: 1, title: 'Cầu Rồng phun lửa', description: '', kind: 'show', placeId: 'cau-rong', placeName: 'Cầu Rồng', start: '2026-10-17T16:00:00+07:00', end: '2026-10-17T18:00:00+07:00', status: 'soon', minutesUntil: 25 }

it('bỏ qua dữ liệu sự kiện sai dạng', () => {
  expect(parseEvents(null)).toEqual([])
  expect(parseEvents({ items: [base, { id: 'x' }, { ...base, start: 'không phải ngày' }] })).toHaveLength(1)
})
it('tạo câu nhắc theo trạng thái', () => {
  const [event] = parseEvents({ items: [base] })
  expect(reminderText(event)).toContain('Còn 25 phút nữa')
  expect(reminderText({ ...event, status: 'live' })).toContain('Đang diễn ra')
  expect(reminderText({ ...event, status: 'later' })).toBeNull()
=======
import { describe, expect, it } from 'vitest'
import { cityEvents, nextEventOccurrence } from '../src/data/events'

describe('Da Nang event schedule', () => {
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
>>>>>>> origin/main
})
