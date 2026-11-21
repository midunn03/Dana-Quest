import { useEffect, useRef, useState } from 'react'
import { t } from './i18n/locale'
import { useOptionalAuth } from './AuthContext'
import { requestLogin } from './lib/authPrompt'
import { getQuest } from './data/quests'
import {
  OPEN_PREMIUM_MODAL_EVENT,
  PAID_QUEST_ID,
  formatVnd,
  getPremiumPlans,
  getRequiredPlanForQuest,
  usePremiumAccess,
  validatePromoCode,
  type OpenPremiumModalOptions,
  type PremiumPlanId,
  type PremiumPlanSpec,
  type PromoValidationResult,
} from './lib/premium'
import './PremiumPricingModal.css'

export default function PremiumPricingModal() {
  const auth = useOptionalAuth()
  const { activePlanId, unlockPlan, cancelPlan } = usePremiumAccess(auth?.user?.id)
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<OpenPremiumModalOptions>({})
  const [confirmPlan, setConfirmPlan] = useState<PremiumPlanSpec | null>(null)
  const [promoInput, setPromoInput] = useState('')
  const [appliedPromo, setAppliedPromo] = useState<PromoValidationResult | null>(null)
  const [promoFeedback, setPromoFeedback] = useState<{ ok: boolean; text: string } | null>(null)
  const onUnlockedRef = useRef<(() => void) | undefined>(undefined)

  const resetCheckoutState = () => {
    setPromoInput('')
    setAppliedPromo(null)
    setPromoFeedback(null)
  }

  useEffect(() => {
    const handleOpen = (event: Event) => {
      const detail = (event as CustomEvent<OpenPremiumModalOptions>).detail ?? {}
      onUnlockedRef.current = detail.onUnlocked
      setOptions(detail)
      setConfirmPlan(null)
      resetCheckoutState()
      setOpen(true)
    }
    window.addEventListener(OPEN_PREMIUM_MODAL_EVENT, handleOpen)
    return () => window.removeEventListener(OPEN_PREMIUM_MODAL_EVENT, handleOpen)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
        setConfirmPlan(null)
        resetCheckoutState()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  if (!open) return null

  const questId = options.questId || PAID_QUEST_ID
  const quest = getQuest(questId)
  const requiredForQuest = getRequiredPlanForQuest(questId)
  const plans = getPremiumPlans()

  function closeModal() {
    setOpen(false)
    setConfirmPlan(null)
    resetCheckoutState()
  }

  function handleSelectPlan(plan: PremiumPlanSpec) {
    if (plan.id === 'free') return
    if (auth && auth.status !== 'authenticated' && auth.status !== 'unconfigured') {
      closeModal()
      requestLogin()
      return
    }
    resetCheckoutState()
    setConfirmPlan(plan)
  }

  function handleApplyPromoCode(codeValue: string) {
    if (!confirmPlan) return
    const result = validatePromoCode(codeValue, confirmPlan.priceVnd)
    if (result.valid) {
      setPromoInput(result.code)
      setAppliedPromo(result)
      setPromoFeedback({ ok: true, text: result.message })
    } else {
      setAppliedPromo(null)
      setPromoFeedback({ ok: false, text: result.message })
    }
  }

  function handleConfirmActivate() {
    if (!confirmPlan || confirmPlan.id === 'free') return
    const finalPrice = appliedPromo?.valid ? appliedPromo.finalPriceVnd : confirmPlan.priceVnd
    unlockPlan(confirmPlan.id as PremiumPlanId, questId, {
      paidPriceVnd: finalPrice,
      promoCode: appliedPromo?.valid ? appliedPromo.code : undefined,
    })
    const callback = onUnlockedRef.current
    closeModal()
    callback?.()
  }

  const finalPriceVnd = confirmPlan
    ? appliedPromo?.valid
      ? appliedPromo.finalPriceVnd
      : confirmPlan.priceVnd
    : 0

  return (
    <div
      className="premium-modal-backdrop"
      onMouseDown={event => {
        if (event.target === event.currentTarget) closeModal()
      }}
    >
      <section
        className={`premium-modal ${confirmPlan ? 'is-confirm-checkout' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="premium-modal-title"
      >
        {!confirmPlan ? (
          <>
            <header className="premium-modal-header">
              <div>
                <span className="premium-header-eyebrow">
                  ✦ {t('GÓI TRẢI NGHIỆM HÀNG THÁNG · DANA QUEST', 'MONTHLY EXPERIENCE PLANS · DANA QUEST')}
                </span>
                <h2 id="premium-modal-title">
                  {t('Chọn gói mở khóa hành trình', 'Choose your Dana Quest plan')}
                </h2>
                <p className="premium-header-subtitle">
                  {t(
                    'Trải nghiệm 13 quest miễn phí hoặc nâng cấp Plus & Pro theo tháng để mở khóa 3 hành trình đặc biệt — hủy bất cứ lúc nào.',
                    'Play 13 free quests or subscribe monthly to Plus & Pro for 3 exclusive premium quests — cancel anytime.'
                  )}
                </p>
              </div>
              <button
                type="button"
                className="premium-close-btn"
                aria-label={t('Đóng bảng giá', 'Close pricing modal')}
                onClick={closeModal}
              >
                ×
              </button>
            </header>

            <div className="premium-modal-body">
              {(options.reason === 'arrival' || options.reason === 'unlock') && (
                <div className="premium-context-banner" role="status">
                  <span>{requiredForQuest === 'pro' ? '🏔️' : '🐉'}</span>
                  <p>
                    {requiredForQuest === 'pro'
                      ? t(
                          `Hành trình "${quest?.title || questId}" thuộc Gói Pro! Kích hoạt Gói Pro hàng tháng để mở khóa toàn bộ 3 quest trả phí.`,
                          `"${quest?.title || questId}" requires the Pro plan! Activate Pro monthly to unlock all 3 premium quests.`
                        )
                      : t(
                          `Bạn đang mở khóa "${quest?.title || 'Đánh thức Long Mạch'}". Chọn Gói Plus (chỉ Cầu Rồng) hoặc Gói Pro (tất cả 3 quest trả phí).`,
                          `Unlocking "${quest?.title || 'Awakening the Dragon Vein'}". Choose Plus (Cầu Rồng) or Pro (all 3 paid quests).`
                        )}
                  </p>
                </div>
              )}

              {activePlanId !== 'free' && (
                <div className="premium-active-bar" role="status">
                  <div>
                    <span className="premium-active-pill">
                      ✓ {t('ĐANG HOẠT ĐỘNG', 'ACTIVE PLAN')}
                    </span>
                    <strong>
                      {activePlanId === 'pro'
                        ? t('Gói Pro (Hàng tháng) · Đã mở khóa cả 3 quest trả phí', 'Pro Plan (Monthly) · All 3 premium quests unlocked')
                        : t('Gói Plus (Hàng tháng) · Đã mở khóa quest Cầu Rồng', 'Plus Plan (Monthly) · Cầu Rồng unlocked')}
                    </strong>
                  </div>
                  <button
                    type="button"
                    className="premium-cancel-plan-btn"
                    onClick={cancelPlan}
                  >
                    {t('Hủy gói', 'Cancel plan')}
                  </button>
                </div>
              )}

              <div className="premium-plans-grid">
                {plans.map(plan => {
                  const isFree = plan.id === 'free'
                  const isCurrentPlan = activePlanId === plan.id
                  const includedByPro = plan.id === 'plus' && activePlanId === 'pro'
                  const upgradeFromPlus = plan.id === 'pro' && activePlanId === 'plus'
                  const plusInsufficentForProQuest =
                    plan.id === 'plus' && requiredForQuest === 'pro' && activePlanId !== 'plus'

                  return (
                    <article
                      key={plan.id}
                      className={`premium-plan-card ${isFree ? 'is-free' : ''} ${plan.popular ? 'is-popular' : ''} ${plan.id === 'pro' ? 'is-extended' : ''} ${isCurrentPlan ? 'is-active-tier' : ''}`}
                    >
                      <div className="premium-plan-top">
                        <span className="premium-plan-badge">
                          {isCurrentPlan
                            ? `✓ ${t('ĐANG SỬ DỤNG', 'CURRENT PLAN')}`
                            : plan.badge}
                        </span>
                        <h3>{plan.title}</h3>
                        <p className="premium-plan-sub">{plan.subtitle}</p>
                      </div>

                      <div className="premium-plan-price-block">
                        {plan.originalPriceLabel && (
                          <span className="premium-price-original">
                            {plan.originalPriceLabel}
                            {plan.periodLabel}
                          </span>
                        )}
                        <div className="premium-price-main-row">
                          <span className="premium-price-current-wrap">
                            <strong className="premium-price-current">{plan.priceLabel}</strong>
                            <small className="premium-price-period">{plan.periodLabel}</small>
                          </span>
                          {plan.saveLabel && <span className="premium-price-save">{plan.saveLabel}</span>}
                        </div>
                      </div>

                      <ul className="premium-plan-features">
                        {plan.features.map(feature => (
                          <li key={feature}>
                            <span aria-hidden="true">✓</span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {plan.note && <p className="premium-plan-note">{plan.note}</p>}

                      <div className="premium-plan-footer">
                        {isFree ? (
                          <button type="button" className="premium-cta-btn is-muted" disabled>
                            {isCurrentPlan
                              ? t('Đang dùng gói Miễn phí', 'Current Free Plan')
                              : t('Miễn phí mặc định', 'Included Free')}
                          </button>
                        ) : isCurrentPlan ? (
                          <div className="premium-owned-actions">
                            <span className="premium-owned-label">
                              ✓ {t(`Đang sử dụng Gói ${plan.title}`, `${plan.title} Plan Active`)}
                            </span>
                            <button
                              type="button"
                              className="premium-cta-btn is-cancel"
                              onClick={cancelPlan}
                            >
                              {t(`Hủy gói ${plan.title}`, `Cancel ${plan.title}`)}
                            </button>
                          </div>
                        ) : includedByPro ? (
                          <button type="button" className="premium-cta-btn is-unlocked" disabled>
                            ✓ {t('Đã bao gồm trong Gói Pro', 'Included in Pro Plan')}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className={`premium-cta-btn ${plan.popular ? 'is-gold' : 'is-emerald'}`}
                            onClick={() => handleSelectPlan(plan)}
                          >
                            {upgradeFromPlus
                              ? t(`Nâng cấp lên Pro · ${plan.priceLabel}${plan.periodLabel} →`, `Upgrade to Pro · ${plan.priceLabel}${plan.periodLabel} →`)
                              : plan.id === 'plus'
                              ? t(`Chọn Gói Plus · ${plan.priceLabel}${plan.periodLabel} →`, `Choose Plus · ${plan.priceLabel}${plan.periodLabel} →`)
                              : t(`Chọn Gói Pro · ${plan.priceLabel}${plan.periodLabel} →`, `Choose Pro · ${plan.priceLabel}${plan.periodLabel} →`)}
                          </button>
                        )}
                        {plusInsufficentForProQuest && !isCurrentPlan && (
                          <small className="premium-tier-hint">
                            {t('* Chỉ mở Cầu Rồng · Quest này cần Gói Pro', '* Unlocks Cầu Rồng only · Current quest requires Pro')}
                          </small>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>

              <footer className="premium-modal-footer">
                <div className="premium-footer-code">
                  <span>
                    {t('Có mã kích hoạt cho đoàn hoặc sự kiện?', 'Have a group or event voucher?')}
                  </span>
                  <a href="#/nhap-ma" onClick={closeModal}>
                    {t('Nhập mã đoàn tại đây →', 'Redeem group code →')}
                  </a>
                </div>
                <div className="premium-footer-b2b">
                  <a href="#/tai-khoan/pass" onClick={closeModal}>
                    {t('Quản lý & Hủy gói trong Tài khoản →', 'Manage or Cancel in Account →')}
                  </a>
                </div>
              </footer>
            </div>
          </>
        ) : (
          <div className="pmc-sheet">
            <div className="pmc-header">
              <h2 id="premium-modal-title">
                {t('Xác nhận thay đổi gói', 'Confirm plan changes')}
              </h2>
              <button
                type="button"
                className="pmc-close-btn"
                aria-label={t('Đóng xác nhận gói', 'Close plan confirmation')}
                onClick={closeModal}
              >
                ×
              </button>
            </div>

            <p className="pmc-subtitle">
              {t(
                `Bạn đang đăng ký Dana Quest ${confirmPlan.title}. Gói được tính phí hàng tháng và có thể hủy bất cứ lúc nào mà không ràng buộc.`,
                `You're upgrading to Dana Quest ${confirmPlan.title}. Billed monthly and can be canceled anytime.`
              )}
            </p>

            <div className="pmc-plan-row">
              <div>
                <strong className="pmc-plan-title">Dana Quest {confirmPlan.title}</strong>
                <span className="pmc-plan-billing">
                  {t('Thanh toán hàng tháng, bắt đầu từ hôm nay', 'Billed monthly, starting today')}
                </span>
              </div>
              <strong className="pmc-plan-price">
                {confirmPlan.priceLabel}
                {confirmPlan.periodLabel}
              </strong>
            </div>

            <hr className="pmc-divider" />

            <div className="pmc-breakdown">
              <div className="pmc-line-row">
                <span>{t('Tạm tính', 'Subtotal')}</span>
                <span>{formatVnd(confirmPlan.priceVnd)}</span>
              </div>
              <div className="pmc-line-row">
                <span>{t('Thuế (VAT)', 'Tax')}</span>
                <span>0đ</span>
              </div>
              {appliedPromo?.valid && (
                <div className="pmc-line-row is-discount">
                  <span>
                    {t(`Khuyến mãi (${appliedPromo.code} · Giảm 100%)`, `Promo (${appliedPromo.code} · 100% off)`)}
                  </span>
                  <span>-{formatVnd(appliedPromo.discountVnd)}</span>
                </div>
              )}
              <div className="pmc-line-row is-total">
                <strong>{t('Tổng thanh toán hôm nay', 'Total due today')}</strong>
                <strong className={`pmc-total-amount ${finalPriceVnd === 0 ? 'is-free' : ''}`}>
                  {formatVnd(finalPriceVnd)}
                </strong>
              </div>
            </div>

            <hr className="pmc-divider" />

            <div className="pmc-promo-card">
              <div className="pmc-promo-header">
                <label htmlFor="pmc-promo-input">
                  <span aria-hidden="true">🏷</span> {t('Mã khuyến mãi', 'Promo code')}
                </label>
              </div>
              <div className="pmc-promo-input-row">
                <input
                  id="pmc-promo-input"
                  type="text"
                  value={promoInput}
                  onChange={event => {
                    setPromoInput(event.target.value)
                    if (promoFeedback) setPromoFeedback(null)
                  }}
                  onKeyDown={event => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      handleApplyPromoCode(promoInput)
                    }
                  }}
                  placeholder={t('Nhập mã khuyến mãi', 'Enter promo code')}
                  autoCapitalize="characters"
                  autoComplete="off"
                />
                {appliedPromo?.valid ? (
                  <button
                    type="button"
                    className="pmc-promo-btn is-reset"
                    onClick={() => resetCheckoutState()}
                  >
                    {t('Đổi mã', 'Remove')}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="pmc-promo-btn"
                    onClick={() => handleApplyPromoCode(promoInput)}
                  >
                    {t('Áp dụng', 'Apply')}
                  </button>
                )}
              </div>
              {promoFeedback && (
                <p
                  className={`pmc-promo-feedback ${promoFeedback.ok ? 'is-ok' : 'is-err'}`}
                  role="status"
                  aria-live="polite"
                >
                  {promoFeedback.text}
                </p>
              )}
            </div>

            <div className="pmc-actions">
              <button
                type="button"
                className="pmc-cancel-btn"
                onClick={() => {
                  setConfirmPlan(null)
                  resetCheckoutState()
                }}
              >
                {t('Hủy', 'Cancel')}
              </button>
              <button
                type="button"
                className="pmc-buy-btn"
                onClick={handleConfirmActivate}
              >
                {finalPriceVnd === 0
                  ? t('Mua ngay · 0đ', 'Buy now · 0đ')
                  : t('Mua ngay', 'Pay now')}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
