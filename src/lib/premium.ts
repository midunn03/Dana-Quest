import { useCallback, useEffect, useState } from 'react'
import { t } from '../i18n/locale'
import { getSyncAccountId } from './accountSync'

export const PAID_QUEST_ID = 'cau-rong'
export const PLUS_QUEST_IDS = ['cau-rong'] as const
export const PRO_ONLY_QUEST_IDS = ['cau-vang-ba-na-hills', 'ngu-hanh-son'] as const
export const PAID_QUEST_IDS = [...PLUS_QUEST_IDS, ...PRO_ONLY_QUEST_IDS] as const

export type PremiumPlanId = 'plus' | 'pro'
export type LegacyOrCurrentPlanId = PremiumPlanId | 'single-short' | 'single-extended'

export const DEMO_PROMO_CODE = 'DN100'
export const DEMO_PROMO_CODES = ['DN100', 'DANA100', 'PLUSFREE', 'PROFREE', 'DEMO0D'] as const

export interface QuestPricing {
  isPaid: boolean
  tierId: 'free' | PremiumPlanId
  tierName: string
  originalPriceVnd: number
  priceVnd: number
  discountPercent: number
  currencyLabel: string
  originalCurrencyLabel: string
}

export interface PremiumPlanSpec {
  id: 'free' | PremiumPlanId
  badge?: string
  title: string
  subtitle: string
  originalPriceVnd: number
  priceVnd: number
  discountPercent: number
  originalPriceLabel?: string
  priceLabel: string
  periodLabel: string
  saveLabel?: string
  popular?: boolean
  includedQuestIds: string[]
  features: string[]
  note?: string
}

export interface PromoValidationResult {
  valid: boolean
  code: string
  discountPercent: number
  discountVnd: number
  finalPriceVnd: number
  message: string
}

export interface PremiumUnlockRecord {
  questId: string
  planId: LegacyOrCurrentPlanId
  planName: string
  originalPriceVnd: number
  paidPriceVnd: number
  promoCode?: string
  billingCycle?: 'monthly'
  unlockedAt: number
  source: 'confirm-demo' | 'code'
}

export interface OpenPremiumModalOptions {
  questId?: string
  reason?: 'browse' | 'unlock' | 'arrival'
  onUnlocked?: () => void
}

const STORAGE_PREFIX = 'dana-premium-entitlements-v1:'
const CHANGE_EVENT = 'dana-premium-changed'
export const OPEN_PREMIUM_MODAL_EVENT = 'dana-open-premium-modal'

export function normalizePlanId(planId: string): 'free' | PremiumPlanId {
  if (planId === 'pro' || planId === 'single-extended') return 'pro'
  if (planId === 'plus' || planId === 'single-short') return 'plus'
  return 'free'
}

export function getRequiredPlanForQuest(questId: string): 'free' | PremiumPlanId {
  if ((PLUS_QUEST_IDS as readonly string[]).includes(questId)) return 'plus'
  if ((PRO_ONLY_QUEST_IDS as readonly string[]).includes(questId)) return 'pro'
  return 'free'
}

export function isPaidQuest(questId: string): boolean {
  return (PAID_QUEST_IDS as readonly string[]).includes(questId)
}

export function formatVnd(amount: number): string {
  if (amount <= 0) return '0đ'
  return `${amount.toLocaleString('vi-VN')}đ`
}

export function validatePromoCode(rawCode: string, basePriceVnd: number): PromoValidationResult {
  const normalized = rawCode.trim().toUpperCase()
  if (!normalized) {
    return {
      valid: false,
      code: '',
      discountPercent: 0,
      discountVnd: 0,
      finalPriceVnd: basePriceVnd,
      message: t('Vui lòng nhập mã khuyến mãi.', 'Please enter a promo code.'),
    }
  }
  if ((DEMO_PROMO_CODES as readonly string[]).includes(normalized)) {
    return {
      valid: true,
      code: normalized,
      discountPercent: 100,
      discountVnd: basePriceVnd,
      finalPriceVnd: 0,
      message: t(
        `Đã áp dụng mã ${normalized}: Giảm 100% — Tổng thanh toán 0đ!`,
        `Promo ${normalized} applied: 100% off — Total due 0đ!`
      ),
    }
  }
  return {
    valid: false,
    code: normalized,
    discountPercent: 0,
    discountVnd: 0,
    finalPriceVnd: basePriceVnd,
    message: t(
      'Mã khuyến mãi không hợp lệ.',
      'Invalid promo code.'
    ),
  }
}

