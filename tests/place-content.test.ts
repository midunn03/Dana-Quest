// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { parsePlaceData } from '../src/lib/placeContent'
import { groundSize } from '../src/lib/groundSprite'
import { metersPerPixel } from '../src/lib/markerScale'
import { posterize } from '../src/lib/pixelTiles'

describe('parsePlaceData', () => {
  it('đọc ảnh ghim, ảnh dán mặt đất và nội dung admin', () => {
    const data = parsePlaceData({
      items: { 'cau-rong': { url: '/media/a.png', meters: 320, ground: { lat: 16.06, lng: 108.22, widthM: 600, heightM: 40, rotation: 30 } }, 'x': { url: 'javascript:alert(1)', meters: 5 } },
      content: { 'cau-rong': { description: 'Mô tả', activities: ['Ngắm cầu', '  ', 5], photos: [{ url: '/media/p.jpg', caption: 'c' }, { url: 'data:text/html,x' }] } },
    })
    expect(data.sprites['cau-rong'].ground).toEqual({ lat: 16.06, lng: 108.22, widthM: 600, heightM: 40, rotation: 30 })
    expect(data.sprites.x).toBeUndefined()
    expect(data.content['cau-rong'].activities).toEqual(['Ngắm cầu'])
    expect(data.content['cau-rong'].photos).toHaveLength(1)
  })
  it('bỏ qua dữ liệu hỏng và ground không hợp lệ', () => {
    expect(parsePlaceData(null)).toEqual({ sprites: {}, content: {} })
    const data = parsePlaceData({ items: { a: { url: '/m/a.png', meters: -1, ground: { lat: 99, lng: 0, widthM: 1, heightM: 1 } } } })
    expect(data.sprites.a.ground).toBeUndefined()
    expect(data.sprites.a.meters).toBe(200)
  })
})

describe('ground sprite & pixel tiles', () => {
  it('kích thước theo mét: zoom thêm 1 thì gấp đôi, không bị giới hạn', () => {
    const info = { lat: 16.06, widthM: 600, heightM: 40 }
    const [w15] = groundSize(info, 15)
    const [w16, h16] = groundSize(info, 16)
    expect(w16 / w15).toBeCloseTo(2)
    expect(w16 * metersPerPixel(16.06, 16)).toBeCloseTo(600)
    expect(h16 * metersPerPixel(16.06, 16)).toBeCloseTo(40)
    expect(groundSize(info, 19)[0]).toBeGreaterThan(2000)
  })
  it('posterize chỉ giữ vài mức màu và không đụng kênh alpha', () => {
    const data = new Uint8ClampedArray([10, 130, 250, 77])
    posterize(data, 3)
    expect([...data]).toEqual([0, 128, 255, 77])
  })
})
