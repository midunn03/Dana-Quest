// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { usePlayerLocation, QUICK_LOCATION_OPTIONS, LIVE_LOCATION_OPTIONS } from '../src/lib/usePlayerLocation'
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.useRealTimers() })
function device() {
  let live: PositionCallback
  let fail: PositionErrorCallback
  const quickCallbacks: PositionCallback[] = []
  const getCurrentPosition = vi.fn((ok: PositionCallback) => { quickCallbacks.push(ok) })
  const watchPosition = vi.fn((ok: PositionCallback, bad: PositionErrorCallback) => { live = ok; fail = bad; return 17 })
  const clearWatch = vi.fn()
  vi.stubGlobal('navigator', { geolocation: { getCurrentPosition, watchPosition, clearWatch } })
  const value = (accuracy: number, age = 0, latitude = 16.06) => ({ coords: { latitude, longitude: 108.23, accuracy }, timestamp: Date.now() - age } as GeolocationPosition)
  return { getCurrentPosition, watchPosition, clearWatch, quick: (accuracy: number, age = 0, index = 0) => act(() => quickCallbacks[index](value(accuracy, age))), live: (accuracy: number, age = 0, latitude = 16.06) => act(() => live(value(accuracy, age, latitude))), fail: (code = 3) => act(() => fail({ code } as GeolocationPositionError)) }
}
it('uses a quick 91 m fix immediately and then improves it from live GPS', () => {
  const gps = device()
  const hook = renderHook(usePlayerLocation)
  expect(gps.getCurrentPosition.mock.calls[0][2]).toEqual(QUICK_LOCATION_OPTIONS)
  expect(gps.watchPosition.mock.calls[0][2]).toEqual(LIVE_LOCATION_OPTIONS)
  gps.quick(91, 15000)
  expect(hook.result.current.sample?.accuracy).toBe(91)
  gps.live(10)
  expect(hook.result.current.sample?.accuracy).toBe(10)
  gps.quick(3000, 20000)
  expect(hook.result.current.sample?.accuracy).toBe(10)
  gps.fail()
  expect(hook.result.current.sample?.accuracy).toBe(10)
  expect(hook.result.current.error).toBe('')
  hook.unmount()
  expect(gps.clearWatch).toHaveBeenCalledWith(17)
})
it('reports a missing fix within seconds and retries without waiting indefinitely', () => {
  vi.useFakeTimers()
  const gps = device()
  const hook = renderHook(usePlayerLocation)
  act(() => vi.advanceTimersByTime(6500))
  expect(hook.result.current.error).toContain('Chưa nhận được vị trí')
  act(() => vi.advanceTimersByTime(3500))
  expect(gps.getCurrentPosition).toHaveBeenCalledTimes(2)
  gps.quick(91, 0, 1)
  expect(hook.result.current.sample?.accuracy).toBe(91)
  expect(hook.result.current.error).toBe('')
  gps.quick(3000, 0, 0)
  expect(hook.result.current.sample?.accuracy).toBe(91)
  hook.unmount()
  act(() => vi.advanceTimersByTime(30000))
  expect(gps.getCurrentPosition).toHaveBeenCalledTimes(2)
})
it('shows approximate coordinates while improving them, rejects stale data and stops retrying after denial', () => {
  vi.useFakeTimers()
  const gps = device()
  const hook = renderHook(usePlayerLocation)
  gps.quick(1000)
  expect(hook.result.current.sample?.accuracy).toBe(1000)
  expect(hook.result.current.error).toContain('±1000 m')
  gps.live(10, 70000)
  expect(hook.result.current.sample?.accuracy).toBe(1000)
  gps.fail(1)
  expect(hook.result.current.sample).toBeNull()
  act(() => vi.advanceTimersByTime(30000))
  expect(gps.getCurrentPosition).toHaveBeenCalledTimes(1)
})