export function getQuestPricing(questId: string): QuestPricing {
  const required = getRequiredPlanForQuest(questId)
  if (required === 'plus') {
    return {
      isPaid: true,
      tierId: 'plus',
      tierName: t('Gói Plus', 'Plus'),
      originalPriceVnd: 50000,
      priceVnd: 30000,
      discountPercent: 40,
      currencyLabel: t('30.000đ/tháng', '30.000đ/mo'),
      originalCurrencyLabel: t('50.000đ/tháng', '50.000đ/mo'),
    }
  }
  if (required === 'pro') {
    return {
      isPaid: true,
      tierId: 'pro',
      tierName: t('Gói Pro', 'Pro'),
      originalPriceVnd: 90000,
      priceVnd: 50000,
      discountPercent: 45,
      currencyLabel: t('50.000đ/tháng', '50.000đ/mo'),
      originalCurrencyLabel: t('90.000đ/tháng', '90.000đ/mo'),
    }
  }
  return {
    isPaid: false,
    tierId: 'free',
    tierName: t('Miễn phí', 'Free'),
    originalPriceVnd: 0,
    priceVnd: 0,
    discountPercent: 0,
    currencyLabel: t('Miễn phí', 'Free'),
    originalCurrencyLabel: '',
  }
}

export function getPremiumPlans(): PremiumPlanSpec[] {
  return [
    {
      id: 'free',
      badge: t('MẶC ĐỊNH', 'DEFAULT'),
      title: t('Miễn phí', 'Free'),
      subtitle: t(
        'Làm quen cách chơi qua 13 hành trình miễn phí khắp Đà Nẵng.',
        'Explore 13 free quests and landmarks across Da Nang.'
      ),
      originalPriceVnd: 0,
      priceVnd: 0,
      discountPercent: 0,
      priceLabel: '0đ',
      periodLabel: t('/tháng', '/mo'),
      includedQuestIds: [],
      features: [
        t('13 quest & địa điểm miễn phí không giới hạn lượt chơi', '13 free quests and landmarks'),
        t('Bản đồ tương tác, định vị GPS & chỉ đường từng chặng', 'Interactive map, GPS & turn-by-turn walking guide'),
        t('Lịch sự kiện thành phố & thư viện ảnh kỷ niệm cá nhân', 'City events feed & personal memory album'),
      ],
    },
    {
      id: 'plus',
      badge: t('PLUS · GIẢM 40%', 'PLUS · 40% OFF'),
      title: 'Plus',
      subtitle: t(
        'Mở khóa 1 hành trình trả phí Cầu Rồng: Đánh thức Long Mạch.',
        'Unlock 1 paid Cầu Rồng quest: Awakening the Dragon Vein.'
      ),
      originalPriceVnd: 50000,
      priceVnd: 30000,
      discountPercent: 40,
      originalPriceLabel: '50.000đ',
      priceLabel: '30.000đ',
      periodLabel: t('/tháng', '/mo'),
      saveLabel: t('Tiết kiệm 20.000đ/tháng', 'Save 20.000đ/mo'),
      popular: true,
      includedQuestIds: [...PLUS_QUEST_IDS],
      features: [
        t('Mở khóa quest Cầu Rồng: Đánh thức Long Mạch', 'Unlocks Cầu Rồng: Awakening the Dragon Vein'),
        t('Bao gồm trọn bộ 13 quest miễn phí', 'Includes all 13 free quests'),
        t('Gia hạn hàng tháng · Hủy gói bất cứ lúc nào', 'Billed monthly · Cancel anytime'),
      ],
      note: t('Hỗ trợ áp dụng mã khuyến mãi khi thanh toán.', 'Supports promo codes at checkout.'),
    },
    {
      id: 'pro',
      badge: t('PRO · GIẢM 45%', 'PRO · 45% OFF'),
      title: 'Pro',
      subtitle: t(
        'Mở khóa toàn bộ Plus cộng thêm 2 hành trình trả phí cao cấp mới.',
        'Includes Plus plus 2 additional exclusive premium quests.'
      ),
      originalPriceVnd: 90000,
      priceVnd: 50000,
      discountPercent: 45,
      originalPriceLabel: '90.000đ',
      priceLabel: '50.000đ',
      periodLabel: t('/tháng', '/mo'),
      saveLabel: t('Tiết kiệm 40.000đ/tháng', 'Save 40.000đ/mo'),
      includedQuestIds: [...PAID_QUEST_IDS],
      features: [
        t('Bao gồm trọn gói Plus (Cầu Rồng: Đánh thức Long Mạch)', 'Includes full Plus plan (Cầu Rồng)'),
        t(
          'Mở khóa thêm 2 quest: Cầu Vàng (Lối đi trên bàn tay mây) & Ngũ Hành Sơn (Năm mảnh ấn sơn)',
          'Unlocks 2 extra quests: Golden Bridge & Marble Mountains'
        ),
        t('Gia hạn hàng tháng, ưu tiên hỗ trợ · Hủy bất cứ lúc nào', 'Monthly billing, priority support · Cancel anytime'),
      ],
      note: t('Hỗ trợ áp dụng mã khuyến mãi khi thanh toán.', 'Supports promo codes at checkout.'),
    },
  ]
}

