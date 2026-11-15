// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import StartHub from '../src/StartHub'
import DiscoveryPage from '../src/DiscoveryPage'
import CoachMarks from '../src/CoachMarks'
import NextStepChip from '../src/NextStepChip'
import HelpPage from '../src/HelpPage'
import AvatarPage from '../src/AvatarPage'
import DueStartPage from '../src/DueStartPage'
import { newQuestState, updateQuestProgress } from '../src/lib/questProgress'
import { setSyncAccount } from '../src/lib/accountSync'

describe('Giai đoạn 1 UX Flow (Big-Update 9)', () => {
  beforeEach(() => {
    localStorage.clear()
    setSyncAccount(null)
    window.history.replaceState(null, '', '#/')
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('StartHub: Hiển thị hành trình gợi ý cho người mới với 3 bước và nút Bắt đầu ngay', async () => {
    render(<StartHub variant="inline" />)
    expect(await screen.findByText('Hành trình đầu tiên của bạn')).toBeTruthy()
    expect(screen.getByText('①')).toBeTruthy()
    expect(screen.getByText('Đến điểm hẹn')).toBeTruthy()
    expect(screen.getByText('②')).toBeTruthy()
    expect(screen.getByText('Giải thử thách tại chỗ')).toBeTruthy()
    expect(screen.getByText('③')).toBeTruthy()
    expect(screen.getByText('Nhận Xu & Quà')).toBeTruthy()
    expect(screen.getByRole('link', { name: /Bắt đầu ngay/ })).toBeTruthy()
  })

  it('StartHub: Hiển thị Tiếp tục khi có quest đang chơi dở', async () => {
    const state = updateQuestProgress(newQuestState(), { type: 'start', questId: 'cau-rong' })
    localStorage.setItem('dana-quest-progress-v2', JSON.stringify(state))

    render(<StartHub variant="inline" />)
    expect(await screen.findByText('Tiếp tục hành trình')).toBeTruthy()
    expect(screen.getByRole('link', { name: /Chơi tiếp ngay/ })).toBeTruthy()
  })

  it('DiscoveryPage: Hiển thị bộ lọc và badge phân biệt Quest cốt truyện vs Địa điểm', async () => {
    render(<DiscoveryPage mode="explore" />)
    expect(await screen.findByRole('group', { name: 'Lọc kiểu chơi' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Tất cả' })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Quest cốt truyện/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Địa điểm/ })).toBeTruthy()
    expect(screen.getAllByText('Cốt truyện · Giải đố').length).toBeGreaterThan(0)
  })

  it('CoachMarks: Bong bóng chỉ dẫn hiện ra và lưu trạng thái khi bấm Bỏ qua', async () => {
    const user = userEvent.setup()
    render(<CoachMarks />)
    expect(screen.getByRole('dialog', { name: 'Hướng dẫn làm quen' })).toBeTruthy()
    expect(screen.getByText(/Chào mừng bạn đến với Dana Quest/)).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Bỏ qua' }))
    expect(localStorage.getItem('dana-coach-marks-v1')).toBe('done')
    expect(screen.queryByRole('dialog', { name: 'Hướng dẫn làm quen' })).toBeNull()
  })

  it('NextStepChip: Gợi ý hành động tiếp theo', () => {
    render(<NextStepChip currentRoute="#/kham-pha" />)
    expect(screen.getByLabelText('Chỉ dẫn bước tiếp theo')).toBeTruthy()
    expect(screen.getByText(/Gợi ý:/)).toBeTruthy()
  })

  it('HelpPage: Hiển thị đầy đủ thông tin 2 kiểu chơi, nhận xu và an toàn', () => {
    render(<HelpPage />)
    expect(screen.getByRole('heading', { name: 'Hướng dẫn chơi Dana Quest' })).toBeTruthy()
    expect(screen.getByText(/1. Hai kiểu chơi chính trong game/)).toBeTruthy()
    expect(screen.getByText(/2. Nhận xu & Đổi quà/)).toBeTruthy()
    expect(screen.getByText(/3. An toàn khi trải nghiệm ngoài phố/)).toBeTruthy()
  })

  it('AvatarPage: Có nút 1 chạm dùng nhân vật gợi ý vào chơi ngay', async () => {
    const user = userEvent.setup()
    render(<AvatarPage />)
    const quickBtn = screen.getByRole('button', { name: /Dùng nhân vật gợi ý, chỉnh sau/ })
    expect(quickBtn).toBeTruthy()
    await user.click(quickBtn)
    await waitFor(() => expect(window.location.hash).toBe('#/map'))
  })

  it('DueStartPage: Nút 1 chạm "Tôi đã đến nơi" kích hoạt vào chơi trực tiếp', async () => {
    const state = updateQuestProgress(newQuestState(), { type: 'start', questId: 'due-dau-an-50-nam' })
    localStorage.setItem('dana-quest-progress-v2', JSON.stringify(state))
    const user = userEvent.setup()

    render(<DueStartPage id="due-dau-an-50-nam" />)
    const directBtn = await screen.findByRole('button', { name: /Tôi đã đến nơi/ })
    expect(directBtn).toBeTruthy()
    await user.click(directBtn)
    await waitFor(() => expect(window.location.hash).toBe('#/quest/due-dau-an-50-nam/choi'))
  })
})
