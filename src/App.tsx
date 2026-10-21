import GameIcon from './GameIcon'
import CelebrationPage from './CelebrationPage'
import DestinationDetails from './DestinationDetails'
import CameraPage from './CameraPage'
import WelcomePage from './WelcomePage'
import AvatarPage from './AvatarPage'
import Notifications from './Notifications'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import DestinationPage from './DestinationPage'
import AlbumPage from './AlbumPage'
import ShopPage from './ShopPage'
import AccountPage from './AccountPage'
import AuthPage from './AuthPage'
import ActiveMissionIndicator from './ActiveMissionIndicator'
import QuestDetailsPage from './QuestDetailsPage'
import QuestPlayPage from './QuestPlayPage'
import EventsPage from './EventsPage'
import EventDetailsPage from './EventDetailsPage'
import { scheduleEventReminders } from './lib/eventReminders'

const Explore = lazy(() => import('./Explore'))
const NavigationPage = lazy(() => import('./NavigationPage'))
const QuestNavigationPage = lazy(() => import('./QuestNavigationPage'))
import { AuthProvider, useAuth } from './AuthContext'
import './App.css'
import './GameVisual.css'
import './MapCompact.css'
import { canNavigateFrom } from './lib/navigationGuard'
import './MobileLayout.css'
import './TravelVisual.css'

