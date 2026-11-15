import { t } from './i18n/locale'
import { useEffect, useRef, useState } from 'react'
import { getDestination } from './data/destinations'
import './LoginBackdrop.css'
import './HomePage.css'
import AuthPage from './AuthPage'
import { useAuth } from './AuthContext'
import { useLocale } from './i18n/LocaleProvider'
import { quests } from './data/quests'
import CoastalScene from './CoastalScene'
import { PixelButton, PixelAccordion, PixelProgressBar } from './ui/PixelUI'
import PixelAvatar from './PixelAvatar'
import PixelLogo from './PixelLogo'
import { resolveAvatar } from './lib/avatar'

const copyrightYear = new Date().getFullYear()
const scenery = ['cong-vien-apec', 'cau-rong', 'cau-song-han', 'chua-linh-ung-bai-but', 'hai-van-quan'].map(id => getDestination(id)!)

export function LoginBackdrop({ decorative = false }: { decorative?: boolean }) {
  const [slide, setSlide] = useState({ active: 0, previous: -1 })
  const [paused, setPaused] = useState(false)
  const [visible, setVisible] = useState(() => document.visibilityState !== 'hidden')
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)
  const loaded = useRef(new Set<number>())
  const failed = useRef(new Set<number>())
  useEffect(() => {
    const updateVisibility = () => setVisible(document.visibilityState !== 'hidden')
    const preference = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    const updateMotion = () => setReducedMotion(preference?.matches ?? false)
    document.addEventListener('visibilitychange', updateVisibility)
    preference?.addEventListener('change', updateMotion)
    return () => { document.removeEventListener('visibilitychange', updateVisibility); preference?.removeEventListener('change', updateMotion) }
  }, [])
  useEffect(() => {
    if (paused || !visible || reducedMotion) return
    const timer = window.setInterval(() => setSlide(current => {
      for (let offset = 1; offset < scenery.length; offset++) {
        const next = (current.active + offset) % scenery.length
        if (loaded.current.has(next) && !failed.current.has(next)) return { active: next, previous: current.active }
      }
      return current
    }), 20000)
    return () => window.clearInterval(timer)
  }, [paused, visible, reducedMotion])
  const place = scenery[slide.active]
  const credit = place.photoCredit?.replace(/\s+[—–-]\s+(.+)$/, ' ($1)')
  return <section className="login-landing" data-motion={paused||!visible||reducedMotion?"paused":"playing"} aria-hidden={decorative || undefined}>
    <div className="login-scenery" aria-hidden="true">{scenery.map((image, index) => <img key={image.id} className={`login-landing-photo ${index === slide.active ? 'is-active' : index === slide.previous ? 'is-previous' : ''}`} src={`${import.meta.env.BASE_URL}${image.photo!.replace(/^\//, '')}`} alt="" decoding="async" onLoad={() => { loaded.current.add(index); failed.current.delete(index); setSlide(current => failed.current.has(current.active) ? { active: index, previous: -1 } : current) }} onError={() => { failed.current.add(index); loaded.current.delete(index); setSlide(current => current.active === index && loaded.current.size ? { active: [...loaded.current][0], previous: -1 } : current) }} />)}</div>
    <header className="login-landing-header"><span className="login-brand" aria-hidden="true"><span className="login-logo-slot"><PixelLogo/></span></span>{!decorative && <a className="landing-login" href="#/dang-nhap">{t("Đăng nhập")}</a>}</header>
    <div className="login-landing-copy"><h1>{t("Bước ra phố.")}<br />{t("Mang về một câu chuyện.")}</h1><p>{t("Khám phá Đà Nẵng qua những câu đố và hành trình ngay trên những con phố.")}</p>{!decorative && <><a className="landing-primary" href="#/dang-nhap">{t("Bắt đầu khám phá")}</a><p className="landing-caption">{t("Chọn quest của bạn. Khám phá theo nhịp của riêng mình.")}</p><a className="landing-register" href="#/kich-hoat">{t("Bạn đã có mã quest hoặc lời mời?")}</a><div className="landing-background-controls"><small className="landing-photo-credit">{place.name.replace(/\s+[—–-]\s+(.+)$/, ' ($1)')}<br />{t("Ảnh:") + " "}{credit}</small>{!reducedMotion && <button type="button" className="landing-motion-toggle" aria-label={paused ? t("Tiếp tục ảnh nền") : t("Tạm dừng ảnh nền")} aria-pressed={paused} onClick={() => setPaused(value => !value)}>{paused ? t("Tiếp tục") : t("Tạm dừng")}</button>}</div></>}</div>
  </section>
}

