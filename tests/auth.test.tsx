// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../src/App'

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

function response(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response
}

it.each(['bien', null])('restores a session from home without showing the welcome screen (avatar: %s)', async avatarId => {
  vi.stubEnv('VITE_AUTH_API_URL', 'https://auth.test/api/auth')
  let resolveSession!: (value: Response) => void
  vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(resolve => { resolveSession = resolve })))
  window.location.hash = '#/'
  render(<App />)
  expect(screen.getByRole('status').textContent).toContain('Đang mở hành trình')
  resolveSession(response(200, { user: { id: 'returning', name: 'Minh', avatarId } }))
  await waitFor(() => expect(window.location.hash).toBe(avatarId ? '#/kham-pha' : '#/chon-nhan-vat'))
  if (avatarId) expect(await screen.findByRole('region', { name: 'Khám phá bản đồ' })).toBeTruthy()
  else expect(await screen.findByRole('heading', { name: 'Chọn nhân vật' })).toBeTruthy()
})

function mockAuthApi(profile: { id: string; name: string; phone?: string; email?: string; avatarId?: string | null }) {
  const requests: Array<{ url: string; init?: RequestInit }> = []
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    requests.push({ url, init })
    if (url.endsWith('/session')) return response(401, { message: 'No session' })
    if (url.endsWith('/register') || url.endsWith('/login')) return response(200, { user: profile })
    if (url.endsWith('/profile/avatar')) return response(200, { user: { ...profile, avatarId: JSON.parse(String(init?.body)).avatarId } })
    if (url.startsWith('/api/recommendations/nearby')) return response(200, { items: [] })
    return response(404, { message: 'Not found' })
  })
  vi.stubGlobal('fetch', fetchMock)
  return { requests, fetchMock }
}

it('blocks a direct private URL and explains missing backend configuration', async () => {
  vi.stubEnv('VITE_AUTH_API_URL', '')
  window.location.hash = '#/kham-pha'
  render(<App />)
  await screen.findByRole('heading', { name: 'Đăng nhập' })
  expect(await screen.queryByRole('region', { name: 'Khám phá bản đồ' })).toBeNull()
  expect(screen.getByText(/VITE_AUTH_API_URL/)).toBeTruthy()
  await userEvent.click(screen.getByRole('button', { name: 'Đăng ký', exact: true }))
  await userEvent.type(screen.getByLabelText('Tên người dùng'), 'Linh Nguyễn')
  expect((screen.getByLabelText('Tên người dùng') as HTMLInputElement).value).toBe('Linh Nguyễn')
  expect(screen.getAllByRole('button', { name: 'Tạo tài khoản', exact: true }).at(-1)?.disabled).toBe(true)
  expect(window.location.hash).toBe('#/dang-ky')
})

it('registers username and password through the configured API, then requires avatar setup', async () => {
  vi.stubEnv('VITE_AUTH_API_URL', 'https://auth.test/api/auth')
  const { requests } = mockAuthApi({ id: 'new-user', name: 'Linh Nguyễn', avatarId: null })
  window.location.hash = '#/dang-ky'
  const user = userEvent.setup()
  render(<App />)
  await screen.findByRole('heading', { name: 'Tạo tài khoản' })
  await user.type(screen.getByLabelText('Tên người dùng'), 'Linh Nguyễn')
  await user.type(screen.getByLabelText('Mật khẩu'), 'a-long-test-password')
  await user.click(screen.getAllByRole('button', { name: 'Tạo tài khoản', exact: true }).at(-1)!)
  await screen.findByRole('heading', { name: 'Chọn nhân vật' })
  const request = requests.find(item => item.url.endsWith('/register'))
  expect(request?.init?.credentials).toBe('include')
  expect(JSON.parse(String(request?.init?.body))).toMatchObject({ username: 'Linh Nguyễn', password: 'a-long-test-password' })
  expect(localStorage.getItem('accessToken')).toBeNull()
  expect(localStorage.getItem('session')).toBeNull()
  await user.click(screen.getByRole('button', { name: /Xác nhận nhân vật/ }))
  await waitFor(() => expect(requests.some(item => item.url.endsWith('/profile/avatar'))).toBe(true))
  await waitFor(() => expect(window.location.hash).toBe('#/kham-pha'))
})

it('logs returning users in with a server session and goes directly to the map', async () => {
  vi.stubEnv('VITE_AUTH_API_URL', 'https://auth.test/api/auth')
  const { requests } = mockAuthApi({ id: 'returning-user', name: 'Minh Trần', avatarId: 'bien' })
  window.location.hash = '#/dang-nhap'
  const user = userEvent.setup()
  render(<App />)
  await screen.findByRole('heading', { name: 'Đăng nhập' })
  await user.type(screen.getByLabelText('Tên đăng nhập hoặc Email'), 'Minh Trần')
  await user.type(screen.getByLabelText('Mật khẩu'), 'a-long-test-password')
  await user.click(screen.getAllByRole('button', { name: 'Đăng nhập', exact: true }).at(-1)!)
  await screen.findByRole('region', { name: 'Khám phá bản đồ' })
  const request = requests.find(item => item.url.endsWith('/login'))
  expect(request?.init?.credentials).toBe('include')
  expect(JSON.parse(String(request?.init?.body))).toEqual({ username: 'Minh Trần', password: 'a-long-test-password' })
})

it('asks for confirmation before logging out', async () => {
  vi.stubEnv('VITE_AUTH_API_URL', 'https://auth.test/api/auth')
  const requests: string[] = []
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input); requests.push(url)
    if (url.endsWith('/session')) return response(200, { user: { id: 'member', name: 'Minh', avatarId: 'bien' } })
    if (url.endsWith('/game')) return response(200, { revision: 0, state: { version: 1, destinations: {}, redemptions: [] }, photos: [] })
    if (url.endsWith('/logout')) return response(204, {})
    return response(404, {})
  }))
  window.location.hash = '#/tai-khoan'
  const user = userEvent.setup()
  render(<App />)
  await screen.findByRole('heading', { name: 'Tài khoản' })
  await user.click(screen.getByRole('button', { name: 'Đăng xuất' }))
  expect(screen.getByRole('alertdialog').textContent).toContain('Tiến độ, ảnh và xu')
  expect(requests.some(url => url.endsWith('/logout'))).toBe(false)
  await user.click(screen.getByRole('button', { name: 'Hủy' }))
  expect(screen.queryByRole('alertdialog')).toBeNull()
  await user.click(screen.getByRole('button', { name: 'Đăng xuất' }))
  await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Đăng xuất' }))
  await waitFor(() => expect(requests.some(url => url.endsWith('/logout'))).toBe(true))
  await waitFor(() => expect(window.location.hash).toBe('#/dang-nhap'))
})
