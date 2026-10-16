// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { useWalkingRoute } from '../src/lib/useWalkingRoute'
import { walkingFixture } from './routing-fixture'
import type { LocationSample } from '../src/lib/location'
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers() })
const gps = (latitude: number, longitude: number, accuracy = 10): LocationSample => ({ latitude, longitude, accuracy, timestamp: Date.now() })
it('updates progress locally and reroutes after leaving the road without requesting on every GPS tick', async () => {
  const fetcher = vi.fn(async () => ({ ok: true, json: async () => ({ route: walkingFixture }) }))
  vi.stubGlobal('fetch', fetcher)
  const hook = renderHook(({ sample }) => useWalkingRoute('cau-rong', sample), { initialProps: { sample: gps(16.08, 108.24) } })
  await waitFor(() => expect(hook.result.current.route).toBeTruthy())
  hook.rerender({ sample: gps(16.08, 108.235) })
  expect(fetcher).toHaveBeenCalledTimes(1)
  const first = hook.result.current.progress!.toTurn
  hook.rerender({ sample: gps(16.08, 108.231) })
  expect(hook.result.current.progress!.toTurn).toBeLessThan(first)
  vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 16000)
  hook.rerender({ sample: gps(16.09, 108.25) })
  expect(hook.result.current.progress).toBeNull()
  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2))
})
it('waits for accurate GPS, rejects malformed routes and never substitutes a direct route on failures', async () => {
  const fetcher = vi.fn(async () => ({ ok: false, json: async () => ({ error: 'Không có tuyến' }) }))
  vi.stubGlobal('fetch', fetcher)
  const hook = renderHook(({ sample }) => useWalkingRoute('cau-rong', sample), { initialProps: { sample: gps(16.08, 108.24, 300) } })
  expect(fetcher).not.toHaveBeenCalled()
  hook.rerender({ sample: gps(16.08, 108.24) })
  await waitFor(() => expect(hook.result.current.error).toBe('Không có tuyến'))
  expect(hook.result.current.route).toBeNull()
})
it('starts routing immediately with a 91 m network fix instead of waiting indefinitely for 50 m GPS', async () => {
  const fetcher = vi.fn(async () => ({ ok: true, json: async () => ({ route: walkingFixture }) }))
  vi.stubGlobal('fetch', fetcher)
  const hook = renderHook(() => useWalkingRoute('cau-rong', gps(16.08, 108.24, 91)))
  await waitFor(() => expect(hook.result.current.route).toBeTruthy())
  expect(fetcher).toHaveBeenCalledTimes(1)
  expect(hook.result.current.usable).toBe(true)
  expect(hook.result.current.precise).toBe(false)
})
it('aborts an outstanding request when leaving navigation', async () => {
  let signal: AbortSignal
  vi.stubGlobal('fetch', vi.fn((_url, options) => { signal = options.signal; return new Promise(() => {}) }))
  const hook = renderHook(() => useWalkingRoute('cau-rong', gps(16.08, 108.24)))
  act(() => hook.unmount())
  expect(signal!.aborted).toBe(true)
})
