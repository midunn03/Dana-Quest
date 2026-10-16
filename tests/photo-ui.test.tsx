// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { Blob as NodeBlob } from 'node:buffer'
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DestinationPage from '../src/DestinationPage'
import AlbumPage from '../src/AlbumPage'
import { loadProgress, saveAction } from '../src/lib/storage'
import { savePhoto, preparePhoto } from '../src/lib/photos'
import { coinBalance } from '../src/lib/progress'

afterEach(() => { cleanup(); vi.unstubAllGlobals() })

it('blocks completion without a photo, performs a free local check and preserves a saved photo in album', async () => {
  const createObjectURL = vi.fn(() => 'blob:test-photo')
  const revokeObjectURL = vi.fn()
  vi.stubGlobal('URL', { createObjectURL, revokeObjectURL })
  await saveAction({ type: 'assign', destinationId: 'cho-han', count: 10 })
  const user = userEvent.setup()
  const view = render(<DestinationPage id="cho-han" />)
  const complete = (await screen.findAllByRole('button', { name: /Hoàn thành/i }))[0] as HTMLButtonElement
  expect(complete.disabled).toBe(true)
  expect(screen.getAllByText(/Kiểm tra ảnh miễn phí trên thiết bị/)).toBeTruthy()
  // Image decoding is browser-dependent; this checks the persisted blob -> UI -> completion path.
  await savePhoto({ id: 'cho-han:overview-photo', destinationId: 'cho-han', missionId: 'overview-photo', blob: new NodeBlob(['sample-image'], { type: 'image/jpeg' }) as Blob, createdAt: Date.now() })
  expect(coinBalance(await loadProgress())).toBe(0)
  view.unmount()
  const nextView = render(<DestinationPage id="cho-han" />)
  const enabled = (await screen.findAllByRole('button', { name: /Hoàn thành/i }))[0] as HTMLButtonElement
  await waitFor(() => expect(enabled.disabled).toBe(false))
  await waitFor(() => expect(screen.getByRole('img', { name: 'Ảnh bạn đã lưu cho nhiệm vụ' }).getAttribute('src')).toBe('blob:test-photo'))
  await user.click(enabled)
  await screen.findByText('Đã hoàn thành · Đã nhận 10 xu demo')
  expect(coinBalance(await loadProgress())).toBe(10)
  nextView.unmount()
  render(<AlbumPage />)
  await screen.findByRole('img', { name: 'Ảnh tại Chợ Hàn' })
  expect(screen.getByText('Tải ảnh về máy').getAttribute('download')).toContain('cho-han')
  await user.click(screen.getByRole('button', { name: 'Xóa ảnh tại Chợ Hàn' }))
  expect(screen.getByRole('alertdialog').textContent).toContain('xóa vĩnh viễn')
  await user.click(screen.getByRole('button', { name: 'Hủy' }))
  expect(screen.queryByRole('alertdialog')).toBeNull()
  expect(screen.getByRole('img', { name: 'Ảnh tại Chợ Hàn' })).toBeTruthy()
  expect(revokeObjectURL).toHaveBeenCalled()
})

it('rejects unsupported file types and oversized images before storing', async () => {
  await expect(preparePhoto(new File(['text'], 'notes.txt', { type: 'text/plain' }))).rejects.toThrow('JPG')
  await expect(preparePhoto(new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'large.jpg', { type: 'image/jpeg' }))).rejects.toThrow('quá lớn')
})

