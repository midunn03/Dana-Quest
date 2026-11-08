import QuestCoverCard from './ui/QuestCoverCard'
import './Discovery.css'
import { interpolate } from './i18n/locale'
import { t } from './i18n/locale'
import { useEffect, useState } from 'react'
import { loadActivatedQuests, type ActivatedQuest } from './lib/activation'
import { destinations, getDestination } from './data/destinations'
import { quests } from './data/quests'
import { searchText } from './lib/filters'
import { useProgress } from './lib/useProgress'
import { useQuestProgress } from './lib/useQuestProgress'
import { isDestinationComplete } from './lib/rules'
import LandmarkArt from './LandmarkArt'
import { NavigationIcon } from './MainNavigation'

type Mode = 'explore' | 'search' | 'joined'
type Card = { id: string; title: string; area: string; description: string; href: string; photo?: string; status?: string; sample?: boolean }
const displayText = (text: string) => text.replace(/\s+[—–-]\s+(.+)$/, ' ($1)')

export default function DiscoveryPage({ mode = 'explore', activatedEnabled = false }: { mode?: Mode; activatedEnabled?: boolean }) {
  const [query, setQuery] = useState('')
  const { state, loading, error } = useProgress()
  const { state: questState, loading: questLoading, error: questError } = useQuestProgress()
  const joined = mode === 'joined'
  const [activated,setActivated]=useState<ActivatedQuest[]>([])
  const [activationError,setActivationError]=useState('')
  const [activationLoading,setActivationLoading]=useState(joined&&activatedEnabled)
  useEffect(()=>{
    if(!joined||!activatedEnabled)return
    let alive=true
    loadActivatedQuests().then(items=>{if(alive){setActivated(items);setActivationLoading(false)}}).catch(cause=>{if(alive){setActivationError((cause as Error).message);setActivationLoading(false)}})
    return ()=>{alive=false}
  },[joined,activatedEnabled])
  const cards: Card[] = [
    ...quests.filter(quest => !joined || questState.quests[quest.id]).map(quest => {
      const run = questState.quests[quest.id]
      return { photo:getDestination(quest.id)?.photo, id: quest.id, title: displayText(quest.title), area: getDestination(quest.id)?.name??displayText(quest.area), description: interpolate("${0} thử thách (${1} phút)",[quest.checkpoints.length,quest.estimatedMinutes]), href: `#/quest/${quest.id}`, sample: quest.id==='due-dau-an-50-nam', status: run ? (run.completedAt ? t("Đã hoàn thành") : t("Đang tham gia")) : undefined }
    }),
    ...(joined ? Object.keys(state.destinations).map(getDestination).filter(place => !!place && state.destinations[place.id]?.started) : destinations).flatMap(place => {
      if (!place) return []
      const progress = state.destinations[place.id]
      return [{ id: place.id, title: place.name, area: t("Đà Nẵng"), description: place.highlightReason, photo: place.photo, href: quests.some(q=>q.id===place.id)?`#/quest/${place.id}`:joined ? `#/nhiem-vu/${place.id}` : `#/dia-diem/${place.id}`, status: progress?.started ? (isDestinationComplete(progress) ? t("Đã hoàn thành") : interpolate("Đang tham gia (${0}/${1})",[progress.completed.length,progress.selected.length])) : undefined }]
    }),
  ]
  const activatedCards: Card[]=activated.flatMap(item=>{
    const quest=quests.find(quest=>quest.id===item.questId)
    const place=getDestination(item.questId)
    if(!quest&&!place)return []
    return [{id:item.questId,title:displayText(quest?.title||place!.name),area:t("Đà Nẵng"),description:t("Hành trình đã gắn vào tài khoản bằng mã Dana Quest."),href:quest?`#/quest/${item.questId}`:`#/dia-diem/${item.questId}`,photo:place?.photo,status:t("Đã kích hoạt"),sample:!!quest}]
  })
  const allCards=[...cards,...activatedCards].filter((card,index,list)=>list.findIndex(item=>item.id===card.id)===index)
  const filtered = allCards.filter(card => searchText(`${card.title} ${card.area} ${card.description}`).includes(searchText(query)))
  const title = joined ? t("Quest của bạn") : mode === 'search' ? t("Tìm kiếm") : t("Khám phá Đà Nẵng")
  return <main className="discovery-page" aria-labelledby="discovery-title">
    <header className="discovery-header"><span className="city-pill"><NavigationIcon kind="explore" />{t("Đà Nẵng")}</span><a className="map-toggle" href="#/map"><NavigationIcon kind="explore" />{t("Bản đồ")}</a></header>
    <div className="discovery-title-row"><div><h1 id="discovery-title">{title}</h1><p>{joined ? t("Những hành trình bạn đã bắt đầu, ở cùng một nơi.") : t("Đi bộ, giải câu đố và khám phá câu chuyện thành phố.")}</p></div>
    </div>
    {mode === 'explore' && <aside className="discovery-intro"><span className="intro-symbol" aria-hidden="true">✦</span><div><h2>{t("Thành phố quen, câu chuyện mới")}</h2><p>{t("Chọn một quest, đến điểm hẹn và bắt đầu khám phá theo cách của bạn.")}</p></div></aside>}
    <label className="discovery-search"><NavigationIcon kind="search" /><span className="sr-only">{t("Tìm quest hoặc địa điểm")}</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={t("Tìm quest hoặc địa điểm")} autoFocus={mode === 'search'} /></label>
    {joined && <div className="discovery-utilities"><a href="#/album">{t("Thư viện ảnh")}</a><a href="#/cua-hang">{t("Cửa hàng đổi xu")}</a><a href="#/nhap-ma">{t("Nhập mã quest")}</a></div>}
    {(loading||questLoading||activationLoading) && joined && <p role="status">{t("Đang tải các quest đã tham gia…")}</p>}
    {error && <p role="alert" className="notice error">{t(error)}</p>}
    {questError && <p role="alert" className="notice error">{t(questError)}</p>}
    {activationError && <p role="alert" className="notice error">{t(activationError)}</p>}
    <div className="discovery-section-heading"><h2>{joined ? t("Hành trình đã tham gia") : query ? t("Kết quả tìm kiếm") : t("Các quest dành cho bạn")}</h2><span lang="en">{filtered.length} quest</span></div>
    <div className="discovery-grid quest-cover-grid">{filtered.map(card => <QuestCoverCard className="discovery-card" key={card.id} href={card.href} cover={
      <div className={`discovery-card-image ${card.sample ? 'sample-cover' : ''}`}>{card.photo ? <img src={`${import.meta.env.BASE_URL}${card.photo.replace(/^\//, '')}`} alt="" loading="lazy" /> : card.sample ? <svg viewBox="0 0 480 300" aria-hidden="true"><path fill="#173e48" d="M0 0h480v300H0z"/><circle cx="430" cy="50" r="140" fill="#285965"/><path fill="none" stroke="#e6bc67" strokeWidth="2" d="M30 260h420M345 95v115m-30-100h60m-46-13h32M90 250h300"/><text x="36" y="62" fill="#f5dfad" fontSize="22" fontWeight="400">{t("MẬT THƯ")}</text><text x="32" y="205" fill="#f5dfad" fontSize="140" fontWeight="400">✦</text><text x="245" y="212" fill="#f5dfad" fontSize="22">{t("Ký ức thành phố")}</text></svg> : <LandmarkArt id={card.id} />}</div>} bodyClassName="discovery-card-body">
      <span className="card-location">{card.area}</span><h3>{card.title}</h3><p>{card.description}</p><div className="card-bottom"><span className={card.status ? 'quest-status' : ''}>{card.status || t('Xem quest')}</span><span aria-hidden="true">↗</span></div>
    </QuestCoverCard>)}</div>
    {!filtered.length && !(joined && (loading || error || questLoading || questError || activationLoading || activationError)) && <section className="discovery-empty"><NavigationIcon kind={joined ? 'quests' : 'search'} /><h2>{query ? t("Không tìm thấy quest phù hợp.") : t("Hành trình đầu tiên đang chờ bạn")}</h2><p>{query ? t("Thử tên địa điểm khác hoặc tìm không dấu.") : t("Quest sẽ xuất hiện ở đây sau khi bạn bắt đầu tham gia.")}</p>{query ? <button onClick={() => setQuery('')}>{t("Xóa tìm kiếm")}</button> : <a href="#/kham-pha">{t("Khám phá các quest")}</a>}</section>}
  </main>
}

