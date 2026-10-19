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
})
