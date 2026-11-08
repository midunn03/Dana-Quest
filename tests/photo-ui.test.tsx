// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { Blob as NodeBlob } from 'node:buffer'
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DestinationPage from '../src/DestinationPage'
import AlbumPage from '../src/AlbumPage'
import { loadProgress, saveAction } from '../src/lib/storage'
import { savePhoto, preparePhoto, loadPhotos } from '../src/lib/photos'
import { coinBalance } from '../src/lib/progress'

vi.mock('../src/AuthContext',()=>({useAuth:()=>({user:null})}))

afterEach(() => { cleanup(); vi.unstubAllGlobals() })

it('blocks completion without a photo, performs a free local check and keeps the legacy photo private while library displays quest covers', async () => {
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
  await screen.findByText('Đã hoàn thành · Đã nhận 10 Xu Dana')
  expect(coinBalance(await loadProgress())).toBe(10)
  nextView.unmount()
  render(<AlbumPage />)
  expect(screen.getByRole('heading',{name:'Thư viện kỷ niệm'})).toBeTruthy()
  expect(screen.queryByRole('img',{name:'Ảnh tại Chợ Hàn'})).toBeNull()
  expect(screen.getAllByRole('link',{name:/Cầu Rồng/}).some(link=>link.getAttribute('href')==='#/quest/cau-rong')).toBe(true)
  expect((await loadPhotos()).some(photo=>photo.id==='cho-han:overview-photo')).toBe(true)
  expect(revokeObjectURL).toHaveBeenCalled()

})

it('rejects unsupported file types and oversized images before storing', async () => {
  await expect(preparePhoto(new File(['text'], 'notes.txt', { type: 'text/plain' }))).rejects.toThrow('JPG')
  await expect(preparePhoto(new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'large.jpg', { type: 'image/jpeg' }))).rejects.toThrow('quá lớn')
})

