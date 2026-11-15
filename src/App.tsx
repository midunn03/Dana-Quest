import './ExperienceTokens.css'
import NotFoundPage from './NotFoundPage'
import { t } from './i18n/locale'
import { LocaleProvider, useLocale } from './i18n/LocaleProvider'
import './App.css'
import {getQuest} from './data/quests'
import QuestGuestPage from './QuestGuestPage'
import MainNavigation from './MainNavigation'
import WorkspaceNavigation from './WorkspaceNavigation'
import DiscoveryPage from './DiscoveryPage'
import OnboardingPage from './OnboardingPage'
import BookingPage from './BookingPage'
import InformationPage from './InformationPage'
import { rememberPageReturn } from './lib/onboarding'
import CelebrationPage from './CelebrationPage'
const DestinationDetails=lazy(()=>import('./DestinationDetails'))
import CameraPage from './CameraPage'
import WelcomePage from './WelcomePage'
import AvatarPage from './AvatarPage'
import Notifications from './Notifications'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import DestinationPage from './DestinationPage'
const AlbumPage=lazy(()=>import('./AlbumPage'))
import ShopPage from './ShopPage'
import AccountPage from './AccountPage'
import AuthPage from './AuthPage'
import ActiveMissionIndicator from './ActiveMissionIndicator'
import PageTools from './PageTools'
const QuestDetailsPage=lazy(()=>import('./QuestDetailsPage'))
const QuestPlayPage=lazy(()=>import('./QuestPlayPage'))
const CreatorPage = lazy(() => import('./CreatorPage'))
const EventsPage = lazy(() => import('./EventsPage'))
const EventDetailsPage = lazy(() => import('./EventDetailsPage'))
import EventProvider from './EventProvider'

