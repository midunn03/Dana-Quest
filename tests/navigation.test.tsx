// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import L from 'leaflet'
import NavigationPage from '../src/NavigationPage'
import { getDestination } from '../src/data/destinations'
import { walkingFixture } from './routing-fixture'
import { formatMeters, routeProgress } from '../src/lib/routing'
import { canNavigateFrom } from '../src/lib/navigationGuard'

afterEach(() => { cleanup(); window.history.replaceState(null, '', '#/'); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers() })
function setup() {
  let success: PositionCallback
  let failure: PositionErrorCallback
  const clearWatch = vi.fn()
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ route: walkingFixture }) })))
  vi.stubGlobal('navigator', { geolocation: { watchPosition: vi.fn((ok, bad) => { success = ok; failure = bad; return 7 }), clearWatch } })
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} })
  vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(650)
  vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(390)
  const update = (latitude: number, longitude: number, accuracy = 10) => act(() => success({ coords: { latitude, longitude, accuracy }, timestamp: Date.now() } as GeolocationPosition))
  const markerMove = vi.spyOn(L.Marker.prototype, 'setLatLng')
  const lineMove = vi.spyOn(L.Polyline.prototype, 'setLatLngs')
  const view = render(<NavigationPage id="cau-rong" />)
  return { update, markerMove, lineMove, clearWatch, view, deny: () => act(() => failure({ code: 1 } as GeolocationPositionError)) }
}
it('uses the same live GPS coordinates for avatar, direction line and automatic distance', async () => {
  const { update, markerMove, lineMove, clearWatch, view } = setup()
  const destination = getDestination('cau-rong')!
  expect(document.querySelector('.navigation-player-marker')).toBeNull()
  expect(document.querySelector('.route-avatar')).toBeNull()
  expect(screen.queryByRole('button', { name: /Cập nhật khoảng cách/ })).toBeNull()
  expect(screen.getByRole('link', { name: 'Xem nhiệm vụ →' }).getAttribute('href')).toBe('#/nhiem-vu/cau-rong')
  update(16.08, 108.24)
  await waitFor(() => expect(document.querySelector('.navigation-player-marker svg')).toBeTruthy())
  const player = markerMove.mock.instances.at(-1)! as L.Marker
  expect(player.getLatLng()).toEqual(L.latLng(16.08, 108.24))
  await waitFor(() => expect(lineMove).toHaveBeenLastCalledWith(walkingFixture.geometry.coordinates.map(([lng, lat]) => [lat, lng])))
  expect(screen.getByText(/Sau đó rẽ trái vào Đường B/)).toBeTruthy()
  const oldDistance = screen.getByRole('heading', { level: 2 }).textContent
  update(16.065, 108.23)
  expect(screen.getByText('Rẽ phải vào Đường C')).toBeTruthy()
  expect(player.getLatLng()).toEqual(L.latLng(16.065, 108.23))
  expect(lineMove).toHaveBeenLastCalledWith([[16.065, 108.23], destination.position])
  expect(document.querySelectorAll('.navigation-player-marker')).toHaveLength(1)
  const progress = routeProgress(walkingFixture, { latitude: 16.065, longitude: 108.23, accuracy: 10, timestamp: Date.now() })
  expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(`Còn ${formatMeters(progress.remaining)} đi bộ`)
  expect(screen.getByRole('heading', { level: 2 }).textContent).not.toBe(oldDistance)
  update(16.1, 108.3, 1000)
  expect(player.getLatLng()).toEqual(L.latLng(16.065, 108.23))
  const handle = screen.getByRole('button', { name: 'Mở rộng hoặc thu gọn hướng dẫn' })
  fireEvent.click(handle)
  expect(handle.getAttribute('aria-expanded')).toBe('true')
  fireEvent.keyDown(handle, { key: 'ArrowDown' })
  expect(handle.getAttribute('aria-expanded')).toBe('false')
  const sheet = document.querySelector('.live-route-sheet') as HTMLElement
  vi.spyOn(sheet, 'getBoundingClientRect').mockReturnValue({ height: 210 } as DOMRect)
  const pointer = (type: string, y: number) => {
    const event = new Event(type, { bubbles: true })
    Object.assign(event, { pointerId: 1, clientY: y, button: 0 })
    fireEvent(handle, event)
  }
  pointer('pointerdown', 500)
  pointer('pointermove', 300)
  expect(sheet.style.height).toBe('410px')
  pointer('pointerup', 300)
  expect(handle.getAttribute('aria-expanded')).toBe('true')
  pointer('pointerdown', 300)
  pointer('pointermove', 500)
  pointer('pointerup', 500)
  expect(handle.getAttribute('aria-expanded')).toBe('false')
  view.unmount()
  expect(clearWatch).toHaveBeenCalledWith(7)
})
it('does not invent a player position when permission is denied and removes stale GPS markers', async () => {
  vi.useFakeTimers()
  const { update, deny } = setup()
  deny()
  expect(document.querySelector('.navigation-player-marker')).toBeNull()
  update(16.08, 108.24)
  expect(document.querySelector('.navigation-player-marker')).toBeTruthy()
  act(() => { vi.advanceTimersByTime(65000) })
  expect(document.querySelector('.navigation-player-marker')).toBeNull()
  expect(screen.getByRole('heading', { level: 2 }).textContent).toContain('Vị trí đã cũ')
})
it('confirms the back arrow, keeps GPS running on cancel, and returns to details on confirmation', () => {
  window.history.replaceState(null, '', '#/chi-duong/cau-rong')
  const { update, clearWatch } = setup()
  const back = screen.getByRole('link', { name: 'Quay lại chi tiết' })
  fireEvent.click(back)
  expect(screen.getByRole('alertdialog', { name: 'Rời khỏi hành trình?' })).toBeTruthy()
  expect(window.location.hash).toBe('#/chi-duong/cau-rong')
  update(16.08, 108.24)
  expect(document.querySelector('.navigation-player-marker')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Tiếp tục hành trình' }))
  expect(screen.queryByRole('alertdialog')).toBeNull()
  expect(window.location.hash).toBe('#/chi-duong/cau-rong')
  expect(clearWatch).not.toHaveBeenCalled()
  expect(document.activeElement).toBe(back)
  fireEvent.click(back)
  fireEvent.click(screen.getByRole('button', { name: 'Rời khỏi hành trình' }))
  expect(window.location.hash).toBe('#/dia-diem/cau-rong')
  expect(canNavigateFrom('#/chi-duong/cau-rong')).toBe(true)
})
it('blocks browser back until confirmed', () => {
  const current = '#/chi-duong/cau-rong'
  window.history.replaceState(null, '', current)
  setup()
  window.history.replaceState(null, '', '#/dia-diem/cau-rong')
  act(() => { expect(canNavigateFrom(current)).toBe(false) })
  expect(window.location.hash).toBe(current)
  expect(screen.getByRole('alertdialog')).toBeTruthy()
  fireEvent.keyDown(window, { key: 'Escape' })
  expect(screen.queryByRole('alertdialog')).toBeNull()
  expect(window.location.hash).toBe(current)
  window.history.replaceState(null, '', '#/dia-diem/cau-rong')
  act(() => { expect(canNavigateFrom(current)).toBe(false) })
  fireEvent.click(screen.getByRole('button', { name: 'Rời khỏi hành trình' }))
  expect(canNavigateFrom(current)).toBe(true)
  expect(window.location.hash).toBe('#/dia-diem/cau-rong')
})
it('allows the mission button to continue the journey without an exit popup', () => {
  const current = '#/chi-duong/cau-rong'
  window.history.replaceState(null, '', current)
  setup()
  fireEvent.click(screen.getByRole('link', { name: 'Xem nhiệm vụ →' }))
  window.history.replaceState(null, '', '#/nhiem-vu/cau-rong')
  expect(canNavigateFrom(current)).toBe(true)
  expect(screen.queryByRole('alertdialog')).toBeNull()
})
