// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import App from '../src/App'

afterEach(() => { cleanup(); localStorage.clear(); vi.unstubAllGlobals(); vi.unstubAllEnvs() })
function setup(hash = '#/') {
  vi.stubEnv('VITE_AUTH_API_URL', '/api/auth')
  const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => ({ ok: false, status: 401, json: async () => ({ message: 'Thông tin đăng nhập chưa chính xác.' }) }))
  vi.stubGlobal('fetch', fetchMock)
  window.location.hash = hash
  return { user: userEvent.setup(), fetchMock }
}
it('offers the password form inline and retains credentials and error focus after rejection', async () => {
  const { user, fetchMock } = setup('#/dang-nhap')
  const view = render(<App />)
  await screen.findByLabelText('Mật khẩu')
  await waitFor(() => expect(window.location.hash).toBe('#/'))
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(document.body.style.overflow).not.toBe('hidden')
  expect(screen.queryByRole('button', { name: /Google|Apple/ })).toBeNull()
  const form = within(view.container.querySelector('.auth-inline') as HTMLElement)
  await user.type(form.getByLabelText('Tên đăng nhập hoặc Email'), 'test-player')
  await user.type(form.getByLabelText('Mật khẩu'), 'test-password')
  await user.click(form.getByRole('button', { name: 'Hiện mật khẩu' }))
  expect(form.getByLabelText('Mật khẩu')).toHaveProperty('type', 'text')
  await user.click(form.getByRole('button', { name: 'Ẩn mật khẩu' }))
  await user.click(form.getAllByRole('button', { name: 'Đăng nhập', exact: true }).at(-1)!)
  const alert = await screen.findByRole('alert')
  expect(alert.textContent).toBe('Thông tin đăng nhập chưa chính xác.')
  await waitFor(() => expect(document.activeElement).toBe(alert))
  expect(form.getByLabelText('Tên đăng nhập hoặc Email')).toHaveProperty('value', 'test-player')
  expect(form.getByLabelText('Mật khẩu')).toHaveProperty('value', 'test-password')
  const request = fetchMock.mock.calls.find(call => String(call[0]).endsWith('/login'))
  expect(request?.[1]).toMatchObject({ credentials: 'include', body: JSON.stringify({ username: 'test-player', password: 'test-password' }) })
  await user.keyboard('{Escape}')
  expect(form.getByLabelText('Mật khẩu')).toHaveProperty('value', 'test-password')
})
it('switches inline registration back to login while clearing passwords and retaining username', async () => {
  const { user } = setup('#/dang-ky')
  const view = render(<App />)
  await screen.findByLabelText('Tên người dùng')
  await waitFor(() => expect(window.location.hash).toBe('#/'))
  const form = within(view.container.querySelector('.auth-inline') as HTMLElement)
  await user.type(form.getByLabelText('Tên người dùng'), 'new-player')
  await user.type(form.getByLabelText('Mật khẩu'), 'test-password')
  await user.click(form.getByRole('button', { name: 'Đăng nhập ngay' }))
  expect(form.getByLabelText('Tên đăng nhập hoặc Email')).toHaveProperty('value', 'new-player')
  expect(form.getByLabelText('Mật khẩu')).toHaveProperty('value', '')
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(window.location.hash).toBe('#/')
})

it('traps focus in the Quest login sheet and restores the page when dismissed', async () => {
  const { user } = setup('#/quest-cua-toi')
  render(<App />)
  const dialog = await screen.findByRole('dialog', { name: 'Đăng nhập hoặc tạo tài khoản' })
  expect(dialog.getAttribute('aria-modal')).toBe('true')
  const close = within(dialog).getByRole('button', { name: 'Đóng đăng nhập' })
  close.focus()
  await user.keyboard('{Shift>}{Tab}{/Shift}')
  expect(within(dialog).getByRole('link', { name: 'Quyền riêng tư', exact: true })).toBe(document.activeElement)
  await user.keyboard('{Tab}')
  expect(document.activeElement).toBe(close)
  await user.keyboard('{Escape}')
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  expect(window.location.hash).toBe('#/quest-cua-toi')
  expect(document.body.style.overflow).not.toBe('hidden')
})
