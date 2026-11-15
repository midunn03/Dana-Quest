import { t } from '../i18n/locale'

interface MobileBottomNavProps {
  route: string
}

export default function MobileBottomNav({ route }: MobileBottomNavProps) {
  const isMap = route === '#/map' || route === '#/kham-pha' || route === '#/explore' || /^#\/(dia-diem|quest)\//.test(route)
  const isEvents = route.startsWith('#/su-kien')
  const isBadges = route === '#/tai-khoan/badges' || route === '#/album'
  const isRewards = route === '#/tai-khoan/wallet' || route === '#/cua-hang'
  const isAccount = (route.startsWith('#/tai-khoan') && !isBadges && !isRewards) || route === '#/nhan-vat' || route === '#/chon-nhan-vat'

  const items = [
    {
      href: '#/map',
      label: t('Bản đồ', 'Map'),
      active: isMap,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
          <line x1="8" y1="2" x2="8" y2="18" />
          <line x1="16" y1="6" x2="16" y2="22" />
        </svg>
      ),
    },
    {
      href: '#/su-kien',
      label: t('Sự kiện', 'Events'),
      active: isEvents,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    },
    {
      href: '#/tai-khoan/badges',
      label: t('Bộ sưu tập', 'Badges'),
      active: isBadges,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="8" r="7" />
          <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
        </svg>
      ),
    },
    {
      href: '#/tai-khoan/wallet',
      label: t('Thưởng', 'Rewards'),
      active: isRewards,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    },
    {
      href: '#/tai-khoan',
      label: t('Tài khoản', 'Profile'),
      active: isAccount,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
  ]

  return (
    <nav className="device-mobile-nav" aria-label={t('Điều hướng điện thoại', 'Mobile navigation')}>
      {items.map((item) => (
        <a
          key={item.href}
          href={item.href}
          className={`device-mobile-nav-item ${item.active ? 'active' : ''}`}
          aria-current={item.active ? 'page' : undefined}
          aria-label={item.label}
        >
          <span className="device-mobile-nav-icon">{item.icon}</span>
          <span className="device-mobile-nav-label">{item.label}</span>
        </a>
      ))}
    </nav>
  )
}
