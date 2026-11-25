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

describe('FullJourneyDemo (Nhà hát Trưng Vương → Tuyến 05 → Chùa Linh Ứng)', () => {
  it('launches FullJourneyDemo from the Homepage hero button and closes cleanly', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 401, json: async () => ({}) })))
    render(
      <AuthProvider>
        <LocaleProvider>
          <WelcomePage />
        </LocaleProvider>
      </AuthProvider>,
    )

    const launchBtn = screen.getByRole('button', { name: /Xem Demo hành trình/i })
    expect(launchBtn).toBeTruthy()
    fireEvent.click(launchBtn)

    const dialog = await screen.findByRole('dialog', { name: /Mô phỏng toàn trình Dana Quest/i })
    expect(dialog).toBeTruthy()
    expect(screen.getByLabelText('Giờ mô phỏng').textContent).toContain('06:00 sáng')

    fireEvent.click(screen.getByRole('button', { name: 'Đóng demo hành trình' }))
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /Mô phỏng toàn trình Dana Quest/i })).toBeNull()
    })
  })

  it('walks through all 5 chapters: 06:00 bus invite, 32s bus ride (minigame + QR/giftcode + stop alert), Son Tra arrival, real Chua Linh Ung quest, and Explorer Pass summary', () => {
    vi.useFakeTimers()
    const onClose = vi.fn()
    render(<FullJourneyDemo onClose={onClose} />)

    // Stage 1: starts at 06:00 at Nhà hát Trưng Vương
    expect(screen.getByLabelText('Giờ mô phỏng').textContent).toContain('06:00 sáng')
    expect(screen.getByLabelText('Chặng 1: Xuất phát tại Nhà hát Trưng Vương')).toBeTruthy()

    // Advance 4 seconds -> DanaBus suggestion banner appears ("2 phút nữa xe buýt...")
    act(() => {
      vi.advanceTimersByTime(4200)
    })
    expect(screen.getByText(/2 phút nữa xe buýt điện Tuyến 05 sắp đến trạm dừng này/i)).toBeTruthy()

    // Click confirm boarding button -> jumps to Stage 2 (Bus ride)
    fireEvent.click(screen.getByRole('button', { name: /Xác nhận tham gia chuyến đi này/i }))
    expect(screen.getByLabelText('Chặng 2: Trải nghiệm trên xe buýt điện Tuyến 05')).toBeTruthy()
    expect(screen.getAllByText(/\+5 Xu/).length).toBeGreaterThanOrEqual(1)

    // Jump into on-bus minigame tab
    fireEvent.click(screen.getByRole('button', { name: /Minigame \(\+10 Xu\)/i }))
    expect(screen.getByText(/Minigame trên xe · Câu 1\/2/i)).toBeTruthy()

    // Jump into QR / Giftcode tab & advance 8 seconds to verify DANABUS05A auto-redeem
    fireEvent.click(screen.getByRole('button', { name: /Quét QR \/ Giftcode/i }))
    act(() => {
      vi.advanceTimersByTime(8000)
    })
    expect(screen.getByText(/Nhập mã DANABUS05A thành công/i)).toBeTruthy()

    // Advance into approaching-final-stop alert (t >= 40s)
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(screen.getByText(/SẮP ĐẾN TRẠM CUỐI CÔNG VIÊN BIỂN ĐÔNG/i)).toBeTruthy()

    // Jump to Stage 3 (Lên Sơn Trà) -> advance 6s -> Chùa Linh Ứng arrival
    fireEvent.click(screen.getByRole('tab', { name: /Lên Sơn Trà/i }))
    expect(screen.getByLabelText('Chặng 3: Di chuyển dọc biển Hoàng Sa lên Chùa Linh Ứng')).toBeTruthy()
    act(() => {
      vi.advanceTimersByTime(6000)
    })
    expect(screen.getByText(/Bạn đã đến Chùa Linh Ứng – Bãi Bụt, Sơn Trà/i)).toBeTruthy()

    // Click confirm arrival -> Stage 4 (Real Quest "Dấu lặng trên Sơn Trà")
    fireEvent.click(screen.getByRole('button', { name: /Xác nhận đã đến/i }))
    expect(screen.getByLabelText('Chặng 4: Chơi Quest Dấu lặng trên Sơn Trà')).toBeTruthy()
    expect(screen.getByText('Nốt nhạc không địa chỉ')).toBeTruthy()

    // Click "Tiếp tục đến thử thách" -> Checkpoint 1 text challenge
    fireEvent.click(screen.getByRole('button', { name: /Tiếp tục đến thử thách/i }))
    expect(screen.getByText('Điểm đến trong hành trình này tên là gì?')).toBeTruthy()

    // Click "Kiểm tra đáp án" -> Checkpoint 1 reward feedback (+50 XP, +10 Xu)
    fireEvent.click(screen.getByRole('button', { name: /Kiểm tra đáp án/i }))
    expect(screen.getByText(/Đã ghi nhận \+50 XP và \+10 xu/i)).toBeTruthy()

    // Jump directly to Chapter 5 (Summary & Explorer Pass)
    fireEvent.click(screen.getByRole('tab', { name: /Thẻ Thông Hành/i }))
    expect(screen.getByLabelText('Chặng 5: Tổng kết Xu, EXP và Thẻ Thông Hành')).toBeTruthy()
    expect(screen.getByText(/Hành trình đã hoàn thành — Dấu lặng trên Sơn Trà/i)).toBeTruthy()
    expect(screen.getAllByText(/\+120 EXP/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/\+50 Xu/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/THẺ THÔNG HÀNH · THẺ HÀNH TRÌNH ĐÀ NẴNG/i)).toBeTruthy()

    // Speed & Pause controls + Close callback
    fireEvent.click(screen.getByRole('button', { name: '2x' }))
    fireEvent.click(screen.getByRole('button', { name: /Tạm dừng/i }))
    expect(screen.getByRole('button', { name: /Tiếp tục/i })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Đóng demo hành trình' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
