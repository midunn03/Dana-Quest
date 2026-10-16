// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within, act } from '@testing-library/react'
import { StrictMode } from 'react'
import userEvent from '@testing-library/user-event'
import App from '../src/App'
import { openDatabase, loadProgress } from '../src/lib/storage'
import { coinBalance } from '../src/lib/progress'
import { destinations } from '../src/data/destinations'



beforeEach(async () => {
  vi.stubEnv('VITE_AUTH_API_URL', 'https://auth.test')
  const testProfile = { id: 'test-user', name: 'Người thử', phone: '0900000000', email: 'test@example.invalid', avatarId: 'bien' }
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    if (url.endsWith('/session')) return { ok: true, status: 200, json: async () => ({ user: testProfile }) } as Response
    if (url.endsWith('/profile/avatar')) return { ok: true, status: 200, json: async () => ({ user: { ...testProfile, avatarId: JSON.parse(String(init?.body)).avatarId } }) } as Response
    if (url.startsWith('/api/recommendations/nearby')) return { ok: true, status: 200, json: async () => ({ items: destinations.slice(0, 3).map(place => ({ id: place.id, distanceKm: 0.2, highlightReason: place.highlightReason })) }) } as Response
    return { ok: true, status: 200, json: async () => ({ user: testProfile }) } as Response
  }))
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} })
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  // jsdom has no layout engine; Leaflet needs nonzero dimensions for event coordinates.
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ x: 0, y: 0, left: 0, top: 0, right: 800, bottom: 580, width: 800, height: 580, toJSON: () => ({}) })
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(800)
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(580)
  vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(800)
  vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(580)
  const db = await openDatabase()
  await new Promise<void>(resolve => {
    const tx = db.transaction(['state', 'photos'], 'readwrite')
    tx.objectStore('state').clear(); tx.objectStore('photos').clear(); tx.oncomplete = () => resolve()
  })
  window.location.hash = '#/'
})
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs() })

it('does not award coins when opening or reloading the demonstration celebration', async () => {
  window.location.hash = '#/hoan-thanh/demo'
  const view = render(<App />)
  await screen.findByText('Minh họa phần thưởng · không cộng xu')
  expect(coinBalance(await loadProgress())).toBe(0)
  view.unmount()
  render(<App />)
  await screen.findByText('Minh họa phần thưởng · không cộng xu')
  expect(coinBalance(await loadProgress())).toBe(0)
})

it('restores the session, navigates through map, selects six missions, completes five, reloads and redeems a demo voucher', async () => {
  const user = userEvent.setup()
  const view = render(<App />)
  await screen.findByRole('region', { name: 'Khám phá bản đồ' })
  expect(screen.queryByText('Lọc khoảng cách')).toBeNull()
  expect(screen.queryByRole('heading', { name: 'Khám phá Đà Nẵng' })).toBeNull()
  expect(document.querySelectorAll('.destination-pin')).toHaveLength(15)
  await user.type(screen.getByRole('searchbox'), 'cau rong')
  await waitFor(() => expect(document.querySelectorAll('.destination-pin')).toHaveLength(1))
  fireEvent.click(screen.getByRole('button', { name: 'Cầu Rồng', exact: true }), { clientX: 400, clientY: 300 })
  expect(document.querySelector('.destination-sheet')?.classList.contains('expanded')).toBe(false)
  await user.click(await screen.findByRole('link', { name: 'Bắt đầu khám phá', exact: true }))
  await user.click(await screen.findByRole('link', { name: 'Bắt đầu khám phá →' }))
  await user.click(await screen.findByRole('link', { name: 'Xem nhiệm vụ →' }))
  await screen.findByRole('heading', { name: 'Chọn số lượng nhiệm vụ' })
  expect(screen.queryAllByRole('checkbox')).toHaveLength(0)
  vi.spyOn(Math, 'random').mockReturnValue(.5)
  await user.selectOptions(screen.getByRole('combobox', { name: 'Số lượng nhiệm vụ' }), '6')
  await user.click(screen.getByRole('button', { name: 'Nhận 6 nhiệm vụ' }))
  await screen.findByRole('heading', { name: 'Nhiệm vụ của bạn' })
  for (let index = 0; index < 5; index++) {
    const button = screen.getAllByRole('button', { name: 'Tôi xác nhận đã hoàn thành' })[0] as HTMLButtonElement
    await waitFor(() => expect(button.disabled).toBe(false))
    await user.click(button)
    await waitFor(() => expect(screen.getAllByText('Đã hoàn thành · Đã nhận 10 xu demo')).toHaveLength(index + 1))
  }
  await screen.findByText(/5\/6 nhiệm vụ đã xong. Đã hoàn thành điểm đến/)
  view.unmount()
  render(<App />)
  await screen.findByText(/5\/6 nhiệm vụ đã xong. Đã hoàn thành điểm đến/)
  await user.click(within(screen.getByRole('navigation', { name: 'Điều hướng chính' })).getByRole('link', { name: 'Đổi quà' }))
  await screen.findByRole('heading', { name: 'Đổi phần thưởng' })
  const redeem = screen.getByRole('button', { name: 'Đổi với 50 xu demo' }) as HTMLButtonElement
  await waitFor(() => expect(redeem.disabled).toBe(false))
  await user.click(redeem)
  expect(screen.getByRole('alertdialog').textContent).toContain('50 xu demo')
  expect(coinBalance(await loadProgress())).toBe(50)
  await user.click(screen.getByRole('button', { name: 'Xác nhận đổi' }))
  await screen.findByText(/Voucher demo đã đổi; không có mã sử dụng thực/)
  expect(coinBalance(await loadProgress())).toBe(0)
}, 20000)

