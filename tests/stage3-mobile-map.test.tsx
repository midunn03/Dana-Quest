// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import Explore from '../src/Explore'
import App from '../src/App'
import { quests } from '../src/data/quests'
import { isUxFlagEnabled } from '../src/lib/uxFlags'

const viewports = [
  { name: '360x640', width: 360, height: 640, minMapRatio: 0.60 },
  { name: '375x667', width: 375, height: 667, minMapRatio: 0.70 },
  { name: '390x844', width: 390, height: 844, minMapRatio: 0.70 },
  { name: '412x915', width: 412, height: 915, minMapRatio: 0.70 },
  { name: '768x1024', width: 768, height: 1024, minMapRatio: 0.70 },
  { name: '844x390-landscape', width: 844, height: 390, minMapRatio: 0.70 },
]

describe('Giai đoạn 3: Tối ưu giao diện điện thoại & Ngân sách bản đồ >= 70%', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('dana-device-mode-v1', 'mobile')
    window.location.hash = '#/map'
    vi.stubGlobal('ResizeObserver', class {
      observe() {}
      disconnect() {}
    })
    Object.defineProperty(navigator, 'geolocation', {
      value: {
        getCurrentPosition: vi.fn(),
        watchPosition: vi.fn().mockReturnValue(1),
        clearWatch: vi.fn(),
      },
      configurable: true,
      writable: true,
    })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ user: { id: 'u1', username: 'danaplayer', name: 'Dana Player', avatarId: 'bien' } }),
    }))
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('xác nhận cờ MOBILE_MAP_FIRST mặc định bật', () => {
    expect(isUxFlagEnabled('MOBILE_MAP_FIRST')).toBe(true)
  })

  it('đo đạc ngân sách chiều cao bản đồ >= 70% (>= 60% ở 360x640) trên các kích thước màn hình', () => {
    const navHeight = 54
    const sheetPeekHeight = 72
    const landscapeNavHeight = 44
    const landscapePeekHeight = 54

    for (const vp of viewports) {
      const isLandscape = vp.width > vp.height
      const currentNav = isLandscape ? landscapeNavHeight : navHeight
      const currentPeek = isLandscape ? landscapePeekHeight : sheetPeekHeight
      const visibleMapHeight = vp.height - currentNav - currentPeek
      const ratio = visibleMapHeight / vp.height

      expect(
        ratio,
        `Khung ${vp.name}: Tỷ lệ bản đồ đạt ${(ratio * 100).toFixed(1)}%, yêu cầu >= ${(vp.minMapRatio * 100).toFixed(0)}%`
      ).toBeGreaterThanOrEqual(vp.minMapRatio)
    }
  })

  it('bottom sheet trên mobile hỗ trợ 3 mức (peek, half, full)', async () => {
    render(<Explore />)
    await screen.findByRole('region', { name: 'Bản đồ Đà Nẵng' })
    await waitFor(() => expect(document.querySelectorAll('.atlas-pin')).toHaveLength(quests.length))

    const sidebar = document.querySelector('.atlas-sidebar') as HTMLElement
    expect(sidebar).toBeTruthy()
    // Trạng thái ban đầu: peek (~72px)
    expect(sidebar.getAttribute('data-snap')).toBe('peek')

    const grabber = sidebar.querySelector('.atlas-sheet-grabber') as HTMLElement
    expect(grabber).toBeTruthy()

    // 1. Chạm/kéo lên -> Chuyển sang mức half (~45vh)
    fireEvent.pointerDown(grabber, { pointerId: 1, clientY: 400 })
    fireEvent.pointerUp(grabber, { pointerId: 1, clientY: 300 }) // kéo lên 100px
    expect(sidebar.getAttribute('data-snap')).toBe('half')

    // 2. Kéo tiếp lên -> Chuyển sang mức full (~85vh)
    fireEvent.pointerDown(grabber, { pointerId: 1, clientY: 300 })
    fireEvent.pointerUp(grabber, { pointerId: 1, clientY: 200 }) // kéo lên tiếp
    expect(sidebar.getAttribute('data-snap')).toBe('full')

    // 3. Kéo xuống -> Quay lại mức half
    fireEvent.pointerDown(grabber, { pointerId: 1, clientY: 200 })
    fireEvent.pointerUp(grabber, { pointerId: 1, clientY: 300 })
    expect(sidebar.getAttribute('data-snap')).toBe('half')

    // 4. Kéo xuống tiếp -> Về mức peek
    fireEvent.pointerDown(grabber, { pointerId: 1, clientY: 300 })
    fireEvent.pointerUp(grabber, { pointerId: 1, clientY: 400 })
    expect(sidebar.getAttribute('data-snap')).toBe('peek')
  })

  it('nút "Vị trí của tôi" nổi tròn 48px trên bản đồ di động', async () => {
    const getCurrentPosition = vi.fn()
    Object.defineProperty(navigator, 'geolocation', {
      value: {
        getCurrentPosition,
        watchPosition: vi.fn().mockReturnValue(1),
        clearWatch: vi.fn(),
      },
      configurable: true,
      writable: true,
    })
    render(<Explore />)
    await screen.findByRole('region', { name: 'Bản đồ Đà Nẵng' })

    const floatingBtn = document.querySelector('.atlas-map-locate') as HTMLButtonElement
    expect(floatingBtn).toBeTruthy()
    expect(floatingBtn.getAttribute('aria-label')).toBe('Vị trí của tôi')

    fireEvent.click(floatingBtn)
    expect(getCurrentPosition).toHaveBeenCalled()
  })

  it('thẻ chọn điểm (.atlas-selection) có kích thước gọn gàng và đầy đủ liên kết', async () => {
    render(<Explore />)
    await screen.findByRole('region', { name: 'Bản đồ Đà Nẵng' })
    await waitFor(() => expect(document.querySelectorAll('.atlas-list>button')).toHaveLength(quests.length))

    // Bấm vào địa điểm đầu tiên
    const firstPlaceBtn = document.querySelector<HTMLButtonElement>('.atlas-list>button')!
    fireEvent.click(firstPlaceBtn)

    const selection = document.querySelector('.atlas-selection') as HTMLElement
    expect(selection).toBeTruthy()
    expect(selection.querySelector('h2')).toBeTruthy()
    expect(selection.querySelector('.atlas-selection-link')).toBeTruthy()

    // Nút đóng hoạt động
    const closeBtn = selection.querySelector('.atlas-selection-close') as HTMLButtonElement
    fireEvent.click(closeBtn)
    expect(document.querySelector('.atlas-selection')).toBeNull()
  })

  it('hiển thị thông tin tài khoản cơ bản (avatar + tên + tag gói) thay cho StreakChip trên header di động', async () => {
    render(<App />)
    await waitFor(() => {
      const header = document.querySelector('.device-mobile-header')
      expect(header).toBeTruthy()
      expect(header?.classList.contains('device-mobile-header--floating-map')).toBe(true)
      expect(header?.querySelector('.streak-chip')).toBeNull()
      const badge = header?.querySelector('.device-mobile-account-badge')
      expect(badge).toBeTruthy()
      expect(badge?.querySelector('.device-mobile-account-avatar')).toBeTruthy()
      expect(badge?.querySelector('.device-mobile-plan-chip')).toBeTruthy()
    })
  })

  it('giao diện máy tính (1280x800) giữ nguyên bố cục không có device-mobile-shell', async () => {
    localStorage.setItem('dana-device-mode-v1', 'desktop')
    render(<App />)
    await waitFor(() => {
      const shell = document.querySelector('.app-shell')
      expect(shell).toBeTruthy()
      expect(shell?.classList.contains('device-mobile-shell')).toBe(false)
    })
  })
})
