import { describe, expect, it } from 'vitest'
import { defaultLook, heads, hairs, sleeves, pantsKinds, lookFromCode, lookToCode, renderLook } from '../src/lib/pixelAvatar'
import { metersPerPixel, pinMode, pinScale } from '../src/lib/markerScale'

describe('nhân vật pixel', () => {
  it('mã nhân vật đọc lại đúng và từ chối mã sai', () => {
    const look = { ...defaultLook, gender: 'f' as const, head: 'xoan' as const, hair: 'mullet' as const, skin: 3 }
    expect(lookFromCode(lookToCode(look))).toEqual(look)
    expect(lookFromCode('c1.x.tron.den.ngan.dai.1.0.0.0')).toBeNull()
    expect(lookFromCode('bien')).toBeNull()
  })
  it('mọi tổ hợp đầu/tóc/áo/quần đều vẽ được', () => {
    for (const head of heads) for (const hair of hairs) for (const sleeve of sleeves) for (const pants of pantsKinds)
      expect(renderLook({ ...defaultLook, head, hair, sleeve, pants }).length).toBeGreaterThan(20)
  })
})

describe('kích thước ghim theo zoom', () => {
  it('to dần khi zoom gần, ẩn khi xem xa', () => {
    const lat = 16.07
    expect(metersPerPixel(lat, 16)).toBeLessThan(metersPerPixel(lat, 12))
    expect(pinScale(lat, 17, 70, 68)).toBeGreaterThan(pinScale(lat, 15, 70, 68))
    expect(pinMode(8)).toBe('hidden')
    expect(pinMode(12)).toBe('dot')
    expect(pinMode(16)).toBe('full')
  })
})
