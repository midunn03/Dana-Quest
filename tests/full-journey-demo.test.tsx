// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import FullJourneyDemo from '../src/FullJourneyDemo'
import WelcomePage from '../src/WelcomePage'
import { AuthProvider } from '../src/AuthContext'
import { LocaleProvider } from '../src/i18n/LocaleProvider'

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('FullJourneyDemo — pure full-screen gameplay simulation', () => {
  it('launches from Homepage with zero demo player chrome (no 1x/1.5x/2x, no timeline scrubber, no chapter tabs) and closes cleanly', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 401, json: async () => ({}) })))
    render(
      <AuthProvider>
        <LocaleProvider>
          <WelcomePage />
        </LocaleProvider>
      </AuthProvider>,
    )

    const launchBtn = screen.getByRole('button', { name: /Trải nghiệm Demo hành trình/i })
    expect(launchBtn).toBeTruthy()
    fireEvent.click(launchBtn)

    const dialog = await screen.findByRole('dialog', { name: /Hành trình Dana Quest/i })
    expect(dialog).toBeTruthy()
    expect(screen.getByLabelText('Thời gian hành trình').textContent).toContain('06:00')

    // Explicitly assert NO video-player / demo timeline clutter exists
    expect(screen.queryByRole('slider')).toBeNull()
    expect(screen.queryByRole('tablist')).toBeNull()
    expect(screen.queryByRole('button', { name: '1x' })).toBeNull()
    expect(screen.queryByRole('button', { name: '1.5x' })).toBeNull()
    expect(screen.queryByRole('button', { name: '2x' })).toBeNull()
    expect(screen.queryByText(/DEMO TOÀN TRÌNH/i)).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Đóng mô phỏng' }))
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /Hành trình Dana Quest/i })).toBeNull()
    })
  })

  it('plays cleanly through pure gameplay from 06:00 Nhà hát Trưng Vương -> Tuyến 05 (minigame + QR/giftcode + stop alert) -> Chùa Linh Ứng Quest -> Thẻ Thông Hành', () => {
    vi.useFakeTimers()
    const onClose = vi.fn()
    render(<FullJourneyDemo onClose={onClose} />)

    // Stage 1: 06:00 at Nhà hát Trưng Vương
    expect(screen.getByLabelText('Thời gian hành trình').textContent).toContain('06:00')
    expect(screen.getByLabelText('Bản đồ xuất phát từ Nhà hát Trưng Vương')).toBeTruthy()

    // Bus invite appears after ~3.2s
    act(() => {
      vi.advanceTimersByTime(4000)
    })
    expect(screen.getByText(/2 phút nữa xe buýt điện Tuyến 05 sắp đến trạm dừng này/i)).toBeTruthy()

    // Tap confirm boarding -> Stage 2 (Bus ride)
    fireEvent.click(screen.getByRole('button', { name: /Xác nhận tham gia chuyến đi này/i }))
    expect(screen.getByLabelText('Màn hình trên xe buýt điện Tuyến 05')).toBeTruthy()
    expect(screen.getAllByText(/\+5 Xu/).length).toBeGreaterThanOrEqual(1)

    // Switch to Minigame tab -> see Q1
    fireEvent.click(screen.getByRole('button', { name: /Minigame/i }))
    expect(screen.getByText(/Minigame · Câu 1\/2/i)).toBeTruthy()

    // Switch to QR / Code tab and let scanner auto-redeem DANABUS05A
    fireEvent.click(screen.getByRole('button', { name: /QR \/ Code/i }))
    act(() => {
      vi.advanceTimersByTime(8000)
    })
    expect(screen.getByText(/Nhập mã DANABUS05A thành công/i)).toBeTruthy()

    // Approaching final stop alert appears cleanly
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(screen.getByText(/SẮP ĐẾN TRẠM CUỐI CÔNG VIÊN BIỂN ĐÔNG/i)).toBeTruthy()

    // Tap alight button -> Stage 3 (Son Tra road to Chùa Linh Ứng)
    fireEvent.click(screen.getByRole('button', { name: /Đã xuống xe/i }))
    expect(screen.getByLabelText('Di chuyển dọc biển Hoàng Sa lên Chùa Linh Ứng')).toBeTruthy()

    act(() => {
      vi.advanceTimersByTime(6000)
    })
    expect(screen.getByText(/Bạn đã đến Chùa Linh Ứng – Bãi Bụt, Sơn Trà/i)).toBeTruthy()

    // Tap start quest -> Stage 4 (Real Quest "Dấu lặng trên Sơn Trà")
    fireEvent.click(screen.getByRole('button', { name: /Xác nhận đã đến/i }))
    expect(screen.getByLabelText('Chơi Quest Dấu lặng trên Sơn Trà')).toBeTruthy()
    expect(screen.getByText('Nốt nhạc không địa chỉ')).toBeTruthy()

    // Play Checkpoint 1
    fireEvent.click(screen.getByRole('button', { name: /Tiếp tục đến thử thách/i }))
    expect(screen.getByText('Điểm đến trong hành trình này tên là gì?')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Kiểm tra đáp án/i }))
    expect(screen.getByText(/Đã ghi nhận \+50 XP và \+10 xu/i)).toBeTruthy()

    // Play Checkpoint 2
    fireEvent.click(screen.getByRole('button', { name: /Tiếp tục câu chuyện/i }))
    expect(screen.getByText('Khoảng yên hướng biển')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Tiếp tục đến thử thách/i }))
    expect(screen.getByText('Mô tả nào khớp với điểm đến bạn đang khám phá?')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Kiểm tra đáp án/i }))
    expect(screen.getByText(/Đã ghi nhận \+70 XP và \+10 xu/i)).toBeTruthy()

    // Open Summary & Explorer Pass
    fireEvent.click(screen.getByRole('button', { name: /Xem tổng kết & Thẻ Thông Hành/i }))
    expect(screen.getByLabelText('Tổng kết hành trình và Thẻ Thông Hành')).toBeTruthy()
    expect(screen.getAllByText(/\+120 EXP/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/\+50 Xu/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/THẺ THÔNG HÀNH ĐÀ NẴNG/i)).toBeTruthy()

    // Close button works
    fireEvent.click(screen.getByRole('button', { name: 'Đóng mô phỏng' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
