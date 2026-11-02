// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { parseAdminPlace, parsePlaceData } from '../src/lib/placeContent'
import { groundSize } from '../src/lib/groundSprite'
import { metersPerPixel } from '../src/lib/markerScale'
import { getDestination, getDestinations, destinations, setLiveDestinations } from '../src/data/destinations'
import { getMissions } from '../src/data/missions'
import { readState } from '../src/lib/progress'

const crowd = Array.from({ length: 18 }, (_, index) => index * 5)
const raw = { id: 'cho-con', name: 'Chợ Cồn', lat: 16.0678, lng: 108.2144, category: 'market', area: 'Hải Châu', tags: ['chợ'], featuredScore: 70, highlight: 'Chợ lâu đời',
  description: 'Mô tả', detail: 'Chi tiết', activities: ['Ăn bánh tráng', '  ', 5], hours: '06:00 – 19:00', hoursNote: '', tip: 'Mang tiền mặt', address: '290 Hùng Vương', crowd, crowdNote: 'Đông buổi sáng',
  photos: [{ url: '/media/place-photos/a.jpg', caption: 'Cổng chợ' }, { url: 'data:text/html,x' }] }

describe('Địa điểm do admin quản lý', () => {
  it('đọc đầy đủ nội dung, giờ đông đúc và ảnh; bỏ ảnh có link không an toàn', () => {
    const place = parseAdminPlace(raw)!
    expect(place).toMatchObject({ id: 'cho-con', name: 'Chợ Cồn', position: [16.0678, 108.2144], source: 'admin', category: 'landmark', hours: '06:00 – 19:00', crowdNote: 'Đông buổi sáng' })
    expect(place.suggestedActivities).toEqual(['Ăn bánh tráng'])
    expect(place.crowd).toEqual(crowd)
    expect(place.photos).toEqual([{ url: '/media/place-photos/a.jpg', caption: 'Cổng chợ', credit: '' }])
  })

  it('từ chối địa điểm thiếu mã, tên hoặc tọa độ hợp lệ; bỏ biểu đồ sai độ dài', () => {
    expect(parseAdminPlace({ ...raw, id: 'Có Dấu' })).toBeNull()
    expect(parseAdminPlace({ ...raw, name: '  ' })).toBeNull()
    expect(parseAdminPlace({ ...raw, lat: 99 })).toBeNull()
    expect(parseAdminPlace(null)).toBeNull()
    expect(parseAdminPlace({ ...raw, crowd: [1, 2, 3] })!.crowd).toEqual([])
  })

  it('chỉ dùng danh sách từ admin khi managed, và bỏ mã trùng', () => {
    expect(parsePlaceData({ managed: false, places: [raw] }).places).toBeNull()
    expect(parsePlaceData({ managed: true, places: [raw, raw] }).places).toHaveLength(1)
    expect(parsePlaceData({ managed: true, places: [] }).places).toEqual([])
    expect(parsePlaceData(null)).toEqual({ sprites: {}, places: null })
  })

  it('đọc ảnh ghim và ảnh dán mặt đất, bỏ link không an toàn', () => {
    const data = parsePlaceData({ items: { 'cau-rong': { url: '/media/a.png', meters: 320, ground: { lat: 16.06, lng: 108.22, widthM: 600, heightM: 40, rotation: 30 } }, x: { url: 'javascript:alert(1)', meters: 5 } } })
    expect(data.sprites['cau-rong'].ground).toEqual({ lat: 16.06, lng: 108.22, widthM: 600, heightM: 40, rotation: 30 })
    expect(data.sprites.x).toBeUndefined()
    const bad = parsePlaceData({ items: { a: { url: '/m/a.png', meters: -1, ground: { lat: 99, lng: 0, widthM: 1, heightM: 1 } } } })
    expect(bad.sprites.a.ground).toBeUndefined()
    expect(bad.sprites.a.meters).toBe(200)
  })

  it('thêm/xóa địa điểm: danh sách đổi, địa điểm đã xóa vẫn tra được để tiến độ cũ không hỏng', () => {
    const added = parseAdminPlace(raw)!
    setLiveDestinations([added])
    expect(getDestinations().map(place => place.id)).toEqual(['cho-con'])
    expect(getDestination('cho-con')?.name).toBe('Chợ Cồn')
    expect(getDestination('cau-rong')).toBeTruthy() // đã xóa khỏi admin nhưng còn trong lưu trữ
    expect(getMissions(added)).toHaveLength(10) // địa điểm mới dùng được bộ nhiệm vụ chung
    expect(() => readState({ version: 1, destinations: { 'cho-con': { started: true, selected: ['arrival', 'read', 'observe', 'learn', 'walk'], completed: [] }, 'dia-diem-da-xoa': { started: false, selected: [], completed: [] } }, redemptions: [] })).not.toThrow()
    setLiveDestinations(null)
    expect(getDestinations()).toBe(destinations)
  })
})

describe('ground sprite', () => {
  it('kích thước theo mét: zoom thêm 1 thì gấp đôi, không bị giới hạn', () => {
    const info = { lat: 16.06, widthM: 600, heightM: 40 }
    const [w15] = groundSize(info, 15)
    const [w16, h16] = groundSize(info, 16)
    expect(w16 / w15).toBeCloseTo(2)
    expect(w16 * metersPerPixel(16.06, 16)).toBeCloseTo(600)
    expect(h16 * metersPerPixel(16.06, 16)).toBeCloseTo(40)
    expect(groundSize(info, 19)[0]).toBeGreaterThan(2000)
  })
})
