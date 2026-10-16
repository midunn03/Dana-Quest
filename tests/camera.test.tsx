// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CameraCapture from '../src/CameraCapture'

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals() })
it.each([['NotAllowedError', 'Chưa được phép'], ['NotFoundError', 'Không tìm thấy webcam'], ['NotReadableError', 'Không mở được webcam']])('explains %s in Vietnamese', async (name, text) => {
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: vi.fn().mockRejectedValue(new DOMException('failure', name)) } })
  render(<CameraCapture disabled={false} onCapture={vi.fn()} />)
  await userEvent.click(screen.getByRole('button', { name: 'Mở webcam' }))
  expect((await screen.findByRole('alert')).textContent).toContain(text)
  expect(screen.getByRole('button', { name: 'Mở webcam' })).toBeTruthy()
})
it('shows live video, captures a JPEG and stops tracks; also stops on unmount', async () => {
  const stop = vi.fn()
  const media = { getTracks: () => [{ stop }] }
  const getUserMedia = vi.fn().mockResolvedValue(media)
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia } })
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage: vi.fn() } as unknown as CanvasRenderingContext2D)
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(callback => callback(new Blob(['image'], { type: 'image/jpeg' })))
  const onCapture = vi.fn()
  const view = render(<CameraCapture disabled={false} onCapture={onCapture} />)
  await userEvent.click(screen.getByRole('button', { name: 'Mở webcam' }))
  const video = screen.getByLabelText('Hình ảnh trực tiếp từ webcam') as HTMLVideoElement
  expect(video.srcObject).toBe(media)
  Object.defineProperties(video, { videoWidth: { value: 1280 }, videoHeight: { value: 720 } })
  fireEvent.canPlay(video)
  await userEvent.click(screen.getByRole('button', { name: 'Chụp ảnh' }))
  expect(onCapture).toHaveBeenCalledTimes(1)
  expect(onCapture.mock.calls[0][0].type).toBe('image/jpeg')
  expect(stop).toHaveBeenCalledTimes(1)
  await userEvent.click(screen.getByRole('button', { name: 'Mở webcam' }))
  view.unmount()
  expect(stop).toHaveBeenCalledTimes(2)
  expect(getUserMedia).toHaveBeenCalledWith(expect.objectContaining({ audio: false }))
})
it('stops a stream that arrives after the user cancels permission waiting', async () => {
  let resolve!: (value: unknown) => void
  const stop = vi.fn()
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: () => new Promise(value => { resolve = value }) } })
  render(<CameraCapture disabled={false} onCapture={vi.fn()} />)
  await userEvent.click(screen.getByRole('button', { name: 'Mở webcam' }))
  await userEvent.click(screen.getByRole('button', { name: 'Tắt camera' }))
  await act(async () => resolve({ getTracks: () => [{ stop }] }))
  await waitFor(() => expect(stop).toHaveBeenCalledOnce())
  expect(screen.queryByLabelText('Hình ảnh trực tiếp từ webcam')).toBeNull()
})
