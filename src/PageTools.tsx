import type { ReactNode } from 'react'
import { NavigationIcon } from './MainNavigation'
import { t } from './i18n/locale'
import './PageTools.css'

export default function PageTools({ route, children }: { route: string; children?: ReactNode }) {
  return <header className="page-tools">
    <a className="page-tools-search" href="#/tim-kiem" aria-label={t('Tìm kiếm')} aria-current={route === '#/tim-kiem' ? 'page' : undefined}>
      <NavigationIcon kind="search" />
      <span>{t('Tìm quest hoặc địa điểm')}</span>
      <span className="page-tools-search-arrow" aria-hidden="true">↗</span>
    </a>
    {children}
  </header>
}
