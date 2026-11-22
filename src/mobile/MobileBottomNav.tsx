import { t } from '../i18n/locale'
import { NavigationIcon } from '../MainNavigation'
import { requestLogin } from '../lib/authPrompt'

interface MobileBottomNavProps {
  route: string
}

export default function MobileBottomNav({ route }: MobileBottomNavProps) {
  const items = [
    {
      href: '#/kham-pha',
      label: t('Khám phá', 'Explore'),
      kind: 'explore' as const,
      active: ['#/kham-pha', '#/explore', '#/map'].includes(route) || /^#\/(dia-diem|quest)\//.test(route),
    },
    {
      href: '#/su-kien',
      label: t('Sự kiện', 'Events'),
      kind: 'events' as const,
      active: route.startsWith('#/su-kien'),
    },
    {
      href: '#/quest-cua-toi',
      label: 'Quest',
      kind: 'quests' as const,
      active: route === '#/quest-cua-toi' || route.startsWith('#/nhiem-vu/'),
    },
    {
      href: '#/cua-hang',
      label: t('Cửa hàng đổi xu', 'Coin shop'),
      kind: 'shop' as const,
      active: route === '#/cua-hang',
    },
  ]

  return (
    <nav className="device-mobile-nav" aria-label={t('Điều hướng điện thoại', 'Mobile navigation')}>
      {items.map((item) => (
        <a
          key={item.href}
          href={item.href}
          onClick={() => {
            if (item.kind === 'quests') requestLogin()
          }}
          className={`device-mobile-nav-item ${item.active ? 'active' : ''}`}
          aria-current={item.active ? 'page' : undefined}
          aria-label={item.label}
        >
          <span className="device-mobile-nav-icon">
            <NavigationIcon kind={item.kind} />
          </span>
          <span className="device-mobile-nav-label">{item.label}</span>
        </a>
      ))}
    </nav>
  )
}