function resolveStorageKey(ownerId?: string | null): string {
  const id = ownerId || getSyncAccountId() || 'guest'
  return `${STORAGE_PREFIX}${id}`
}

export function readPremiumRecords(ownerId?: string | null): PremiumUnlockRecord[] {
  try {
    const raw = localStorage.getItem(resolveStorageKey(ownerId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is PremiumUnlockRecord =>
        Boolean(item && typeof item.questId === 'string' && typeof item.planId === 'string' && typeof item.unlockedAt === 'number')
    )
  } catch {
    return []
  }
}

export function getActivePremiumPlan(ownerId?: string | null): 'free' | PremiumPlanId {
  const records = readPremiumRecords(ownerId)
  let highest: 'free' | PremiumPlanId = 'free'
  for (const record of records) {
    const tier = normalizePlanId(record.planId)
    if (tier === 'pro') return 'pro'
    if (tier === 'plus') highest = 'plus'
  }
  return highest
}

export function hasQuestAccess(questId: string, ownerId?: string | null): boolean {
  const required = getRequiredPlanForQuest(questId)
  if (required === 'free') return true
  const activePlan = getActivePremiumPlan(ownerId)
  if (activePlan === 'pro') return true
  if (activePlan === 'plus' && required === 'plus') return true
  const records = readPremiumRecords(ownerId)
  return records.some(record => record.questId === questId && record.source === 'code')
}

export function grantPremiumPlan(
  planId: LegacyOrCurrentPlanId,
  ownerId?: string | null,
  questId: string = PAID_QUEST_ID,
  source: 'confirm-demo' | 'code' = 'confirm-demo',
  options?: { paidPriceVnd?: number; promoCode?: string }
): PremiumUnlockRecord {
  const normalizedPlan: PremiumPlanId = normalizePlanId(planId) === 'pro' ? 'pro' : 'plus'
  const plans = getPremiumPlans()
  const spec = plans.find(p => p.id === normalizedPlan) ?? plans[1]
  const resolvedPaidPrice = options?.paidPriceVnd ?? spec.priceVnd
  const resolvedQuestId =
    normalizedPlan === 'pro' && questId === PAID_QUEST_ID ? 'cau-rong' : questId
  const record: PremiumUnlockRecord = {
    questId: resolvedQuestId,
    planId: normalizedPlan,
    planName: normalizedPlan === 'pro' ? t('Gói Pro (Hàng tháng)', 'Pro Monthly') : t('Gói Plus (Hàng tháng)', 'Plus Monthly'),
    originalPriceVnd: spec.originalPriceVnd,
    paidPriceVnd: resolvedPaidPrice,
    promoCode: options?.promoCode,
    billingCycle: 'monthly',
    unlockedAt: Date.now(),
    source,
  }
  const key = resolveStorageKey(ownerId)
  const existing = readPremiumRecords(ownerId).filter(
    item => source === 'code' ? !(item.questId === resolvedQuestId && item.source === 'code') : item.source === 'code'
  )
  const next = [record, ...existing]
  try {
    localStorage.setItem(key, JSON.stringify(next))
  } catch {
    // Ignore storage quota errors cleanly
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { ownerId: ownerId ?? getSyncAccountId(), record } }))
  window.dispatchEvent(
    new CustomEvent('dana-toast', {
      detail: '🎉 ' + t(`Đã kích hoạt ${spec.title} thành công!`, `${spec.title} plan activated!`),
    })
  )
  return record
}

