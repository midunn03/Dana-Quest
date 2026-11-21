import './WorkspaceNavigation.css'
import { t } from './i18n/locale'
import { useEffect, useRef } from 'react'

export interface WorkspaceNavItem {
  href: string
  label: string
  icon: string
}

export interface WorkspaceNavGroup {
  id: string
  title: string
  items: WorkspaceNavItem[]
}

export function getAccountWorkspaceGroups(): WorkspaceNavGroup[] {
  return [
    {
      id: 'profile',
      title: t('Hồ sơ & Gói trải nghiệm', 'Profile & Plans'),
      items: [
        { href: '#/tai-khoan', label: t('Tài khoản', 'Account'), icon: 'user' },
        { href: '#/tai-khoan/edit', label: t('Chỉnh sửa hồ sơ', 'Edit profile'), icon: 'edit' },
        { href: '#/nhan-vat', label: t('Nhân vật', 'Character'), icon: 'user' },
        { href: '#/tai-khoan/pass', label: t('Gói trải nghiệm & Quyền chơi', 'Experience packs & Access'), icon: 'ticket' },
      ],
    },
    {
      id: 'journey',
      title: t('Hành trình & Bộ sưu tập', 'Journey & Collection'),
      items: [
        { href: '#/tai-khoan/journal', label: t('Nhật ký khám phá', 'Your journal'), icon: 'book' },
        { href: '#/tai-khoan/badges', label: t('Bộ sưu tập huy hiệu', 'Badge collection'), icon: 'star' },
        { href: '#/album', label: t('Thư viện kỷ niệm', 'Quest library'), icon: 'photo' },
        { href: '#/tai-khoan/groups', label: t('Nhóm bạn bè', 'Friend groups'), icon: 'user' },
      ],
    },
    {
      id: 'wallet',
      title: t('Ví xu & Đổi thưởng', 'Wallet & Rewards'),
      items: [
        { href: '#/tai-khoan/wallet', label: t('Ví xu', 'Your wallet'), icon: 'ticket' },
        { href: '#/cua-hang', label: t('Cửa hàng đổi xu', 'Coin shop'), icon: 'gift' },
      ],
    },
    {
      id: 'system',
      title: t('Hệ thống & Hỗ trợ', 'System & Support'),
      items: [
        { href: '#/tai-khoan/notifications', label: t('Thông báo', 'Notifications'), icon: 'bell' },
        { href: '#/tai-khoan/cai-dat', label: t('Cài đặt', 'Settings'), icon: 'settings' },
        { href: '#/tai-khoan/help', label: t('Trợ giúp', 'Help'), icon: 'help' },
      ],
    },
  ]
}

/** One route list for the desktop account rail and mobile drawer shortcuts. */
export default function WorkspaceNavigation({ route }: { route: string }) {
  const menu = useRef<HTMLElement>(null)
  const items = getAccountWorkspaceGroups().flatMap(group => group.items)
  useEffect(() => { menu.current?.querySelector('a[aria-current]')?.scrollIntoView?.({ block: 'nearest', inline: 'center' }) }, [route])
  return <nav ref={menu} className="workspace-navigation" aria-label={t('Không gian tài khoản', 'Account workspace')}>
    <div className="workspace-links">{items.map(item => <a key={item.href} href={item.href} aria-current={route === item.href ? 'page' : undefined}>{item.label}<span aria-hidden="true">›</span></a>)}</div>
  </nav>
}
