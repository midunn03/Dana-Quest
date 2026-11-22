import { useEffect, useId, useRef, useState } from 'react'
import { quests } from './data/quests'
import { destinations, getDestination } from './data/destinations'
import { searchText } from './lib/filters'
import { t } from './i18n/locale'
import { NavigationIcon } from './MainNavigation'
import './SearchDropdown.css'

export default function SearchDropdown({ className = '' }: { className?: string }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const root = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const id = useId()
  const items = [
    ...quests.map(q => ({ key: `quest-${q.id}`, title: q.title, keywords: `${q.area} ${getDestination(q.id)?.name ?? ''}`, detail: t('Quest cốt truyện', 'Story quest'), href: `#/quest/${q.id}` })),
    ...destinations.map(p => ({ key: `place-${p.id}`, title: p.name, keywords: p.highlightReason, detail: t('Địa điểm', 'Place'), href: quests.some(q => q.id === p.id) ? `#/quest/${p.id}` : `#/dia-diem/${p.id}` })),
  ].filter(item => searchText(`${item.key} ${item.title} ${item.keywords} ${item.detail}`).includes(searchText(query)))
  useEffect(() => {
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false) }
    const close = () => setOpen(false)
    document.addEventListener('pointerdown', outside)
    window.addEventListener('hashchange', close)
    return () => { document.removeEventListener('pointerdown', outside); window.removeEventListener('hashchange', close) }
  }, [])
  return <div ref={root} className={`search-dropdown ${className}`} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false) }} onKeyDown={event => {
    if (event.key === 'Escape') { input.current?.focus(); setOpen(false) }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault(); setOpen(true)
      const links = Array.from(root.current?.querySelectorAll<HTMLAnchorElement>('.search-dropdown-results a') ?? [])
      const current = links.indexOf(document.activeElement as HTMLAnchorElement)
      const next = event.key === 'ArrowDown' ? current + 1 : current < 0 ? links.length - 1 : current - 1
      if (next < 0) input.current?.focus(); else links[next % links.length]?.focus()
    }
  }}>
    <label className="search-dropdown-field"><NavigationIcon kind="search"/><span className="sr-only">{t('Tìm quest hoặc địa điểm')}</span><input ref={input} type="search" value={query} placeholder={t('Tìm quest hoặc địa điểm')} aria-expanded={open} aria-controls={id} onFocus={() => setOpen(true)} onChange={event => { setQuery(event.target.value); setOpen(true) }}/><button type="button" aria-label={t('Hiện kết quả tìm kiếm', 'Show search results')} aria-expanded={open} onClick={() => { if (open) setOpen(false); else input.current?.focus() }}><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button></label>
    {open && <section id={id} className="search-dropdown-panel" aria-label={t('Kết quả tìm kiếm', 'Search results')}><div className="search-dropdown-heading">{query ? t('Kết quả phù hợp', 'Matching results') : t('Chọn hành trình để khám phá', 'Choose your next adventure')}<small>{items.length} {t('kết quả', 'results')}</small></div><div className="search-dropdown-results">{items.length ? items.map(item => <a key={item.key} href={item.href} onClick={() => setOpen(false)}><span><strong>{item.title}</strong><small>{item.detail}</small></span><span aria-hidden="true">→</span></a>) : <p role="status">{t('Chưa tìm thấy. Thử tên quest hoặc địa điểm khác.', 'No matches. Try another quest or place.')}</p>}</div></section>}
  </div>
}
