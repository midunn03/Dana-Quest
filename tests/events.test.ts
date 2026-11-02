import { describe, expect, it } from 'vitest'
import { parseEvents, reminderText } from '../src/lib/events'
import { dueNotices, formatDistance } from '../src/lib/eventNotifier'

const base = { id: 1, title: 'Cầu Rồng phun lửa', description: '', kind: 'show', placeId: 'cau-rong', placeName: 'Cầu Rồng', start: '2026-10-17T16:00:00+07:00', end: '2026-10-17T18:00:00+07:00', status: 'soon', minutesUntil: 25 }
const nearDragon = { lat: 16.0611, lng: 108.2277 }
const full = { ...base, placeLat: 16.0611, placeLng: 108.2277, radiusM: 1500, notifyBefore: 30, featured: false }
const at = (hhmm: string) => Date.parse(`2026-10-17T${hhmm}:00+07:00`)

describe('Dữ liệu sự kiện', () => {
  it('bỏ qua dữ liệu sự kiện sai dạng', () => {
    expect(parseEvents(null)).toEqual([])
    expect(parseEvents({ items: [base, { id: 'x' }, { ...base, start: 'không phải ngày' }] })).toHaveLength(1)
  })

  it('điền giá trị mặc định an toàn cho trường thông báo', () => {
    const [event] = parseEvents({ items: [base] })
    expect(event).toMatchObject({ radiusM: 0, notifyBefore: 30, featured: false, placeLat: null, sourceUrl: '' })
    const [linked] = parseEvents({ items: [{ ...base, placeLat: 16.06, placeLng: 108.22, radiusM: 2000, featured: true, sourceUrl: 'javascript:alert(1)' }] })
    expect(linked).toMatchObject({ placeLat: 16.06, radiusM: 2000, featured: true, sourceUrl: '' })
  })

  it('tạo câu nhắc theo trạng thái', () => {
    const [event] = parseEvents({ items: [base] })
    expect(reminderText(event)).toContain('Còn 25 phút nữa')
    expect(reminderText({ ...event, status: 'live' })).toContain('Đang diễn ra')
    expect(reminderText({ ...event, status: 'later' })).toBeNull()
  })
})

describe('Thông báo sự kiện', () => {
  const [event] = parseEvents({ items: [full] })
  const none = new Set<string>()

  it('báo người đang trong bán kính khi sắp bắt đầu hoặc đang diễn ra', () => {
    const soon = dueNotices([event], nearDragon, at('15:40'), none)
    expect(soon).toHaveLength(1)
    expect(soon[0].body).toContain('Còn 20 phút nữa')
    expect(soon[0].reason).toBe('nearby')
    expect(dueNotices([event], nearDragon, at('16:30'), none)[0].body).toContain('Đang diễn ra')
  })

  it('không báo khi ở ngoài bán kính, chưa tới giờ báo trước, đã kết thúc hoặc chưa có vị trí', () => {
    expect(dueNotices([event], { lat: 16.2, lng: 108.4 }, at('15:40'), none)).toEqual([])
    expect(dueNotices([event], nearDragon, at('14:00'), none)).toEqual([])
    expect(dueNotices([event], nearDragon, at('18:30'), none)).toEqual([])
    expect(dueNotices([event], null, at('15:40'), none)).toEqual([])
  })

  it('mỗi lần diễn ra chỉ báo một lần và bán kính 0 nghĩa là không báo theo khoảng cách', () => {
    const [first] = dueNotices([event], nearDragon, at('15:40'), none)
    expect(dueNotices([event], nearDragon, at('15:41'), new Set([first.key]))).toEqual([])
    const [silent] = parseEvents({ items: [{ ...full, radiusM: 0 }] })
    expect(dueNotices([silent], nearDragon, at('15:40'), none)).toEqual([])
  })

  it('hoạt động nổi bật báo cho mọi người, kể cả khi ở xa hoặc không có vị trí', () => {
    const [featured] = parseEvents({ items: [{ ...full, featured: true, radiusM: 0, notifyBefore: 60 }] })
    const far = dueNotices([featured], { lat: 10.8, lng: 106.7 }, at('15:10'), none)
    expect(far).toHaveLength(1)
    expect(far[0].reason).toBe('featured')
    expect(dueNotices([featured], null, at('15:10'), none)).toHaveLength(1)
  })

  it('định dạng khoảng cách dễ đọc', () => {
    expect(formatDistance(432)).toBe('430 m')
    expect(formatDistance(1530)).toBe('1.5 km')
  })
})
