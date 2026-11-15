// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AvatarPage from '../src/AvatarPage'
import PlayerCard from '../src/PlayerCard'
import { readAvatar, saveAvatar } from '../src/lib/avatar'

afterEach(() => { cleanup(); localStorage.clear(); vi.restoreAllMocks() })
it('returns to the account after editing and keeps server saves independent of browser storage', async () => {
  const save = vi.fn().mockResolvedValue(undefined)
  window.location.hash = '#/nhan-vat'
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })
  render(<AvatarPage editing initialAvatarId="bien" onAvatarConfirmed={save} />)
  expect(screen.getByRole('link', { name: /Tài khoản/ }).getAttribute('href')).toBe('#/tai-khoan')
  await userEvent.click(screen.getByRole('button', { name: 'Nữ', exact: true }))
  await userEvent.click(screen.getByRole('button', { name: /Lưu nhân vật/ }))
  await waitFor(() => expect(window.location.hash).toBe('#/tai-khoan'))
  expect(save).toHaveBeenCalledWith(expect.stringMatching(/^c1\.f\./))
  expect(screen.queryByRole('alert')).toBeNull()
})
it('saves only on confirmation, restores selection and allows changing it from player UI', async () => {
  const user = userEvent.setup()
  localStorage.setItem('unrelated-progress', 'keep')
  const view = render(<AvatarPage />)
  expect(screen.queryByRole('group', { name: 'Các nhân vật' })).toBeNull()
  await user.click(screen.getByRole('button', { name: 'Mullet', exact: true }))
  expect(readAvatar()).toBeNull()
  await user.click(screen.getByRole('button', { name: /Xác nhận nhân vật/ }))
  expect(readAvatar()?.look?.hair).toBe('mullet')
  expect(window.location.hash).toBe('#/bat-dau/thanh-pho')
  expect(localStorage.getItem('unrelated-progress')).toBe('keep')
  view.unmount()
  const restored = render(<AvatarPage />)
  expect(screen.getByRole('button', { name: 'Mullet', exact: true }).getAttribute('aria-pressed')).toBe('true')
  await user.click(screen.getByRole('button', { name: 'Nữ', exact: true }))
  await user.click(screen.getByRole('button', { name: /Xác nhận nhân vật/ }))
  restored.unmount()
  render(<PlayerCard />)
  expect(within(screen.getByLabelText('Nhân vật của bạn')).getByText('Nhân vật của bạn')).toBeTruthy()
  expect(screen.getByRole('link', { name: 'Đổi nhân vật' }).getAttribute('href')).toBe('#/nhan-vat')
})
it('shows storage failure without navigating away or replacing a saved avatar', async () => {
  saveAvatar('bien')
  window.location.hash = '#/nhan-vat'
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })
  render(<AvatarPage />)
  await userEvent.click(screen.getByRole('button', { name: 'Nữ', exact: true }))
  await userEvent.click(screen.getByRole('button', { name: /Xác nhận nhân vật/ }))
  await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Chưa lưu được nhân vật'))
  expect(window.location.hash).toBe('#/nhan-vat')
  expect(readAvatar()?.id).toBe('bien')
})
