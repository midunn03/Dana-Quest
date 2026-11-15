// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import {
  getRecommendedDeviceMode,
  getStoredDeviceMode,
  saveDeviceModePreference,
  DEVICE_STORAGE_KEY,
} from '../src/lib/deviceMode'
import DeviceModeModal from '../src/mobile/DeviceModeModal'
import MobileBottomNav from '../src/mobile/MobileBottomNav'
import MobileBottomSheet from '../src/mobile/MobileBottomSheet'
import MobileShell from '../src/mobile/MobileShell'

describe('Device Mode & Mobile Layer (Stage C)', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('detects recommended device mode based on viewport and touch pointers', () => {
    // Narrow viewport <= 768px -> mobile
    window.innerWidth = 412
    expect(getRecommendedDeviceMode()).toBe('mobile')

    // Desktop viewport with mouse -> desktop
    window.innerWidth = 1200
    // Mock matchMedia returning false for coarse pointer
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
    expect(getRecommendedDeviceMode()).toBe('desktop')
  })

  it('stores and retrieves device mode preference in localStorage and fires event', () => {
    expect(getStoredDeviceMode()).toBeNull()

    const listener = vi.fn()
    window.addEventListener('dana-device-mode-changed', listener)

    saveDeviceModePreference('mobile')
    expect(localStorage.getItem(DEVICE_STORAGE_KEY)).toBe('mobile')
    expect(getStoredDeviceMode()).toBe('mobile')
    expect(listener).toHaveBeenCalledTimes(1)

    saveDeviceModePreference('desktop')
    expect(getStoredDeviceMode()).toBe('desktop')
    expect(listener).toHaveBeenCalledTimes(2)

    window.removeEventListener('dana-device-mode-changed', listener)
  })

  it('renders DeviceModeModal with desktop and mobile options and allows selection', () => {
    const onSelect = vi.fn()
    const onClose = vi.fn()

    render(
      <DeviceModeModal
        open={true}
        currentMode="desktop"
        onSelect={onSelect}
        onClose={onClose}
      />
    )

    // Verify dialog content
    expect(screen.getByText('Chọn chế độ trải nghiệm')).toBeTruthy()
    expect(screen.getByText(/Chơi trên máy tính/)).toBeTruthy()
    expect(screen.getByText(/Chơi trên điện thoại/)).toBeTruthy()

    // Select mobile option
    const mobileOption = screen.getByText(/Chơi trên điện thoại/).closest('.device-mode-option')
    expect(mobileOption).toBeTruthy()
    fireEvent.click(mobileOption!)

    // Confirm button
    const confirmBtn = screen.getByRole('button', { name: /Xác nhận & Bắt đầu/ })
    fireEvent.click(confirmBtn)

    expect(onSelect).toHaveBeenCalledWith('mobile')
    expect(onClose).toHaveBeenCalled()
  })

  it('renders MobileBottomNav with exactly 5 navigation items and active states', () => {
    const { rerender } = render(<MobileBottomNav route="#/map" />)

    // 5 tabs: Bản đồ, Sự kiện, Bộ sưu tập, Thưởng, Tài khoản
    expect(screen.getByLabelText(/Bản đồ/)).toBeTruthy()
    expect(screen.getByLabelText(/Sự kiện/)).toBeTruthy()
    expect(screen.getByLabelText(/Bộ sưu tập/)).toBeTruthy()
    expect(screen.getByLabelText(/Thưởng/)).toBeTruthy()
    expect(screen.getByLabelText(/Tài khoản/)).toBeTruthy()

    // When on #/map, Bản đồ is active
    expect(screen.getByLabelText(/Bản đồ/).getAttribute('aria-current')).toBe('page')

    // Switch route to #/su-kien
    rerender(<MobileBottomNav route="#/su-kien" />)
    expect(screen.getByLabelText(/Sự kiện/).getAttribute('aria-current')).toBe('page')

    // Switch route to #/tai-khoan/badges
    rerender(<MobileBottomNav route="#/tai-khoan/badges" />)
    expect(screen.getByLabelText(/Bộ sưu tập/).getAttribute('aria-current')).toBe('page')

    // Switch route to #/tai-khoan/wallet
    rerender(<MobileBottomNav route="#/tai-khoan/wallet" />)
    expect(screen.getByLabelText(/Thưởng/).getAttribute('aria-current')).toBe('page')
  })

  it('renders MobileBottomSheet with grabber handle and content', () => {
    const onClose = vi.fn()
    render(
      <MobileBottomSheet open={true} title="Chi tiết địa điểm" onClose={onClose}>
        <p>Nội dung thử thách Cầu Rồng</p>
      </MobileBottomSheet>
    )

    expect(screen.getByText('Chi tiết địa điểm')).toBeTruthy()
    expect(screen.getByText('Nội dung thử thách Cầu Rồng')).toBeTruthy()

    // Close button
    const closeBtn = screen.getByRole('button', { name: /Đóng/ })
    fireEvent.click(closeBtn)
    expect(onClose).toHaveBeenCalled()
  })

  it('renders MobileShell wrapper with header, bottom nav, and content', () => {
    const onOpen = vi.fn()
    render(
      <MobileShell route="#/kham-pha" onOpenDeviceSelector={onOpen}>
        <div data-testid="test-content">Trang khám phá</div>
      </MobileShell>
    )

    expect(screen.getByText('DANA QUEST')).toBeTruthy()
    expect(screen.getByTestId('test-content')).toBeTruthy()
    expect(screen.getByRole('navigation', { name: /Điều hướng điện thoại/ })).toBeTruthy()

    // Mode switch button
    const switchBtn = screen.getByRole('button', { name: /Đổi giao diện Web\/Điện thoại/ })
    fireEvent.click(switchBtn)
    expect(onOpen).toHaveBeenCalled()
  })
})
