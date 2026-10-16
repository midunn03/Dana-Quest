// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LocationCheck from '../src/LocationCheck'
import { useLocation } from '../src/lib/useLocation'

function Check() { return <LocationCheck location={useLocation()} target={[16.0611, 108.2275]} /> }
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

it('shows measurement and accuracy, rejects inaccurate location, and allows retry', async () => {
  vi.stubGlobal('isSecureContext', true)
  let accuracy = 500
  const getCurrentPosition = vi.fn((success: PositionCallback) => success({ coords: { latitude: 16.0611, longitude: 108.2275, accuracy }, timestamp: Date.now() } as GeolocationPosition))
  vi.stubGlobal('navigator', { ...navigator, geolocation: { getCurrentPosition } })
  const user = userEvent.setup()
  render(<Check />)
  await user.click(screen.getByRole('button', { name: 'Dùng vị trí của tôi' }))
  expect(screen.getByText(/±500 m/)).toBeTruthy()
  expect(screen.getByText(/Tín hiệu vị trí chưa đủ chính xác/)).toBeTruthy()
  expect(screen.queryByText(/đủ gần/)).toBeNull()
  accuracy = 10
  await user.click(screen.getByRole('button', { name: 'Cập nhật khoảng cách' }))
  expect(screen.getByText(/±10 m/)).toBeTruthy()
  expect(screen.getByText('Bạn đã đến nơi!')).toBeTruthy()
  expect(screen.getByText(/đủ gần/)).toBeTruthy()
  expect(getCurrentPosition.mock.calls[0][2]).toEqual({ enableHighAccuracy: true, maximumAge: 0, timeout: 15000 })
})

it('explains permission denial without claiming arrival', async () => {
  vi.stubGlobal('isSecureContext', true)
  vi.stubGlobal('navigator', { ...navigator, geolocation: { getCurrentPosition: (_success: PositionCallback, failure: PositionErrorCallback) => failure({ code: 1 } as GeolocationPositionError) } })
  const user = userEvent.setup()
  render(<Check />)
  await user.click(screen.getByRole('button', { name: 'Dùng vị trí của tôi' }))
  expect(screen.getByText(/Bạn chưa cho phép truy cập vị trí/)).toBeTruthy()
  expect(screen.queryByText(/đủ gần/)).toBeNull()
})

it('automatically checks distance when the feature opens with location enabled', async () => {
  vi.stubGlobal('isSecureContext', true)
  const getCurrentPosition = vi.fn((success: PositionCallback) => success({ coords: { latitude: 16.0711, longitude: 108.2275, accuracy: 10 }, timestamp: Date.now() } as GeolocationPosition))
  vi.stubGlobal('navigator', { ...navigator, geolocation: { getCurrentPosition } })
  function AutomaticCheck() { return <LocationCheck location={useLocation(true)} target={[16.0611, 108.2275]} /> }
  render(<AutomaticCheck />)
  expect(await screen.findByText(/Bạn còn cách/)).toBeTruthy()
  expect(screen.getByText(/Bạn chưa đến nơi. Còn khoảng/)).toBeTruthy()
  expect(getCurrentPosition).toHaveBeenCalledOnce()
})
