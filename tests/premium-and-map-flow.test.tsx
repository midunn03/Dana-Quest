// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import L from 'leaflet'
import App from '../src/App'
import Explore from '../src/Explore'
import NavigationPage from '../src/NavigationPage'
import DueStartPage from '../src/DueStartPage'
import QuestPlayPage from '../src/QuestPlayPage'
import PremiumPricingModal from '../src/PremiumPricingModal'
import { AuthProvider } from '../src/AuthContext'
import { setSyncAccount } from '../src/lib/accountSync'
import {
  DEMO_PROMO_CODE,
  PAID_QUEST_IDS,
  cancelPremiumPlan,
  grantPremiumPlan,
  hasQuestAccess,
  isPaidQuest,
  openPremiumModal,
  validatePromoCode,
} from '../src/lib/premium'
import { getDestination } from '../src/data/destinations'
import { quests } from '../src/data/quests'
import { walkingFixture } from './routing-fixture'

describe('Plus / Pro Monthly Plans, Promo Code 0đ, Cancel & 3 Paid Quests', () => {
  beforeEach(() => {
    localStorage.clear()
    setSyncAccount(null)
    window.history.replaceState(null, '', '#/')
    vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} })
  })

  afterEach(() => {
    cleanup()
    localStorage.clear()
    setSyncAccount(null)
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('marks only 3 quests as paid (cau-rong in Plus; cau-vang-ba-na-hills & ngu-hanh-son in Pro)', () => {
    const paidList = quests.filter(q => isPaidQuest(q.id)).map(q => q.id)
    expect(paidList).toEqual(expect.arrayContaining([...PAID_QUEST_IDS]))
    expect(paidList).toHaveLength(3)

    // Unsubscribed user cannot play the 3 paid quests, can play free quests
    expect(hasQuestAccess('due-dau-an-50-nam', 'u-tier')).toBe(true)
    expect(hasQuestAccess('cau-rong', 'u-tier')).toBe(false)
    expect(hasQuestAccess('cau-vang-ba-na-hills', 'u-tier')).toBe(false)
    expect(hasQuestAccess('ngu-hanh-son', 'u-tier')).toBe(false)

    // Plus unlocks ONLY cau-rong
    grantPremiumPlan('plus', 'u-tier')
    expect(hasQuestAccess('cau-rong', 'u-tier')).toBe(true)
    expect(hasQuestAccess('cau-vang-ba-na-hills', 'u-tier')).toBe(false)
    expect(hasQuestAccess('ngu-hanh-son', 'u-tier')).toBe(false)

    // Pro unlocks all 3
    grantPremiumPlan('pro', 'u-tier')
    expect(hasQuestAccess('cau-rong', 'u-tier')).toBe(true)
    expect(hasQuestAccess('cau-vang-ba-na-hills', 'u-tier')).toBe(true)
    expect(hasQuestAccess('ngu-hanh-son', 'u-tier')).toBe(true)

    // Promo validation gives 0đ for both Plus (30k) and Pro (50k) using DN100, and hides code on invalid input
    expect(DEMO_PROMO_CODE).toBe('DN100')
    expect(validatePromoCode('DN100', 30000)).toMatchObject({ valid: true, finalPriceVnd: 0 })
    expect(validatePromoCode('DN100', 50000)).toMatchObject({ valid: true, finalPriceVnd: 0 })
    expect(validatePromoCode('INVALID', 30000).message).not.toMatch(/DN100|DANA100|PLUSFREE|PROFREE|DEMO0D/i)

    // Canceling monthly subscription preserves group code (source === 'code') entitlements
    grantPremiumPlan('plus', 'u-code', 'cau-rong', 'code')
    grantPremiumPlan('pro', 'u-code', 'cau-rong', 'confirm-demo')
    expect(hasQuestAccess('cau-vang-ba-na-hills', 'u-code')).toBe(true)
    cancelPremiumPlan('u-code')
    expect(hasQuestAccess('cau-vang-ba-na-hills', 'u-code')).toBe(false)
    expect(hasQuestAccess('cau-rong', 'u-code')).toBe(true)
  })

  it('shows ↗ Chỉ đường (?tu=map) for DUE (due-dau-an-50-nam) and monthly badges for the 3 paid quests on Map', async () => {
    render(<Explore />)
    await screen.findByRole('region', { name: 'Bản đồ Đà Nẵng' })
    await waitFor(() => expect(document.querySelectorAll('.atlas-list > button')).toHaveLength(quests.length))

    const dueCard = document.querySelector<HTMLButtonElement>('[data-entry-id="quest:due-dau-an-50-nam"]')!
    expect(dueCard).toBeTruthy()
    fireEvent.click(dueCard)

    const selection = document.querySelector('.atlas-selection') as HTMLElement
    expect(selection).toBeTruthy()
    const dueDirections = within(selection).getByRole('link', { name: /Chỉ đường/ })
    expect(dueDirections.getAttribute('href')).toBe('#/chi-duong/due-dau-an-50-nam?tu=map')

    const cauRongCard = document.querySelector<HTMLButtonElement>('[data-entry-id="quest:cau-rong"]')!
    expect(cauRongCard.textContent).toContain('30.000đ/tháng')
    const cauVangCard = document.querySelector<HTMLButtonElement>('[data-entry-id="quest:cau-vang-ba-na-hills"]')!
    expect(cauVangCard.textContent).toContain('50.000đ/tháng')
    const nhsCard = document.querySelector<HTMLButtonElement>('[data-entry-id="quest:ngu-hanh-son"]')!
    expect(nhsCard.textContent).toContain('50.000đ/tháng')

    fireEvent.click(cauRongCard)
    const selectionCr = document.querySelector('.atlas-selection') as HTMLElement
    expect(within(selectionCr).getByRole('link', { name: /Chỉ đường/ }).getAttribute('href')).toBe('#/chi-duong/cau-rong?tu=map')
  })

  it('routes directly to live navigation for DUE from map and shows arrival popup with single Bắt đầu ngay CTA & close ×', async () => {
    let success!: PositionCallback
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ route: walkingFixture }) })))
    vi.stubGlobal('navigator', {
      geolocation: {
        watchPosition: vi.fn((ok: PositionCallback) => { success = ok; return 99 }),
        clearWatch: vi.fn(),
      },
    })
    vi.spyOn(L.Map.prototype, 'setView')

    render(<NavigationPage id="due-dau-an-50-nam" fromMap />)
    expect(screen.getByRole('heading', { level: 1, name: /Trường Đại học Kinh tế/ })).toBeTruthy()

    act(() => {
      success({
        coords: { latitude: 16.04752, longitude: 108.23987, accuracy: 8 },
        timestamp: Date.now(),
      } as GeolocationPosition)
    })

    const dialog = await screen.findByRole('dialog', { name: 'Bạn đã đến nơi!' })
    expect(within(dialog).getByText('Sẵn sàng khám phá câu chuyện nơi đây chưa?')).toBeTruthy()
    expect(within(dialog).getByRole('button', { name: 'Bắt đầu ngay →' })).toBeTruthy()
    expect(within(dialog).getAllByRole('button')).toHaveLength(2)

    fireEvent.click(within(dialog).getByRole('button', { name: 'Đóng thông báo' }))
    expect(screen.queryByRole('dialog', { name: 'Bạn đã đến nơi!' })).toBeNull()
  })

  it('blocks unpaid play, lets user apply promo DANA100 -> 0đ in Image-2 checkout without payment, cancel, and re-demo DANA100', async () => {
    vi.stubEnv('VITE_AUTH_API_URL', 'https://auth.test')
    const user = userEvent.setup()
    const profile = { id: 'paid-tester', name: 'Tester', avatarId: 'bien', storageMode: 'account' as const }

    // 1. Direct guard on DueStartPage & QuestPlayPage when locked
    const r1 = render(<DueStartPage id="cau-rong" />)
    expect(screen.getByText(/Hành trình Đánh thức Long Mạch yêu cầu kích hoạt Gói Plus hoặc Pro/i)).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Xác nhận đã đến' })).toBeNull()
    r1.unmount()

    const r2 = render(<QuestPlayPage id="cau-vang-ba-na-hills" />)
    expect(screen.getByRole('button', { name: /Đăng ký Gói Pro · 50\.000đ\/tháng/ })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Tiếp tục đến thử thách' })).toBeNull()
    r2.unmount()

    // 2. Navigation arrival CTA on Cầu Rồng when locked -> Pricing -> Promo Checkout (0đ) -> Buy Now
    let success!: PositionCallback
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.endsWith('/session')) return { ok: true, status: 200, json: async () => ({ user: profile }) } as Response
      if (url.includes('/quest-runs')) return { ok: true, status: 200, json: async () => ({ version: 2, legacy: { version: 1, destinations: {}, redemptions: [] }, quests: {} }) } as Response
      return { ok: true, status: 200, json: async () => ({ route: walkingFixture }) } as Response
    }))
    vi.stubGlobal('navigator', {
      geolocation: {
        watchPosition: vi.fn((ok: PositionCallback) => { success = ok; return 100 }),
        clearWatch: vi.fn(),
      },
    })

    render(
      <AuthProvider>
        <PremiumPricingModal />
        <NavigationPage id="cau-rong" fromMap />
      </AuthProvider>
    )

    const cauRongPos = getDestination('cau-rong')!.position
    await waitFor(() => expect(success).toBeTruthy())
    act(() => {
      success({
        coords: { latitude: cauRongPos[0], longitude: cauRongPos[1], accuracy: 8 },
        timestamp: Date.now(),
      } as GeolocationPosition)
    })

    const arrivalModal = await screen.findByRole('dialog', { name: 'Bạn đã đến Cầu Rồng!' })
    await user.click(within(arrivalModal).getByRole('button', { name: 'Mua ngay để trải nghiệm →' }))

    const pricingModal = await screen.findByRole('dialog', { name: 'Chọn gói mở khóa hành trình' })
    expect(within(pricingModal).getByText('Plus')).toBeTruthy()
    expect(within(pricingModal).getByText('Pro')).toBeTruthy()
    await user.click(within(pricingModal).getByRole('button', { name: /Chọn Gói Plus · 30\.000đ\/tháng/ }))

    // Image-2 checkout sheet with Promo Code instead of card payment
    const checkoutModal = await screen.findByRole('dialog', { name: 'Xác nhận thay đổi gói' })
    expect(within(checkoutModal).getByText('Thanh toán hàng tháng, bắt đầu từ hôm nay')).toBeTruthy()
    expect(within(checkoutModal).queryByText(/Visa/i)).toBeNull()
    expect(screen.queryByText(/DN100|DANA100/i)).toBeNull()

    const promoInput = within(checkoutModal).getByLabelText(/Mã khuyến mãi/)
    await user.type(promoInput, 'dn100')
    await user.click(within(checkoutModal).getByRole('button', { name: 'Áp dụng' }))
    expect(within(checkoutModal).getByText(/-30\.000đ/)).toBeTruthy()
    expect(within(checkoutModal).getByRole('button', { name: 'Mua ngay · 0đ' })).toBeTruthy()

    await user.click(within(checkoutModal).getByRole('button', { name: 'Mua ngay · 0đ' }))

    // Unlocked immediately -> arrival popup turns into ready-to-play "Bắt đầu ngay →"
    const unlockedArrival = await screen.findByRole('dialog', { name: 'Bạn đã đến nơi!' })
    expect(within(unlockedArrival).getByRole('button', { name: 'Bắt đầu ngay →' })).toBeTruthy()
    expect(hasQuestAccess('cau-rong', 'paid-tester')).toBe(true)
    // Plus does NOT unlock Pro quests
    expect(hasQuestAccess('cau-vang-ba-na-hills', 'paid-tester')).toBe(false)

    // 3. Re-open modal -> Cancel Plus -> loses access -> Re-apply DANA100 on Pro -> succeeds cleanly!
    act(() => { openPremiumModal({ reason: 'browse' }) })
    const activeModal = await screen.findByRole('dialog', { name: 'Chọn gói mở khóa hành trình' })
    await user.click(within(activeModal).getByRole('button', { name: 'Hủy gói Plus' }))
    expect(hasQuestAccess('cau-rong', 'paid-tester')).toBe(false)

    // Ensure the 3-card pricing modal never leaks the promo code publicly
    expect(within(activeModal).queryByText(/DN100|DANA100/i)).toBeNull()
    // Select Pro and apply the exact same hidden DN100 promo code again -> still valid!
    await user.click(within(activeModal).getByRole('button', { name: /Chọn Gói Pro · 50\.000đ\/tháng/ }))
    const proCheckout = await screen.findByRole('dialog', { name: 'Xác nhận thay đổi gói' })
    expect(within(proCheckout).queryByText(/DN100|DANA100/i)).toBeNull()
    expect(within(proCheckout).queryByPlaceholderText(/DN100|DANA100/i)).toBeNull()
    const proPromoInput = within(proCheckout).getByLabelText(/Mã khuyến mãi/)
    await user.type(proPromoInput, 'DN100')
    await user.click(within(proCheckout).getByRole('button', { name: 'Áp dụng' }))
    expect(within(proCheckout).getByText(/-50\.000đ/)).toBeTruthy()
    await user.click(within(proCheckout).getByRole('button', { name: 'Mua ngay · 0đ' }))

    expect(hasQuestAccess('cau-rong', 'paid-tester')).toBe(true)
    expect(hasQuestAccess('cau-vang-ba-na-hills', 'paid-tester')).toBe(true)
    expect(hasQuestAccess('ngu-hanh-son', 'paid-tester')).toBe(true)
  })

  it('tracks active plan inside Account Pass view and allows canceling subscription', async () => {
    vi.stubEnv('VITE_AUTH_API_URL', 'https://auth.test')
    const user = userEvent.setup()
    const profile = { id: 'history-user', name: 'Explorer', avatarId: 'bien', storageMode: 'account' as const }
    localStorage.setItem(
      'dana-premium-entitlements-v1:history-user',
      JSON.stringify([
        {
          questId: 'cau-rong',
          planId: 'pro',
          planName: 'Gói Pro (Hàng tháng)',
          originalPriceVnd: 90000,
          paidPriceVnd: 0,
          promoCode: 'DN100',
          billingCycle: 'monthly',
          unlockedAt: Date.now(),
          source: 'confirm-demo',
        },
      ])
    )
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.endsWith('/session')) return { ok: true, status: 200, json: async () => ({ user: profile }) } as Response
      if (url.endsWith('/account')) return { ok: true, status: 200, json: async () => ({ profile: { displayName: 'Explorer', bio: '', home: 'Đà Nẵng', photoData: '' }, preferences: { language: 'vi', deviceMode: 'desktop', inApp: true, leaderboard: false, marketing: false }, history: [] }) } as Response
      return { ok: true, status: 200, json: async () => ({ version: 2, legacy: { version: 1, destinations: {}, redemptions: [] }, quests: {} }) } as Response
    }))
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    window.location.hash = '#/tai-khoan/pass'
    render(<App />)

    expect(await screen.findByRole('heading', { name: 'Quyền chơi & Lịch sử mở khóa' })).toBeTruthy()
    expect(await screen.findByText(/Gói Pro · 50\.000đ\/tháng/)).toBeTruthy()
    expect(await screen.findAllByRole('link', { name: 'Vào chơi ngay →' })).toHaveLength(3)

    // Account Header shows ✦ PRO badge
    const headerPlan = document.querySelector('.header-account-badge .header-account-plan.is-pro')
    expect(headerPlan?.textContent).toBe('✦ PRO')

    // Account profile page (#/tai-khoan) displays ✦ PRO tag & active pill
    act(() => { window.location.hash = '#/tai-khoan'; window.dispatchEvent(new HashChangeEvent('hashchange')) })
    await screen.findByRole('heading', { name: 'Explorer' })
    expect(document.querySelector('.ap-identity .ap-plan-tag.is-pro')?.textContent).toBe('✦ PRO')
    expect(document.querySelector('.ap-sub-pill.is-pro')?.textContent).toContain('Gói Pro')

    // Switch to Plus and verify PLUS badges update immediately
    act(() => { grantPremiumPlan('plus', 'history-user') })
    await waitFor(() => {
      expect(document.querySelector('.header-account-badge .header-account-plan.is-plus')?.textContent).toBe('PLUS')
      expect(document.querySelector('.ap-identity .ap-plan-tag.is-plus')?.textContent).toBe('✦ PLUS')
    })

    // Return to #/tai-khoan/pass, cancel plan -> badges removed
    act(() => { window.location.hash = '#/tai-khoan/pass'; window.dispatchEvent(new HashChangeEvent('hashchange')) })
    await user.click(await screen.findByRole('button', { name: 'Hủy gói đăng ký' }))
    expect(hasQuestAccess('cau-rong', 'history-user')).toBe(false)
    expect(hasQuestAccess('cau-vang-ba-na-hills', 'history-user')).toBe(false)
    expect(hasQuestAccess('ngu-hanh-son', 'history-user')).toBe(false)
    expect(document.querySelector('.header-account-badge .header-account-plan')).toBeNull()
    expect(await screen.findByText(/Tài khoản của bạn chưa kích hoạt Gói Plus hay Gói Pro/)).toBeTruthy()
  })
})
