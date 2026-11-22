import type { ReactNode } from 'react'
import PixelLogo from './PixelLogo'
import SearchDropdown from './SearchDropdown'
import { useLocale } from './i18n/LocaleProvider'
import './PageTools.css'

export function HeaderQuickToggles({
  compact = false,
  hideDevice = false,
  className = '',
}: {
  compact?: boolean
  hideDevice?: boolean
  className?: string
}) {
  const { locale, setLanguage, t } = useLocale()
  return (
    <div className={`page-tools-actions ${compact ? 'is-compact' : ''} ${className}`.trim()}>
      <div className="page-tools-lang" role="group" aria-label={t('Ngôn ngữ', 'Language')} lang="en">
        {(['vi', 'en'] as const).map(value => (
          <button
            key={value}
            type="button"
            aria-pressed={locale === value}
            onClick={() => setLanguage(value)}
          >
            {value.toUpperCase()}
          </button>
        ))}
      </div>
      {!hideDevice && (
        <button
          type="button"
          className="page-tools-device-btn"
          onClick={() => window.dispatchEvent(new CustomEvent('dana-open-device-modal'))}
          aria-label={t('Đổi giao diện Web / Điện thoại', 'Switch Web / Mobile layout')}
          title={t('Đổi giao diện Web / Điện thoại', 'Switch Web / Mobile layout')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <rect x="5" y="2" width="14" height="20" rx="3" />
            <path d="M10 18h4" />
          </svg>
        </button>
      )}
    </div>
  )
}

export default function PageTools({ route, children }: { route: string; children?: ReactNode }) {
  if (route === '#/map') return <header className="page-tools is-hidden-map" hidden />
  const isHomeRoute = route === '#/' || route === '#/dang-nhap' || route === '#/dang-ky'
  return <header className="page-tools">
    <div className="page-tools-left">
      {!isHomeRoute && <a className="page-tools-brand" href="#/" aria-label="Dana Quest"><PixelLogo compact /></a>}
      <SearchDropdown />
    </div>
    {!isHomeRoute && <HeaderQuickToggles />}
    {children}
  </header>
}