it('opens the correct map sheet for every active destination', async () => {
  const user = userEvent.setup()
  window.location.hash = '#/kham-pha'
  render(<App />)
  await screen.findByRole('region', { name: 'Khám phá bản đồ' })

  for (const place of destinations) {
    const dock = screen.getByRole('region', { name: 'Gợi ý địa điểm' })
    const handle = within(dock).getByRole('button', { name: 'NỔI BẬT TRONG KHU VỰC' })
    if (handle.getAttribute('aria-expanded') !== 'true') await user.click(handle)
    await user.click(within(dock).getByRole('button', { name: 'Tất cả' }))
    const option = Array.from(dock.querySelectorAll<HTMLButtonElement>('.destination-option')).find(button => button.textContent?.includes(place.name))
    expect(option).toBeTruthy()
    await user.click(option!)
    const sheet = await screen.findByRole('region', { name: `Thông tin ${place.name}` })
    expect(within(sheet).getByRole('link', { name: 'Bắt đầu khám phá' }).getAttribute('href')).toBe(`#/dia-diem/${place.id}`)
    await user.click(within(sheet).getByRole('button', { name: 'Đóng thông tin điểm đến' }))
    await waitFor(() => expect(screen.queryByRole('region', { name: `Thông tin ${place.name}` })).toBeNull())
  }
}, 60000)

it('opens map from bottom navigation repeatedly in StrictMode, retains 15 markers and shows fallback when tiles fail', async () => {
  const user = userEvent.setup()
  window.location.hash = '#/album'
  render(<StrictMode><App /></StrictMode>)
  const nav = screen.getByRole('navigation', { name: 'Điều hướng chính' })
  await user.click(within(nav).getByRole('link', { name: 'Bản đồ' }))
  await screen.findByRole('region', { name: 'Khám phá bản đồ' })
  expect(document.querySelectorAll('.destination-pin')).toHaveLength(15)
  expect(screen.getByRole('region', { name: 'Gợi ý địa điểm' })).toBeTruthy()
  const tile = document.querySelector('.leaflet-tile')
  expect(tile).toBeTruthy()
  fireEvent.error(tile!)
  await screen.findByRole('alert')
  expect(screen.getByRole('link', { name: 'Xem chi tiết Bảo tàng Điêu khắc Chăm' })).toBeTruthy()
  await user.click(screen.getByRole('button', { name: 'Thử tải lại bản đồ' }))
  expect(document.querySelectorAll('.destination-pin')).toHaveLength(15)
  expect(document.querySelectorAll('.leaflet-control-attribution')).toHaveLength(1)
  fireEvent.load(document.querySelector('.leaflet-tile')!)
  await waitFor(() => expect(screen.queryByRole('alert')).toBeNull())
  const destinationsList = screen.getByRole('region', { name: 'Gợi ý địa điểm' })
  const handle = within(destinationsList).getByRole('button', { name: 'NỔI BẬT TRONG KHU VỰC' })
  if (handle.getAttribute('aria-expanded') !== 'true') await user.click(handle)
  await user.click(within(destinationsList).getByRole('button', { name: 'Tất cả' }))
  await user.click(within(destinationsList).getByRole('button', { name: /Bảo tàng Điêu khắc Chăm/ }))
  await screen.findByRole('heading', { name: 'Bảo tàng Điêu khắc Chăm' })
  expect(document.querySelector('.destination-sheet')?.classList.contains('expanded')).toBe(false)
  const grab = document.querySelector('.sheet-grab')!
  fireEvent.pointerDown(grab, { pointerId: 1, clientY: 400 })
  fireEvent.pointerMove(grab, { pointerId: 1, clientY: 300 })
  fireEvent.pointerCancel(grab, { pointerId: 1, clientY: 300 })
  expect(document.querySelector('.destination-sheet')?.classList.contains('expanded')).toBe(false)
  fireEvent.pointerDown(grab, { pointerId: 1, clientY: 400 })
  fireEvent.pointerMove(grab, { pointerId: 1, clientY: 300 })
  fireEvent.pointerUp(grab, { pointerId: 1, clientY: 300 })
  await waitFor(() => expect(document.querySelector('.destination-sheet')?.classList.contains('expanded')).toBe(true))
  expect(document.querySelector('.destination-sheet')?.parentElement?.classList.contains('app-shell')).toBe(true)
  // The click generated after a completed drag must not immediately close the sheet.
  fireEvent.click(grab)
  expect(document.querySelector('.destination-sheet')?.classList.contains('expanded')).toBe(true)
  fireEvent.pointerDown(grab, { pointerId: 1, clientY: 300 })
  fireEvent.pointerUp(grab, { pointerId: 1, clientY: 880 })
  await waitFor(() => expect(document.querySelector('.destination-sheet')).toBeNull())
  const dock2 = screen.getByRole('region', { name: 'Gợi ý địa điểm' })
  const handle2 = within(dock2).getByRole('button', { name: 'NỔI BẬT TRONG KHU VỰC' })
  if (handle2.getAttribute('aria-expanded') !== 'true') await user.click(handle2)
  await user.click(within(dock2).getByRole('button', { name: 'Tất cả' }))
  await user.click(within(dock2).getByRole('button', { name: /Bảo tàng Điêu khắc Chăm/ }))
  expect(document.querySelector('.destination-sheet')?.classList.contains('expanded')).toBe(false)
  await user.click(screen.getByRole('button', { name: 'Đóng thông tin điểm đến' }))
  await waitFor(() => expect(document.querySelector('.destination-sheet')).toBeNull())
  await user.click(within(nav).getByRole('link', { name: 'Bản đồ' }))
  await screen.findByRole('region', { name: 'Khám phá bản đồ' })
  expect(document.querySelectorAll('.destination-pin')).toHaveLength(15)
})

