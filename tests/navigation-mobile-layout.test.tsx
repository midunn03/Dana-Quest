// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import NavigationPage from '../src/NavigationPage'
import { walkingFixture } from './routing-fixture'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

function renderMobileNavigation() {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ route: walkingFixture }) })))
  vi.stubGlobal('navigator', {
    geolocation: {
      watchPosition: vi.fn(() => 11),
      clearWatch: vi.fn(),
    },
  })
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} })
  vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(800)
  vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(390)

  return render(
    <div className="app-shell device-mobile-shell device-mobile">
      <NavigationPage id="cau-rong" fromMap />
    </div>
  )
}

describe('Mobile NavigationPage flexible layout (70% map / 5% bar / 35% expandable drawer)', () => {
  it('shows compact green bar and collapsed sheet by default, then hides green bar when sheet expands to 35%', () => {
    renderMobileNavigation()

    const main = document.querySelector('main.navigation-screen') as HTMLElement
    const banner = document.querySelector('.route-instruction') as HTMLElement
    const sheet = document.querySelector('.live-route-sheet') as HTMLElement
    const handle = screen.getByRole('button', { name: 'Mở rộng hoặc thu gọn hướng dẫn' })

    // Default state: green bar visible, bottom sheet collapsed
    expect(banner.classList.contains('is-hidden')).toBe(false)
    expect(sheet.classList.contains('expanded')).toBe(false)
    expect(handle.getAttribute('aria-expanded')).toBe('false')
    expect(main.classList.contains('is-instruction-hidden')).toBe(false)

    // Tap swipe-up handle -> expands sheet to 35% and hides the green direction bar
    fireEvent.click(handle)
    expect(sheet.classList.contains('expanded')).toBe(true)
    expect(handle.getAttribute('aria-expanded')).toBe('true')
    expect(banner.classList.contains('is-hidden')).toBe(true)
    expect(main.classList.contains('is-instruction-hidden')).toBe(true)

    // Destination info is present inside the scrollable details section
    expect(document.querySelector('.route-destination-info')?.textContent).toContain('Cầu Rồng')

    // Floating restore chip lets player return to the map + green bar view in one tap
    const restoreBtn = screen.getByRole('button', { name: 'Hiện khung chỉ đường' })
    fireEvent.click(restoreBtn)
    expect(sheet.classList.contains('expanded')).toBe(false)
    expect(banner.classList.contains('is-hidden')).toBe(false)
  })

  it('lets player manually hide and restore the green direction bar independently for max map visibility', () => {
    renderMobileNavigation()

    const banner = document.querySelector('.route-instruction') as HTMLElement
    const sheet = document.querySelector('.live-route-sheet') as HTMLElement

    fireEvent.click(screen.getByRole('button', { name: 'Ẩn khung chỉ đường' }))
    expect(banner.classList.contains('is-hidden')).toBe(true)
    expect(sheet.classList.contains('expanded')).toBe(false)

    fireEvent.click(screen.getByRole('button', { name: 'Hiện khung chỉ đường' }))
    expect(banner.classList.contains('is-hidden')).toBe(false)
    expect(sheet.classList.contains('expanded')).toBe(false)
  })
})
