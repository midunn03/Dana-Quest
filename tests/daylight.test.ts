import { expect, it } from 'vitest'
import { clockOverride, mapDarkness, sunTimes } from '../src/lib/daylight'

const at = (hour: number, minute = 0) => new Date(Date.UTC(2026, 9, 19, hour - 7, minute)) // 19/10/2026, giờ Việt Nam

it('mặt trời mọc và lặn ở Đà Nẵng giữa tháng 10 hợp lý', () => {
  const { sunrise, sunset } = sunTimes(at(12))
  const vn = (ms: number) => new Date(ms + 7 * 3600000).getUTCHours() * 60 + new Date(ms + 7 * 3600000).getUTCMinutes()
  expect(vn(sunrise)).toBeGreaterThan(5 * 60 + 15)
  expect(vn(sunrise)).toBeLessThan(6 * 60 + 15)
  expect(vn(sunset)).toBeGreaterThan(17 * 60)
  expect(vn(sunset)).toBeLessThan(18 * 60 + 10)
})
it('ban ngày sáng, ban đêm tối, 18 giờ tối nhẹ', () => {
  expect(mapDarkness(at(12))).toBe(0)
  expect(mapDarkness(at(0))).toBe(1)
  expect(mapDarkness(at(23))).toBe(1)
  const dusk = mapDarkness(at(18))
  expect(dusk).toBeGreaterThan(0.3)
  expect(dusk).toBeLessThan(1)
  expect(mapDarkness(at(7))).toBe(0)
})
it('đọc giờ thử từ địa chỉ và bỏ qua giá trị sai', () => {
  expect(mapDarkness(clockOverride('?gio=23', at(10))!)).toBe(1)
  expect(clockOverride('?gio=abc', at(10))).toBeNull()
  expect(clockOverride('?gio=25', at(10))).toBeNull()
  expect(clockOverride('', at(10))).toBeNull()
})