it('shows an actionable error after a stalled tile request', async () => {
  vi.useFakeTimers()
  const imgSpy = vi.spyOn(HTMLImageElement.prototype, 'src', 'set').mockImplementation(() => {})
  try {
    window.location.hash = '#/kham-pha'
    const view = render(<App />)
    await act(async () => { await vi.advanceTimersByTimeAsync(100) })
    await act(async () => { await vi.advanceTimersByTimeAsync(12000) })
    expect(screen.getByRole('alert').textContent).toContain('Không tải được nền bản đồ')
    expect(screen.getAllByRole('link', { name: /^Xem chi tiết/ })).toHaveLength(5)
    view.unmount()
  } finally {
    imgSpy.mockRestore()
    vi.useRealTimers()
  }
})

it('shows recovery links for unknown routes and keeps map aliases and trailing slashes reachable', async () => {
  const user = userEvent.setup()
  window.location.hash = '#/trang-khong-ton-tai'
  render(<App />)
  await screen.findByRole('heading', { name: 'Không tìm thấy trang' })
  await user.click(screen.getByRole('link', { name: 'Mở bản đồ' }))
  await screen.findByRole('region', { name: 'Khám phá bản đồ' })
  for (const route of ['#/map/', '#/explore/', '#/kham-pha/']) {
    await act(async () => { window.location.hash = route; window.dispatchEvent(new HashChangeEvent('hashchange')) })
    expect(screen.getByRole('region', { name: 'Khám phá bản đồ' })).toBeTruthy()
  }
  await act(async () => { window.location.hash = '#/dia-diem/khong-ton-tai'; window.dispatchEvent(new HashChangeEvent('hashchange')) })
  await screen.findByRole('heading', { name: 'Không tìm thấy điểm đến' })
  await user.click(within(screen.getByRole('navigation', { name: 'Điều hướng chính' })).getByRole('link', { name: 'Bản đồ' }))
  await user.click(await screen.findByRole('link', { name: 'DANA QUEST', exact: true }))
  await screen.findByRole('region', { name: 'Khám phá bản đồ' })
  await waitFor(() => expect(window.location.hash).toBe('#/kham-pha'))
})

it('uses touch zoom without +/- controls and respects search', async () => {
  const user = userEvent.setup()
  window.location.hash = '#/kham-pha'
  render(<StrictMode><App /></StrictMode>)
  await screen.findByRole('region', { name: 'Khám phá bản đồ' })
  expect(document.querySelectorAll('.destination-pin')).toHaveLength(15)
  expect(screen.queryByRole('button', { name: 'Thu nhỏ', exact: true })).toBeNull()
  expect(screen.queryByRole('button', { name: 'Phóng to', exact: true })).toBeNull()
  await user.type(screen.getByRole('searchbox'), 'cau rong')
  await waitFor(() => expect(document.querySelectorAll('.destination-pin')).toHaveLength(1))
  expect(screen.getByRole('button', { name: 'Cầu Rồng', exact: true })).toBeTruthy()
  const searchDock = screen.getByRole('region', { name: 'Gợi ý địa điểm' })
  const searchHandle = within(searchDock).getByRole('button', { name: 'NỔI BẬT TRONG KHU VỰC' })
  if (searchHandle.getAttribute('aria-expanded') !== 'true') await user.click(searchHandle)
  await user.click(within(searchDock).getByRole('button', { name: 'Tất cả' }))
  await user.click(within(searchDock).getByRole('button', { name: /Cầu Rồng/ }))
  await screen.findByRole('region', { name: 'Thông tin Cầu Rồng' })
  await waitFor(() => expect(document.querySelectorAll('.destination-pin')).toHaveLength(1))
})