export function cancelPremiumPlan(ownerId?: string | null): void {
  const key = resolveStorageKey(ownerId)
  const codeRecords = readPremiumRecords(ownerId).filter(item => item.source === 'code')
  try {
    if (codeRecords.length > 0) {
      localStorage.setItem(key, JSON.stringify(codeRecords))
    } else {
      localStorage.removeItem(key)
    }
  } catch {
    // Ignore storage access errors cleanly
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { ownerId: ownerId ?? getSyncAccountId(), cancelled: true } }))
  window.dispatchEvent(
    new CustomEvent('dana-toast', {
      detail: t('Đã hủy gói đăng ký. Quyền chơi quest trả phí đã tạm khóa.', 'Plan cancelled. Paid quest access revoked.'),
    })
  )
}

export function openPremiumModal(options: OpenPremiumModalOptions = {}): void {
  window.dispatchEvent(new CustomEvent(OPEN_PREMIUM_MODAL_EVENT, { detail: options }))
}

export function usePremiumAccess(ownerId?: string | null) {
  const resolvedOwner = ownerId ?? getSyncAccountId() ?? 'guest'
  const [records, setRecords] = useState<PremiumUnlockRecord[]>(() => readPremiumRecords(resolvedOwner))

  useEffect(() => {
    const refresh = () => setRecords(readPremiumRecords(resolvedOwner))
    refresh()
    window.addEventListener(CHANGE_EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(CHANGE_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [resolvedOwner])

  const activePlanId: 'free' | PremiumPlanId = (() => {
    let highest: 'free' | PremiumPlanId = 'free'
    for (const record of records) {
      const tier = normalizePlanId(record.planId)
      if (tier === 'pro') return 'pro'
      if (tier === 'plus') highest = 'plus'
    }
    return highest
  })()

  const hasAccess = useCallback(
    (questId: string) => {
      const required = getRequiredPlanForQuest(questId)
      if (required === 'free') return true
      if (activePlanId === 'pro') return true
      if (activePlanId === 'plus' && required === 'plus') return true
      return records.some(record => record.questId === questId && record.source === 'code')
    },
    [activePlanId, records]
  )

  const unlockPlan = useCallback(
    (
      planId: LegacyOrCurrentPlanId,
      questId: string = PAID_QUEST_ID,
      options?: { paidPriceVnd?: number; promoCode?: string }
    ) => {
      return grantPremiumPlan(planId, resolvedOwner, questId, 'confirm-demo', options)
    },
    [resolvedOwner]
  )

  const cancelPlan = useCallback(() => {
    cancelPremiumPlan(resolvedOwner)
  }, [resolvedOwner])

  return { records, activePlanId, hasAccess, unlockPlan, cancelPlan }
}