function AppRouter() {
  const auth = useAuth()
  const [hash, setHash] = useState(window.location.hash)
  const shell = useRef<HTMLDivElement>(null)
  useEffect(() => { scheduleEventReminders() }, [])
  useEffect(() => {
    const navigate = () => { if (canNavigateFrom(hash)) { setHash(window.location.hash); window.scrollTo(0, 0) } }
    window.addEventListener('hashchange', navigate)
    return () => window.removeEventListener('hashchange', navigate)
  }, [hash])
  const normalized = hash.replace(/\/+$/, '')
  const route = !normalized || normalized === '#' ? '#/' : normalized
  useEffect(() => { const page = shell.current?.querySelector(':scope > main'); if (page instanceof HTMLElement) page.scrollTop = 0 }, [route])
  const isSearch = route === '#/kham-pha/tim-kiem'
  const isMap = ['#/kham-pha', '#/explore', '#/map'].includes(route) || isSearch
  const publicRoute = route === '#/' || route === '#/dang-nhap' || route === '#/dang-ky'
  const authRoute = route === '#/dang-nhap' || route === '#/dang-ky'
  useEffect(() => {
    if (auth.status === 'checking') return
    if (!publicRoute && auth.status !== 'authenticated') {
      if (window.location.hash !== '#/dang-nhap') window.location.hash = '#/dang-nhap'
    } else if ((authRoute || route === '#/') && auth.status === 'authenticated') {
      window.location.hash = auth.user?.avatarId ? '#/kham-pha' : '#/chon-nhan-vat'
    }
  }, [auth.status, auth.user?.avatarId, authRoute, publicRoute, route])
  const blocked = !publicRoute && auth.status !== 'authenticated'
  const page = route === '#/' && (auth.status === 'checking' || auth.status === 'authenticated')
    ? <main className="auth-loading"><p role="status">Đang mở hành trình của bạn…</p></main>
    : blocked
    ? auth.status === 'checking' ? <main className="auth-loading"><p role="status">Đang kiểm tra phiên tài khoản…</p></main> : <AuthPage />
    : route === '#/dang-nhap' ? <AuthPage initialMode="login" />
    : route === '#/dang-ky' ? <AuthPage initialMode="register" />
    : isMap ? <Explore searchOpen={isSearch} />
    : route === '#/tai-khoan' ? <AccountPage user={auth.user!} onLogout={auth.logout} />
    : route === '#/chon-nhan-vat' || route === '#/nhan-vat' ? <AvatarPage editing={route === '#/nhan-vat'} initialAvatarId={auth.user?.avatarId} onAvatarConfirmed={auth.saveAvatar} />
    : route === '#/album' ? <AlbumPage />
    : route === '#/cua-hang' ? <ShopPage />
    : route === '#/su-kien' ? <EventsPage />
    : route.startsWith('#/su-kien/') ? <EventDetailsPage key={route} id={route.slice('#/su-kien/'.length)} />
    : /^#\/quest\/[^/]+\/chi-duong$/.test(route) ? <QuestNavigationPage key={route} id={route.split('/')[2]} />
    : /^#\/quest\/[^/]+\/choi$/.test(route) ? <QuestPlayPage key={route} id={route.split('/')[2]} />
    : route.startsWith('#/quest/') ? <QuestDetailsPage key={route} id={route.slice('#/quest/'.length)} />
    : route.startsWith('#/chi-duong/') ? <NavigationPage key={route} id={route.slice('#/chi-duong/'.length)} />
    : route.startsWith('#/hoan-thanh/') ? <CelebrationPage key={route} id={route.split('/')[2]} missionId={route.split('/')[3]} />
    : route.startsWith('#/may-anh/') ? <CameraPage key={route} id={route.split('/')[2]} missionId={route.split('/')[3]} />
    : route.startsWith('#/nhiem-vu/') ? <DestinationPage key={route} id={route.slice('#/nhiem-vu/'.length)} />
    : route.startsWith('#/dia-diem/') ? <DestinationDetails key={route} id={route.slice('#/dia-diem/'.length)} />
    : route !== '#/' ? (
      <main className="quest-page">
        <h1>Không tìm thấy trang</h1>
        <p>Liên kết này không hợp lệ. Bạn có thể quay về trang chủ hoặc chọn điểm đến trên bản đồ.</p>
        <nav className="quest-nav" aria-label="Quay lại khám phá">
          <a href="#/">Về trang chủ</a>
          <a href="#/kham-pha">Mở bản đồ</a>
        </nav>
      </main>
    ) : <WelcomePage />
  const onboarding = route === '#/' || authRoute || route === '#/chon-nhan-vat' || route === '#/nhan-vat' || route.startsWith('#/may-anh/') || route.startsWith('#/hoan-thanh/')
  return <div ref={shell} className={`app-shell ${onboarding ? 'onboarding-shell' : ''} ${route === '#/tai-khoan' ? 'account-shell' : ''}`}>
    <Suspense fallback={<main className="auth-loading"><p role="status">Đang mở bản đồ…</p></main>}>{page}</Suspense><Notifications />{auth.status === 'authenticated' && !onboarding && <ActiveMissionIndicator />}
    <nav className="bottom-nav" aria-label="Điều hướng chính">
      <a href="#/kham-pha" aria-label="Khám phá" aria-current={(isMap && !isSearch) || /#\/(dia-diem|nhiem-vu|chi-duong|quest)\//.test(route) ? 'page' : undefined}><GameIcon kind="map"/>Khám phá</a>
      <a href="#/su-kien" aria-label="Sự kiện" aria-current={route.startsWith('#/su-kien') ? 'page' : undefined}><span aria-hidden="true">◷</span>Sự kiện</a>
      <a className="bottom-search" href="#/kham-pha/tim-kiem" aria-label="Tìm kiếm" aria-current={isSearch ? 'page' : undefined}><span aria-hidden="true">⌕</span>Tìm kiếm</a>
      <a href="#/cua-hang" aria-label="Cửa hàng" aria-current={route === '#/cua-hang' ? 'page' : undefined}><GameIcon kind="gift"/>Cửa hàng</a>
      <a href="#/tai-khoan" aria-label="Hồ sơ" aria-current={route === '#/tai-khoan' || route === '#/album' ? 'page' : undefined}><GameIcon kind="person"/>Hồ sơ</a>
    </nav>
  </div>
}

export default function App() {
  return <AuthProvider><AppRouter /></AuthProvider>
}






