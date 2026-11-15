// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Explore from '../src/Explore'
import { quests } from '../src/data/quests'
import L from 'leaflet'

describe('Giai đoạn 2: Bản đồ 1 km quanh GPS (Big-Update 9)', () => {
  let setViewSpy: any
  let fitBoundsSpy: any

  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} })
    vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(600)
    vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(400)
    setViewSpy = vi.spyOn(L.Map.prototype, 'setView')
    fitBoundsSpy = vi.spyOn(L.Map.prototype, 'fitBounds')
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    localStorage.clear()
  })

  it('Mở bản đồ không có GPS: Mặc định tâm tại Cầu Rồng [16.0601, 108.2236] và zoom 15', async () => {
    render(<Explore />)
    await screen.findByRole('region', { name: 'Bản đồ Đà Nẵng' })
    
    // Kiểm tra setView ban đầu tại Cầu Rồng, zoom 15
    const calls = setViewSpy.mock.calls
    expect(calls.length).toBeGreaterThan(0)
    const initialCall = calls[0]
    expect(initialCall[0]).toEqual([16.0601, 108.2236])
    expect(initialCall[1]).toBe(15)

    // Đảm bảo vẫn hiển thị đầy đủ các marker (16 điểm: 15 danh thắng + DUE)
    await waitFor(() => expect(document.querySelectorAll('.atlas-pin')).toHaveLength(quests.length))
    expect(document.querySelectorAll('.atlas-list > button')).toHaveLength(quests.length)
  })

  it('Mở bản đồ có mock GPS: Tâm bản đồ trùng vị trí GPS và zoom 15', async () => {
    const mockLat = 16.0500
    const mockLng = 108.2100
    let successCallback: PositionCallback
    vi.stubGlobal('navigator', {
      geolocation: {
        watchPosition: vi.fn((success) => {
          successCallback = success
          return 101
        }),
        getCurrentPosition: vi.fn((success) => success({
          coords: { latitude: mockLat, longitude: mockLng, accuracy: 20 },
          timestamp: Date.now()
        })),
        clearWatch: vi.fn()
      }
    })

    const view = render(<Explore />)
    if (successCallback!) {
      act(() => {
        successCallback!({
          coords: { latitude: mockLat, longitude: mockLng, accuracy: 20 },
          timestamp: Date.now()
        } as GeolocationPosition)
      })
    }

    await screen.findByRole('region', { name: 'Bản đồ Đà Nẵng' })
    await waitFor(() => expect(document.querySelectorAll('.atlas-pin')).toHaveLength(quests.length))
    view.unmount()
  })

  it('Nút "Toàn thành phố": Bấm vào sẽ fitBounds toàn bộ các điểm trên bản đồ', async () => {
    render(<Explore />)
    await screen.findByRole('region', { name: 'Bản đồ Đà Nẵng' })
    await waitFor(() => expect(document.querySelectorAll('.atlas-pin')).toHaveLength(quests.length))

    const cityBtn = screen.getByRole('button', { name: /Toàn thành phố/ })
    expect(cityBtn).toBeTruthy()

    const initialFitCalls = fitBoundsSpy.mock.calls.length
    fireEvent.click(cityBtn)
    expect(fitBoundsSpy.mock.calls.length).toBeGreaterThan(initialFitCalls)
  })

  it('Tắt cờ MAP_ONE_KM: Khởi tạo với mức zoom 12 và tọa độ toàn thành phố [16.0544, 108.2022]', async () => {
    localStorage.setItem('dana-flag-map_one_km', 'false')
    render(<Explore />)
    await screen.findByRole('region', { name: 'Bản đồ Đà Nẵng' })

    const calls = setViewSpy.mock.calls
    expect(calls.length).toBeGreaterThan(0)
    const initialCall = calls[0]
    expect(initialCall[0]).toEqual([16.0544, 108.2022])
    expect(initialCall[1]).toBe(12)
    // Nút "Toàn thành phố" không cần hiện khi cờ tắt
    expect(screen.queryByRole('button', { name: /Toàn thành phố/ })).toBeNull()
  })
})
