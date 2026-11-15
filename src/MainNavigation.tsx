import './MainNavigation.css'
import { t } from './i18n/locale'
import {requestLogin} from './lib/authPrompt'
type IconKind = 'explore' | 'events' | 'search' | 'quests' | 'account'

export function NavigationIcon({ kind }: { kind: IconKind }) {
  const paths: Record<IconKind, string> = {
    explore: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM16 8l-2.5 5.5L8 16l2.5-5.5L16 8Z',
    events: 'M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2Zm3 10h3m3 0h2m-8 3h3',
    search: 'M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15Zm5.5-2 5 5',
    quests: 'M12 6C9 3 5 3 2 4v15c3-1 7-1 10 2m0-15c3-3 7-3 10-2v15c-3-1-7-1-10 2V6Z',
    account: 'M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9ZM4 22v-2a8 8 0 0 1 16 0v2',
  }
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[kind]} /></svg>
}

export default function MainNavigation({ route }: { route: string }) {
  const items: { href: string; label: string; kind: IconKind; active: boolean }[] = [
    { href: '#/kham-pha', label: t("Khám phá"), kind: 'explore', active: ['#/kham-pha', '#/explore', '#/map'].includes(route) || /^#\/(dia-diem|quest)\//.test(route) },
    { href: '#/su-kien', label: t("Sự kiện"), kind: 'events', active: route.startsWith('#/su-kien') },
    { href: '#/tim-kiem', label: t("Tìm kiếm"), kind: 'search', active: route === '#/tim-kiem' },
    { href: '#/quest-cua-toi', label: 'Quest', kind: 'quests', active: route === '#/quest-cua-toi' || route.startsWith('#/nhiem-vu/') },
    { href: '#/tai-khoan', label: t("Tài khoản"), kind: 'account', active: route.startsWith('#/tai-khoan') || ['#/album', '#/cua-hang'].includes(route) },
  ]
  return <nav className="bottom-nav quest-main-nav" aria-label={t("Điều hướng chính")}>
    {items.map(item => <a key={item.kind} href={item.href} onClick={()=>{if(item.kind==='quests')requestLogin()}} className={item.kind === 'search' ? 'nav-search' : undefined} aria-label={item.label} aria-current={item.active ? 'page' : undefined}>
      <span className="nav-icon"><NavigationIcon kind={item.kind} /></span><span className="nav-label">{item.label}</span>
    </a>)}
  </nav>
}