const Explore = lazy(() => import('./Explore'))
const NavigationPage = lazy(() => import('./NavigationPage'))
const QuestNavigationPage = lazy(() => import('./QuestNavigationPage'))
const DueStartPage = lazy(() => import('./DueStartPage'))
import { AuthProvider, useAuth } from './AuthContext'
import { canNavigateFrom } from './lib/navigationGuard'
function AppRouter() {
  useLocale()
  const auth = useAuth()
  const [loginPrompt,setLoginPrompt]=useState(false),[loginMode,setLoginMode]=useState<'login'|'register'>('login'),[dismissedQuest,setDismissedQuest]=useState('')
  const loginOpener=useRef<HTMLElement|null>(null)
  const [homeAuthMode,setHomeAuthMode]=useState<'login'|'register'>(window.location.hash==='#/dang-ky'?'register':'login')
  useEffect(()=>{const open=()=>{if(auth.status!== 'authenticated'){if(['','#/','#/dang-nhap','#/dang-ky'].includes(window.location.hash)){document.getElementById('home-login')?.scrollIntoView({behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});return}loginOpener.current=document.activeElement as HTMLElement;setLoginMode('login');setLoginPrompt(true)}};window.addEventListener('dana-request-login',open);return()=>window.removeEventListener('dana-request-login',open)},[auth.status])
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
  const isMap = route === '#/map'
  const journeyRoute = route.startsWith('#/bat-dau/') || ['#/kich-hoat', '#/nhap-ma', '#/dieu-khoan', '#/quyen-rieng-tu'].includes(route)
  const publicRoute = route.startsWith('#/nha-sang-tao/') || route==='#/quest-cua-toi' || route.startsWith('#/su-kien/') || route.startsWith('#/tai-khoan') || journeyRoute || ['#/', '#/dang-nhap', '#/dang-ky', '#/kham-pha', '#/explore', '#/map', '#/tim-kiem', '#/su-kien'].includes(route) || /^#\/(quest|dia-diem)\/[^/]+$/.test(route)
  const authRoute = route === '#/dang-nhap' || route === '#/dang-ky'
  useEffect(() => {
    if(authRoute){setHomeAuthMode(route==='#/dang-ky'?'register':'login');window.history.replaceState(window.history.state,'','#/');setHash('#/');return}
    if (auth.status === 'checking') return
    if (!publicRoute && auth.status !== 'authenticated') {
      if (window.location.hash !== '#/dang-nhap') window.location.hash = '#/dang-nhap'
    }
  }, [auth.status, auth.user?.avatarId, authRoute, publicRoute, route, hash])
  const guestQuest=route==='#/quest-cua-toi'&&auth.status!=='authenticated'&&auth.status!=='checking'
  const showLogin=auth.status!=='authenticated'&&auth.status!=='checking'&&(loginPrompt||guestQuest&&dismissedQuest!==route)
  const closeLogin=()=>{setLoginPrompt(false);setDismissedQuest(route);if(authRoute)window.location.hash='#/';requestAnimationFrame(()=>{if(loginOpener.current?.isConnected)loginOpener.current.focus();else shell.current?.querySelector<HTMLElement>('.landing-login,.q-briefing-start,.ev-save a,.discovery-empty button')?.focus()})}
  const blocked = !publicRoute && auth.status !== 'authenticated'
  const page = route === '#/' || authRoute
    ? <WelcomePage initialMode={authRoute?(route==='#/dang-ky'?'register':'login'):homeAuthMode}/>
    : blocked
    ? <main className="auth-loading"><p role="status">{auth.status==='checking'?t("Đang kiểm tra phiên tài khoản…"):t("Đang mở trang đăng nhập…","Opening sign-in…")}</p></main>
    : route === '#/bat-dau/thanh-pho' ? <OnboardingPage key="city" step="city" />
    : route === '#/bat-dau/ke-hoach' ? <OnboardingPage key="plans" step="plans" />
    : route === '#/bat-dau/gioi-thieu' ? <OnboardingPage key="intro" step="intro" />
    : route === '#/kich-hoat' ? <BookingPage key="activation" />
    : route === '#/nhap-ma' ? <BookingPage key="code" entry />
    : route === '#/dieu-khoan' || route === '#/quyen-rieng-tu' ? <InformationPage privacy={route === '#/quyen-rieng-tu'} />
    : isMap ? <Explore />
    : ['#/kham-pha', '#/explore'].includes(route) ? <DiscoveryPage key="explore" />
    : route === '#/tim-kiem' ? <DiscoveryPage key="search" mode="search" />
    : route==='#/quest-cua-toi'&&auth.status==='checking' ? <main className="auth-loading"><p role="status">{t("Đang kiểm tra tài khoản…")}</p></main>
    : guestQuest ? <QuestGuestPage/>
    : route === '#/quest-cua-toi' ? <DiscoveryPage key="joined" mode="joined" activatedEnabled />
    : route.startsWith('#/tai-khoan') ? <AccountPage key={route} user={auth.user} onLogout={auth.logout} view={route.split('/')[2]||''} />
    : route === '#/chon-nhan-vat' || route === '#/nhan-vat' ? <AvatarPage editing={route === '#/nhan-vat'} initialAvatarId={auth.user?.avatarId} onAvatarConfirmed={auth.saveAvatar} />
    : route === '#/album' ? <AlbumPage />
    : route === '#/cua-hang' ? <ShopPage />
    : route === '#/su-kien' ? <EventsPage />
    : route.startsWith('#/su-kien/') ? <EventDetailsPage key={route} id={route.slice('#/su-kien/'.length)} />
    : /^#\/quest\/[^/]+\/dan-duong$/.test(route) ? <QuestNavigationPage key={route} id={route.split('/')[2]} />
    : /^#\/quest\/[^/]+\/chi-duong$/.test(route) ? <DueStartPage key={route} id={route.split('/')[2]} />
    : /^#\/quest\/[^/]+\/choi$/.test(route) ? <QuestPlayPage key={route} id={route.split('/')[2]} />
    : route.startsWith('#/nha-sang-tao/') ? <CreatorPage key={route} id={route.split('/')[2].split('?')[0]} from={new URLSearchParams(route.split('?')[1]||'').get('tu')||undefined}/>
    : route.startsWith('#/quest/') ? <QuestDetailsPage key={route} id={route.slice('#/quest/'.length)} />
    : route.startsWith('#/chi-duong/')&&getQuest(route.slice('#/chi-duong/'.length)) ? <QuestDetailsPage id={route.slice('#/chi-duong/'.length)}/>
    : route.startsWith('#/chi-duong/') ? <NavigationPage key={route} id={route.slice('#/chi-duong/'.length)} />
    : route.startsWith('#/hoan-thanh/') ? <CelebrationPage key={route} id={route.split('/')[2]} missionId={route.split('/')[3]} />
    : route.startsWith('#/may-anh/') ? <CameraPage key={route} id={route.split('/')[2]} missionId={route.split('/')[3]} />
    : route.startsWith('#/nhiem-vu/')&&getQuest(route.slice('#/nhiem-vu/'.length)) ? <QuestDetailsPage id={route.slice('#/nhiem-vu/'.length)}/>
    : route.startsWith('#/nhiem-vu/') ? <DestinationPage key={route} id={route.slice('#/nhiem-vu/'.length)} />
    : route.startsWith('#/dia-diem/') ? <DestinationDetails key={route} id={route.slice('#/dia-diem/'.length)} />
    : route !== '#/' ? <NotFoundPage/>  : <WelcomePage initialMode={homeAuthMode}/>
  const workspace = route.startsWith('#/tai-khoan') || ['#/album','#/cua-hang'].includes(route)
  const onboarding = /^#\/quest\/[^/]+\/chi-duong$/.test(route) || /^#\/quest\/[^/]+\/choi$/.test(route) || journeyRoute || route === '#/' || authRoute || route === '#/chon-nhan-vat' || route === '#/nhan-vat' || route.startsWith('#/may-anh/') || route.startsWith('#/hoan-thanh/')
  return <EventProvider route={showLogin?'#/dang-nhap':route}><div onClickCapture={event=>{
      if(auth.status==='authenticated'||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return
      const link=(event.target as Element).closest<HTMLAnchorElement>('a[href]')
      if(!link||link.target==='_blank'||link.hasAttribute('download'))return
      const target=new URL(link.href,window.location.href)
      if(target.origin!==window.location.origin||target.pathname!==window.location.pathname||!['#/dang-nhap','#/dang-ky'].includes(target.hash))return
      event.preventDefault();if(route==='#/'){setHomeAuthMode(target.hash==='#/dang-ky'?'register':'login');document.getElementById('home-login')?.scrollIntoView({behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});return}loginOpener.current=link;setLoginMode(target.hash==='#/dang-ky'?'register':'login');setLoginPrompt(true)
    }} inert={showLogin} ref={shell} className={`app-shell ${route==='#/'||authRoute?'home-shell':''} ${onboarding ? 'onboarding-shell' : ''} ${route.startsWith('#/tai-khoan') ? 'account-shell' : ''} ${workspace ? 'workspace-shell' : ''}`}>
    <PageTools route={route}>{auth.status === 'authenticated' && !onboarding && <ActiveMissionIndicator />}</PageTools>
    {workspace && <WorkspaceNavigation route={route}/>}
    <Suspense fallback={<main className="auth-loading"><p role="status">{t("Đang tải trang…")}</p></main>}>{page}</Suspense><Notifications />
    <MainNavigation route={route} />
  </div>{showLogin&&<AuthPage embedded initialMode={authRoute?(route==='#/dang-ky'?'register':'login'):loginMode} onClose={closeLogin} onAuthenticated={user=>{setLoginPrompt(false);setDismissedQuest(route);if(!user.avatarId){rememberPageReturn(route);window.location.hash='#/chon-nhan-vat'}}}/>}</EventProvider>
}

export default function App() {
  return <AuthProvider><LocaleProvider><AppRouter /></LocaleProvider></AuthProvider>
}
