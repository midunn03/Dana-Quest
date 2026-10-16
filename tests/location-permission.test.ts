// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { requestLocationAfterAuthentication } from '../src/lib/locationPermission'

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks() })

it('requests device location immediately after authentication', () => {
  vi.stubGlobal('isSecureContext', true)
  const getCurrentPosition = vi.fn()
  vi.stubGlobal('navigator', { ...navigator, geolocation: { getCurrentPosition } })
  requestLocationAfterAuthentication()
  expect(getCurrentPosition).toHaveBeenCalledWith(expect.any(Function), expect.any(Function), { enableHighAccuracy: false, maximumAge: 30_000, timeout: 5_000 })
})
