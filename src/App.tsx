import GameIcon from './GameIcon'
import CelebrationPage from './CelebrationPage'
import DestinationDetails from './DestinationDetails'
import NavigationPage from './NavigationPage'
import CameraPage from './CameraPage'
import WelcomePage from './WelcomePage'
import AvatarPage from './AvatarPage'
import Notifications from './Notifications'
import { useEffect, useRef, useState } from 'react'
import Explore from './Explore'
import DestinationPage from './DestinationPage'
import AlbumPage from './AlbumPage'
import ShopPage from './ShopPage'
import AccountPage from './AccountPage'
import AuthPage from './AuthPage'
import ActiveMissionIndicator from './ActiveMissionIndicator'
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
  useEffect(() => {
    const navigate = () => { if (canNavigateFrom(hash)) { setHash(window.location.hash); window.scrollTo(0, 0) } }
    window.addEventListener('hashchange', navigate)
    return () => window.removeEventListener('hashchange', navigate)
  }, [hash])
  const normalized = hash.replace(/\/+$/, '')
  const route = !normalized || normalized === '#' ? '#/' : normalized
  useEffect(() => { const page = shell.current?.querySelector(':scope > main'); if (page instanceof HTMLElement) page.scrollTop = 0 }, [route])
  const isMap = ['#/kham-pha', '#/explore', '#/map'].includes(route)
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
    : isMap ? <Explore />
    : route === '#/tai-khoan' ? <AccountPage user={auth.user!} onLogout={auth.logout} />
    : route === '#/chon-nhan-vat' || route === '#/nhan-vat' ? <AvatarPage editing={route === '#/nhan-vat'} initialAvatarId={auth.user?.avatarId} onAvatarConfirmed={auth.saveAvatar} />
    : route === '#/album' ? <AlbumPage />
    : route === '#/cua-hang' ? <ShopPage />
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
    {page}<Notifications />{auth.status === 'authenticated' && !onboarding && <ActiveMissionIndicator />}
    <nav className="bottom-nav" aria-label="Điều hướng chính">
      <a href="#/kham-pha" aria-label="Bản đồ" aria-current={isMap || /#\/(dia-diem|nhiem-vu|chi-duong)\//.test(route) ? 'page' : undefined}><GameIcon kind="map"/>Bản đồ</a>
      <a href="#/album" aria-label="Album" aria-current={route === '#/album' ? 'page' : undefined}><GameIcon kind="album"/>Thư viện</a>
      <a href="#/cua-hang" aria-label="Đổi quà" aria-current={route === '#/cua-hang' ? 'page' : undefined}><GameIcon kind="gift"/>Phần thưởng</a>
      <a href="#/tai-khoan" aria-label="Tài khoản" aria-current={route === '#/tai-khoan' ? 'page' : undefined}><GameIcon kind="person"/>Tài khoản</a>    </nav>
  </div>
}

export default function App() {
  return <AuthProvider><AppRouter /></AuthProvider>
}






