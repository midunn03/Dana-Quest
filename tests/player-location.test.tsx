// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { usePlayerLocation } from '../src/lib/usePlayerLocation'
import Explore from '../src/Explore'
import { destinations } from '../src/data/destinations'
import { distanceMeters } from '../src/lib/location'
import L from 'leaflet'
import { avatars, saveAvatar } from '../src/lib/avatar'

afterEach(() => { cleanup(); localStorage.clear(); vi.restoreAllMocks(); vi.unstubAllGlobals() })
function gps() {
  let success: PositionCallback
  let failure: PositionErrorCallback
  let refresh: PositionCallback
  const clearWatch = vi.fn()
  vi.stubGlobal('navigator', { geolocation: { watchPosition: vi.fn((ok, bad) => { success = ok; failure = bad; return 42 }), getCurrentPosition: vi.fn(ok => { refresh = ok }), clearWatch } })
  return { update: (latitude: number, longitude: number, accuracy = 15) => act(() => success({ coords: { latitude, longitude, accuracy }, timestamp: Date.now() } as GeolocationPosition)), refresh: (latitude: number, longitude: number) => act(() => refresh({ coords: { latitude, longitude, accuracy: 15 }, timestamp: Date.now() } as GeolocationPosition)), deny: () => act(() => failure({ code: 1 } as GeolocationPositionError)), clearWatch }
}
it('accepts current precise samples, rejects inaccurate locations, reports permission denial and stops watching', () => {
  const location = gps()
  const hook = renderHook(usePlayerLocation)
  location.update(16.06, 108.22)
  expect(hook.result.current.sample?.latitude).toBe(16.06)
  location.update(16.06, 108.22, 1000)
  expect(hook.result.current.sample?.accuracy).toBe(15)
  location.deny()
  expect(hook.result.current.error).toContain('chưa cho phép')
  hook.unmount()
  expect(location.clearWatch).toHaveBeenCalledWith(42)
})
it('starts collapsed, displays the player, restricts nearby places to 3 km and updates when the player moves', async () => {
  const location = gps()
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} })
  saveAvatar('may')
  const fitBounds = vi.spyOn(L.Map.prototype, 'fitBounds')
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ x: 0, y: 0, width: 390, height: 600, top: 0, left: 0, right: 390, bottom: 600, toJSON() {} })
  vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(600)
  vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(390)
  const view = render(<Explore />)
  expect(screen.getByRole('button', { name: 'NỔI BẬT TRONG KHU VỰC' }).getAttribute('aria-expanded')).toBe('false')
  expect(document.getElementById('nearby-content')?.hidden).toBe(true)
  location.update(16.0611, 108.2275)
  await waitFor(() => expect(document.querySelectorAll('.player-location-marker')).toHaveLength(1))
  const map = fitBounds.mock.instances.at(-1)! as L.Map
  expect(map.getBounds().contains([16.0611, 108.2275])).toBe(true)
  expect(map.getZoom()).toBe(15) // mở bản đồ quanh vị trí người chơi (khoảng 1 km), không thu nhỏ toàn thành phố
  expect(document.querySelectorAll('.destination-pin')).toHaveLength(destinations.length)
  const smallPinWidth = parseFloat((document.querySelector('.destination-pin') as HTMLElement).style.width)
  const smallPlayerWidth = parseFloat((document.querySelector('.player-location-marker') as HTMLElement).style.width)
  act(() => { map.setZoom(16, { animate: false }) })
  expect(parseFloat((document.querySelector('.destination-pin') as HTMLElement).style.width)).toBeGreaterThan(smallPinWidth)
  expect(parseFloat((document.querySelector('.player-location-marker') as HTMLElement).style.width)).toBeGreaterThan(smallPlayerWidth)
  const largePinWidth = parseFloat((document.querySelector('.destination-pin') as HTMLElement).style.width)
  act(() => { map.setZoom(12, { animate: false }) })
  expect(document.querySelectorAll('.destination-pin')).toHaveLength(destinations.length)
  expect(parseFloat((document.querySelector('.destination-pin') as HTMLElement).style.width)).toBeLessThan(largePinWidth)
  expect(document.querySelector('.player-location-marker')?.getAttribute('title')).toBe(`Vị trí của bạn · ${avatars.find(avatar => avatar.id === 'may')!.name}`)
  await waitFor(() => expect(document.querySelector('.player-location-marker svg')).toBeTruthy())
  vi.stubGlobal('isSecureContext', true)
  const flyTo = vi.spyOn(L.Map.prototype, 'flyTo').mockImplementation(function (this: L.Map, point, zoom) { return this.setView(point, zoom) })
  fireEvent.click(document.querySelector('.map-compass')!)
  expect(document.querySelectorAll('.player-location-marker')).toHaveLength(1)
  location.refresh(16.065, 108.23)
  expect(flyTo).toHaveBeenLastCalledWith([16.065, 108.23], 15, { animate: true, duration: .7 })
  await waitFor(() => expect(document.querySelector('.player-location-marker svg')).toBeTruthy())
  expect(document.querySelectorAll('.player-location-marker')).toHaveLength(1)
  location.update(16.0611, 108.2275)
  fireEvent.click(screen.getByRole('button', { name: 'NỔI BẬT TRONG KHU VỰC' }))
  const chips = [...document.querySelectorAll('.nearby-list .suggestion-chip')]
  expect(chips.length).toBeGreaterThan(0)
  expect(chips.length).toBeLessThanOrEqual(6)
  for (const chip of chips) {
    const place = destinations.find(place => chip.textContent?.startsWith(place.name))!
    expect(distanceMeters([16.0611, 108.2275], place.position) + 15).toBeLessThanOrEqual(3000)
  }
  expect(document.querySelector('.place-number')).toBeNull()
  location.update(21.0285, 105.8542)
  expect(document.querySelectorAll('.nearby-list .suggestion-chip')).toHaveLength(0)
  expect(screen.getByText('Chưa có địa điểm phù hợp trong 3 km quanh bạn.')).toBeTruthy()
  view.unmount()
})