export default function WelcomePage({ initialMode = 'login' }: { initialMode?: 'login' | 'register' }) {
  const { user } = useAuth()
  const { locale, setLanguage } = useLocale()
  const [menu, setMenu] = useState(false)
  const avatar=resolveAvatar(user?.avatarId)
  const [activeSection,setActiveSection]=useState('')
  const [compact, setCompact] = useState(false)
  const home = useRef<HTMLElement>(null)
  useEffect(() => { const update=()=>setCompact(window.scrollY>24);window.addEventListener('scroll',update,{passive:true});return()=>window.removeEventListener('scroll',update) },[])
  useEffect(() => {
    if(typeof IntersectionObserver==='undefined')return
    home.current?.classList.add('home-reveals-ready')
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-revealed');observer.unobserve(entry.target)}}),{threshold:.08})
    home.current?.querySelectorAll('.home-reveal').forEach(element=>observer.observe(element));
    const sections=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting)setActiveSection(entry.target.id)}),{root:home.current,rootMargin:'-15% 0px -55% 0px'});home.current?.querySelectorAll('section[id]').forEach(element=>sections.observe(element));return()=>{observer.disconnect();sections.disconnect()}
  },[])
  const scroll=(id:string)=>{setMenu(false);document.getElementById(id)?.scrollIntoView({behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'})}
  const links=[['explore',t('Khám phá','Discover')],['quests',t('Nhiệm vụ','Quests')],['rewards',t('Phần thưởng','Rewards')],['faq',t('Hỏi đáp','FAQ')]]
  const language=<div className="home-language" aria-label={t('Ngôn ngữ','Language')} lang="en">{(['vi','en'] as const).map(value=><button key={value} type="button" aria-pressed={locale===value} onClick={()=>setLanguage(value)}>{value.toUpperCase()}</button>)}</div>
  const play=<a className="home-button" href={user?.avatarId?'#/kham-pha':'#/chon-nhan-vat'}>{t('Vào chơi','Play now')} <span aria-hidden="true">↗</span></a>
  return <main ref={home} className="pixel-home home-shell" onScroll={event=>setCompact(event.currentTarget.scrollTop>24)}>
    <a className="home-skip" href="#home-content" onClick={event=>{event.preventDefault();scroll('home-content');document.getElementById('home-content')?.focus({preventScroll:true})}}>{t('Đến nội dung chính','Skip to content')}</a>
    <header className={`home-header ${compact?'is-compact':''}`}><div className="home-header-inner"><a className="home-brand" href="#/" aria-label="Dana Quest" lang="en"><PixelLogo/></a><nav className={menu?'is-open':''} aria-label={t('Điều hướng chính','Main navigation')}>{links.map(([id,label])=><button key={id} aria-current={activeSection===`home-${id}`?true:undefined} onClick={()=>scroll(`home-${id}`)}>{label}</button>)}</nav><div className="home-header-actions">{language}{user?<><a className="home-user" href="#/tai-khoan" title={user.name}>{avatar&&<PixelAvatar avatar={avatar}/>}<span>{user.name}</span></a>{play}</>:<PixelButton className="home-button" onClick={()=>scroll('home-login')}>{t('Đăng nhập','Log in')}</PixelButton>}<button className="home-menu" aria-expanded={menu} aria-label={t('Mở menu','Toggle menu')} onClick={()=>setMenu(!menu)}>☰</button></div></div></header>
    <section className="home-hero" id="home-content" tabIndex={-1}><div className="home-container home-hero-grid"><div className="home-hero-copy"><div className="home-location"><span aria-hidden="true">⌖</span> {t('Đà Nẵng, Việt Nam','Da Nang, Vietnam')}</div><h1>{t('Khám phá Đà Nẵng, nhận quà cực chất','Explore Da Nang. Bring home a story.')}</h1><p>{t('Biến mỗi góc phố thành một cuộc phiêu lưu. Theo dấu câu chuyện, giải những câu đố và lưu lại kỷ niệm của riêng bạn.','Turn the city into your next adventure. Follow a story, solve puzzles and collect memories along the way.')}</p><button className="home-text-link" onClick={()=>scroll('home-explore')}>{t('Hành trình bắt đầu thế nào?','How does the adventure begin?')} ↓</button><div className="home-art-frame"><CoastalScene/><span className="home-art-tag">{t('Hẹn bạn bên sông Hàn','Meet you by the Han River')}</span></div></div><div id="home-login" className="home-login-anchor">{user?<section className="home-return-card"><span className="home-pixel-label" lang="en">READY, EXPLORER?</span><PixelLogo className="home-return-logo"/><h2>{t('Chào mừng trở lại,','Welcome back,')} {user.name}!</h2><p>{t('Một góc phố mới, một câu chuyện mới đang chờ bạn. Tiếp tục hành trình theo nhịp của riêng mình.','A new corner and a new story are waiting. Continue exploring at your own pace.')}</p>{play}<a href="#/quest-cua-toi">{t('Quest của bạn','Your quests')}</a></section>:<AuthPage inline initialMode={initialMode}/>}</div></div></section>
    <section id="home-explore" className="home-section home-container home-reveal"><div className="home-section-heading"><span className="home-pixel-label" lang="en">LET’S GO!</span><h2>{t('Ra phố. Chơi một câu chuyện.','Step outside. Play a story.')}</h2><p>{t('Chỉ cần điện thoại và một chút tò mò.','Bring your phone and a little curiosity.')}</p></div><div className="home-steps">{[[t('Chọn hành trình','Pick your adventure'),t('Tìm quest hợp với địa điểm và thời gian của bạn. Đọc hướng dẫn trước khi xuất phát.','Find a quest that suits your location and schedule. Read the instructions before setting out.')],[t('Khám phá và giải đố','Explore and solve'),t('Đi đến các điểm dừng, quan sát xung quanh và hoàn thành thử thách trong câu chuyện.','Visit checkpoints, notice the details around you and complete the story’s challenges.')],[t('Lưu dấu hành trình','Keep the memories'),t('Nhận XP, xu và dấu hoàn thành theo nhiệm vụ. Xem lại hành trình trong hồ sơ của bạn.','Earn quest XP, coins and completion stamps. Revisit your journey in your profile.')]].map(([title,copy],index)=><article key={title}><span className="home-step-number" lang="en">0{index+1}</span><h3>{title}</h3><p>{copy}</p></article>)}</div></section><div className="home-hero-bottom" aria-hidden="true">✦ <span lang="en">WALK · DISCOVER · COLLECT</span> ✦ <span lang="en">DANA QUEST</span> ✦ <span lang="en">YOUR CITY ADVENTURE</span> ✦</div>
    <section id="home-quests" className="home-section home-quest-section"><div className="home-container home-reveal"><div className="home-section-heading home-heading-row"><div><span className="home-pixel-label" lang="en">CHOOSE YOUR QUEST</span><h2>{t('Có câu chuyện chờ bạn','Your next story is waiting')}</h2></div><a className="home-text-link" href="#/kham-pha">{t('Xem các hành trình','Explore the quests')} ↗</a></div><div className="home-quest-grid">{quests.slice(0,3).map((quest,index)=><a key={quest.id} className="home-quest-card" href={`#/quest/${quest.id}`}><div className={`home-quest-art scene-${index}`}><CoastalScene compact/><span className="home-pixel-label" lang="en">QUEST {String(index+1).padStart(2,'0')}</span></div><div className="home-quest-info"><small>{quest.area}</small><h3>{quest.title}</h3><p>{quest.summary}</p><div className="home-quest-meta"><span>{quest.estimatedMinutes} {t('phút','min')}</span><span>{quest.checkpoints.length} {t('điểm dừng','checkpoints')}</span></div></div></a>)}</div></div></section>
    <section id="home-rewards" className="home-section home-container home-reward-grid home-reveal"><div className="home-reward-art" aria-label={t('Minh họa phần thưởng kỹ thuật số','Digital rewards illustration')}><span className="home-pixel-label" lang="en">QUEST COMPLETE</span><div className="home-big-star" aria-hidden="true">★</div><div className="home-reward-chips"><span lang="en">XP</span><span lang="en">COINS</span><span lang="en">MEMORIES</span></div><PixelProgressBar className="home-xp-progress" value={8} max={12} label={t('Minh họa tiến độ','Illustrative progress')}/><small>{t('Minh họa tiến độ','Illustrative progress')}</small></div><div><span className="home-pixel-label" lang="en">TAKE THE STORY HOME</span><h2>{t('Đi một vòng phố. Mang về nhiều hơn.','A city walk. A little more to keep.')}</h2><p>{t('Mỗi thử thách hoàn thành góp thêm XP và xu vào hành trình. Lưu dấu hoàn thành trong hộ chiếu khám phá và ghé cửa hàng để xem những vật phẩm kỹ thuật số có thể đổi.','Completed challenges add XP and coins to your journey. Collect completion stamps in your explorer passport and visit the shop for available digital items.')}</p><p>{t('Kỷ niệm, huy hiệu và vật phẩm thuộc trải nghiệm trong game; phần thưởng cụ thể được hiển thị trong từng quest và cửa hàng.','Memories, badges and items belong to the game experience. Each quest and the shop show the rewards available.')}</p><a className="home-text-link" href="#/cua-hang">{t('Khám phá cửa hàng','Visit the shop')} ↗</a></div></section>
    <section id="home-faq" className="home-section home-faq-section"><div className="home-container home-faq-grid home-reveal"><div><span className="home-pixel-label" lang="en">BEFORE YOU GO</span><h2>{t('Bạn hỏi, Dana trả lời','A few things before you go')}</h2><p>{t('Chuẩn bị nhẹ nhàng cho một hành trình vui.','A little preparation for a good adventure.')}</p></div><div>{[[t('Tôi cần chuẩn bị gì?','What should I bring?'),t('Điện thoại có kết nối mạng, pin đủ dùng và trang phục phù hợp để đi bộ. Luôn đọc lưu ý an toàn của từng quest và tuân thủ quy định tại điểm đến.','A charged phone with internet access and comfortable walking clothes. Read each quest’s safety notes and follow the rules at every destination.')],[t('Tôi có thể chơi theo nhịp riêng không?','Can I explore at my own pace?'),t('Bạn tự chọn hành trình và thời điểm khám phá. Thời gian hiển thị là ước tính; hãy xem hướng dẫn cụ thể của quest trước khi bắt đầu.','Choose your journey and when to explore. Durations are estimates; check the quest instructions before starting.')],[t('Tiến độ của tôi được lưu ở đâu?','Where is my progress saved?'),t('Đăng nhập để sử dụng tài khoản và tiếp tục các quest của bạn. Hồ sơ hiển thị những hoạt động và dấu hoàn thành đã được ghi nhận.','Sign in to use your account and continue your quests. Your profile shows your recorded activities and completion stamps.')],[t('Tôi đã có mã quest thì làm thế nào?','I already have a quest code. What next?'),t('Chọn “Bạn đã có mã quest?” trong khung đăng nhập để mở trang kích hoạt, sau đó làm theo hướng dẫn nhập mã.','Choose “Already have a quest code?” in the sign-in panel to open the activation page and follow the instructions.')]].map(([question,answer])=><PixelAccordion key={question} title={question}><p>{answer}</p></PixelAccordion>)}</div></div></section>
    <section className="home-final-cta home-container home-reveal"><span className="home-pixel-label" lang="en">THE CITY IS YOUR PLAYGROUND</span><h2>{t('Câu chuyện tiếp theo bắt đầu từ bạn.','Your next story starts with you.')}</h2>{user?play:<PixelButton className="home-button" onClick={()=>scroll('home-login')}>{t('Bắt đầu khám phá','Start exploring')} ↗</PixelButton>}</section>
    <footer className="home-footer"><div className="home-container"><div className="home-footer-top"><a className="home-brand" href="#/" aria-label="Dana Quest" lang="en"><PixelLogo/></a><p>{t('Những con phố quen. Những câu chuyện mới.','Familiar streets. New stories.')}</p>{language}</div><div className="home-footer-bottom"><small lang="en">© {copyrightYear} Dana Quest</small><nav aria-label={t('Thông tin sử dụng','Legal information')}><a href="#/dieu-khoan">{t('Điều khoản','Terms')}</a><a href="#/quyen-rieng-tu">{t('Quyền riêng tư','Privacy')}</a><a href="#/tai-khoan/support">{t('Trợ giúp','Help')}</a></nav></div></div></footer>
  </main>
}
