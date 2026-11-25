// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import NavigationPage from '../src/NavigationPage'
import { walkingFixture } from './routing-fixture'
import { BUS_GIFTCODES, extractBusGiftcode, getBusGiftcodesForRoute } from '../src/lib/busCompanion'

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('BusRideCompanion workflow inside NavigationPage', () => {
  it('exposes 6 giftcodes per route (48 total) and normalizes plain & QR URL giftcodes', () => {
    expect(BUS_GIFTCODES).toHaveLength(48)
    expect(getBusGiftcodesForRoute('05').map(item => item.code)).toEqual([
      'DANABUS05',
      'DANABUS05A',
      'DANABUS05B',
      'DANABUS05C',
      'DANABUS05D',
      'DANABUS05E',
    ])
    expect(extractBusGiftcode('  danabus06  ')).toBe('DANABUS06')
    expect(extractBusGiftcode('https://dana-quest-demo.onrender.com/?buscode=danabus03d')).toBe('DANABUS03D')
  })

  it('shows bus invite when a matching route is nearby, enters waiting screen with minigame & giftcode, and can minimize/restore', async () => {
    let geoSuccess!: PositionCallback
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ route: walkingFixture }) })))
    vi.stubGlobal('navigator', {
      geolocation: {
        watchPosition: vi.fn((ok: PositionCallback) => { geoSuccess = ok; return 12 }),
        clearWatch: vi.fn(),
      },
      vibrate: vi.fn(),
    })
    vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} })
    vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(800)
    vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(390)

    render(
      <div className="app-shell device-mobile-shell device-mobile">
        <NavigationPage id="bai-bien-my-khe" fromMap />
      </div>
    )

    // Player near Cham Museum -> Route 06 passes Cham Museum -> My Khe Beach!
    act(() => {
      geoSuccess({
        coords: { latitude: 16.0603, longitude: 108.2233, accuracy: 10 },
        timestamp: Date.now(),
      } as GeolocationPosition)
    })

    // Invite notification banner appears
    const invite = await screen.findByRole('status', { name: 'Gợi ý đi xe buýt DanaBus nhận thêm xu' })
    expect(invite.textContent).toContain('Sử dụng Tuyến 06 để nhận thêm xu')

    // Confirm joining the bus ride -> opens waiting companion dialog
    fireEvent.click(screen.getByRole('button', { name: /Xác nhận tham gia chuyến đi này$/ }))
    const dialog = await screen.findByRole('dialog', { name: /Đang đi xe buýt Tuyến 06/ })
    expect(dialog).toBeTruthy()
    expect(screen.getByLabelText('Hoạt ảnh xe buýt đang di chuyển')).toBeTruthy()

    // Switch to QR/Giftcode tab
    fireEvent.click(screen.getByRole('tab', { name: /Quét QR \/ Giftcode/ }))
    expect(screen.getByLabelText('Nhập mã giftcode xe buýt')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Quét mã QR trên xe/ })).toBeTruthy()

    // Minimize back to map, then restore
    fireEvent.click(screen.getByRole('button', { name: /Bản đồ/ }))
    await waitFor(() => expect(screen.queryByRole('dialog', { name: /Đang đi xe buýt Tuyến 06/ })).toBeNull())
    const miniBar = screen.getByRole('region', { name: 'Chuyến xe buýt đang tham gia' })
    expect(miniBar).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Mở màn hình chờ/ }))
    expect(await screen.findByRole('dialog', { name: /Đang đi xe buýt Tuyến 06/ })).toBeTruthy()
  })
})
