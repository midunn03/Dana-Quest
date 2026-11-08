import './CelebrationPage.css'
import { t } from './i18n/locale'
import { useProgress } from './lib/useProgress'
import { getDestination } from './data/destinations'
import { getMissions } from './data/missions'
import { COINS_PER_MISSION } from './data/rewards'
import LandmarkArt from './LandmarkArt'
export default function CelebrationPage({ id, missionId }: { id:string; missionId?:string }) {
  const {state,loading}=useProgress()
  const demo=id==='demo'
  const place=getDestination(id)
  const completed=!!state.destinations[id]?.completed.includes(missionId??'')
  const mission=place&&getMissions(place).find(item=>item.id===missionId)
  const allowed=demo||completed
  return <main className="celebration-screen"><div className="celebration-background"><LandmarkArt id={place?.id} sunset/></div>
    <a className="celebration-close" href={place?`#/nhiem-vu/${id}`:'#/kham-pha'} aria-label={t("Quay lại khám phá")}>{t("×")}</a>
    <div className="celebration-content"><span className="completion-ribbon">{loading&&!demo?t("Đang đọc tiến độ…"):allowed?t("Hoàn thành nhiệm vụ!"):t("Nhiệm vụ chưa hoàn thành")}</span>
      <div className="coin-burst" aria-hidden="true">{Array.from({length:12},(_,i)=><i key={i} style={{transform:`rotate(${i*30}deg) translateY(-115px)`}}/>)}<div className="giant-coin"><span>✓</span></div></div>
      <h1>{allowed?`+ ${demo?50:COINS_PER_MISSION} ${t('Xu Dana','Dana Coins')}`:t("Tiếp tục hành trình")}</h1>
      <p>{demo?t("Minh họa phần thưởng · không cộng xu"):completed?t("Xu Dana đã được ghi nhận một lần.","Your Dana Coins have been recorded once."): t("Hoàn thành nhiệm vụ để nhận Xu Dana.","Complete the mission to receive Dana Coins.")}</p>
      {mission&&<p className="celebration-mission">{mission.title} · {place?.name}</p>}
      <a className="game-button" href={place?`#/nhiem-vu/${id}`:'#/kham-pha'}>{t("Tiếp tục khám phá")}</a><a className="celebration-album" href="#/album">{t("Xem kỷ niệm của bạn →")}</a>
    </div></main>
}
