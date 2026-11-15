// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { usePlayerLocation } from '../src/lib/usePlayerLocation'
import Explore from '../src/Explore'
import {mapEntries} from '../src/lib/mapEntries'
import { quests } from '../src/data/quests'
import L from 'leaflet'
import { saveAvatar } from '../src/lib/avatar'

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
it('keeps quest list and visible markers aligned, displays the avatar and only recenters on request', async () => {
 const location=gps()
 vi.stubGlobal('ResizeObserver',class{observe(){}disconnect(){}})
 saveAvatar('may')
 const fitBounds=vi.spyOn(L.Map.prototype,'fitBounds')
 vi.spyOn(Element.prototype,'clientHeight','get').mockReturnValue(600)
 vi.spyOn(Element.prototype,'clientWidth','get').mockReturnValue(390)
 const view=render(<Explore/>)
 await waitFor(()=>expect(document.querySelectorAll('.atlas-pin')).toHaveLength(quests.length))
 expect(document.querySelectorAll('.atlas-list>button')).toHaveLength(quests.length)
 const map=fitBounds.mock.instances.at(-1)! as L.Map
 const calls=fitBounds.mock.calls.length
 location.update(16.0611,108.2275)
 await waitFor(()=>expect(document.querySelectorAll('.player-location-marker')).toHaveLength(1))
 await waitFor(()=>expect(document.querySelector('.player-location-marker svg')).toBeTruthy())
 expect(fitBounds.mock.calls.length).toBe(calls)
 act(()=>{map.setZoom(9,{animate:false})})
 expect(document.querySelectorAll('.atlas-pin')).toHaveLength(quests.length)
 expect(document.querySelectorAll('.atlas-pin.hidden-pin')).toHaveLength(0)
 const flyTo=vi.spyOn(L.Map.prototype,'flyTo').mockImplementation(function(this:L.Map,point,zoom){return this.setView(point,zoom)})
 fireEvent.click(screen.getByRole('button',{name:'◎ Vị trí của tôi'}))
 location.refresh(16.065,108.23)
 expect(flyTo).toHaveBeenLastCalledWith([16.065,108.23],16,{animate:true,duration:.7})
 expect(document.querySelectorAll('.player-location-marker')).toHaveLength(1)
 fireEvent.change(screen.getByRole('searchbox'),{target:{value:'cau rong'}})
 const matches=mapEntries('quests','cau rong',Date.now()).length
 await waitFor(()=>expect(document.querySelectorAll('.atlas-pin')).toHaveLength(matches))
 expect(document.querySelectorAll('.atlas-list>button')).toHaveLength(matches)
 fireEvent.click(screen.getByRole('button',{name:/Sự kiện sắp tới/}))
 await waitFor(()=>expect(document.querySelectorAll('.atlas-pin')).toHaveLength(document.querySelectorAll('.atlas-list>button').length))
 view.unmount()
})
