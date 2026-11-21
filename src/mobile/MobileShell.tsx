import { type ReactNode } from 'react'
import { t } from '../i18n/locale'
import MobileBottomNav from './MobileBottomNav'
import MobileAccountBadge from './MobileAccountBadge'
import type { AuthUser } from '../lib/auth'

export interface MobileShellProps {
  route: string
  children: ReactNode
  user?: AuthUser | null
  onOpenDeviceSelector?: () => void
}

export default function MobileShell({
  route,
  children,
  user,
  onOpenDeviceSelector,
}: MobileShellProps) {
  const isMapScreen =
    route === '#/map' ||
    route.startsWith('#/chi-duong/') ||
    /^#\/quest\/[^/]+\/dan-duong$/.test(route) ||
    /^#\/quest\/[^/]+\/choi$/.test(route)

  const isFullscreenExperience =
    route.startsWith('#/may-anh/') ||
    route.startsWith('#/hoan-thanh/')

  return (
    <div className={`device-mobile-shell ${isMapScreen ? 'device-mobile-map-active' : ''}`}>
      {/* Mobile Header */}
      {!isFullscreenExperience && (
        <header className="device-mobile-header" role="banner">
          <div className="device-mobile-brand-group">
            <a href="#/kham-pha" className="device-mobile-logo" aria-label="Dana Quest">
              <span>DANA QUEST</span>
            </a>
          </div>

          <div className="device-mobile-header-actions">
            <MobileAccountBadge route={route} user={user} />
            {onOpenDeviceSelector && (
              <button
                type="button"
                className="device-mobile-mode-btn"
                onClick={onOpenDeviceSelector}
                aria-label={t('Đổi giao diện Web/Điện thoại', 'Switch Web/Mobile layout')}
                title={t('Đổi giao diện Web / Điện thoại', 'Switch Web / Mobile layout')}
              >
                <span className="device-mobile-mode-icon" aria-hidden="true">🔄</span>
                <span className="device-mobile-mode-label">Mobile</span>
              </button>
            )}
          </div>
        </header>
      )}

      {/* Main Viewport Content */}
      <main className="device-mobile-content" role="main">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      {!isFullscreenExperience && <MobileBottomNav route={route} />}
    </div>
  )
}
