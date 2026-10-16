// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ConfirmDialog from '../src/ConfirmDialog'

afterEach(cleanup)

it('requires explicit confirmation and lets the user cancel with Escape', async () => {
  const confirm = vi.fn()
  const cancel = vi.fn()
  render(<ConfirmDialog open title="Đăng xuất?" message="Bạn cần đăng nhập lại." confirmLabel="Đăng xuất" tone="danger" onCancel={cancel} onConfirm={confirm} />)
  expect(screen.getByRole('alertdialog')).toBeTruthy()
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Hủy' }))
  await userEvent.keyboard('{Escape}')
  expect(cancel).toHaveBeenCalledOnce()
  expect(confirm).not.toHaveBeenCalled()
  await userEvent.click(screen.getByRole('button', { name: 'Đăng xuất' }))
  expect(confirm).toHaveBeenCalledOnce()
})
