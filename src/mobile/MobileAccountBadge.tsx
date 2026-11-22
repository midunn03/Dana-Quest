import { t } from '../i18n/locale'
import type { AuthUser } from '../lib/auth'
import { resolveAvatar } from '../lib/avatar'
import { usePremiumAccess } from '../lib/premium'
import PixelAvatar from '../PixelAvatar'

export default function MobileAccountBadge({
  route,
  user,
}: {
  route: string
  user?: AuthUser | null
}) {
  const { activePlanId } = usePremiumAccess(user?.id)
  const avatar = resolveAvatar(user?.avatarId)
  const name = user?.name || t('Khách', 'Guest')
  const isActive = route.startsWith('#/tai-khoan')

  return (
    <a
      className={`device-mobile-account-badge ${isActive ? 'is-active' : ''}`}
      href="#/tai-khoan"
      aria-current={isActive ? 'page' : undefined}
      aria-label={t('Tài khoản', 'Account')}
      title={t('Tài khoản', 'Account')}
    >
      <span className="device-mobile-account-avatar">
        {avatar ? <PixelAvatar avatar={avatar} /> : <span aria-hidden="true">👤</span>}
      </span>
      <span className="device-mobile-account-meta">
        <strong className="device-mobile-account-name">{name}</strong>
        <span className={`device-mobile-plan-chip is-${activePlanId}`} lang="en">
          {activePlanId === 'pro' ? '✦ PRO' : activePlanId === 'plus' ? 'PLUS' : 'FREE'}
        </span>
      </span>
    </a>
  )
}
