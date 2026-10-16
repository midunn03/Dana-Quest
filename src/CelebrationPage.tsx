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
    <a className="celebration-close" href={place?`#/nhiem-vu/${id}`:'#/kham-pha'} aria-label="Quay lại khám phá">×</a>
    <div className="celebration-content"><span className="completion-ribbon">{loading&&!demo?'Đang đọc tiến độ…':allowed?'Hoàn thành nhiệm vụ!':'Nhiệm vụ chưa hoàn thành'}</span>
      <div className="coin-burst" aria-hidden="true">{Array.from({length:12},(_,i)=><i key={i} style={{transform:`rotate(${i*30}deg) translateY(-115px)`}}/>)}<div className="giant-coin"><span>✓</span></div></div>
      <h1>{allowed?`+ ${demo?50:COINS_PER_MISSION} Green Coins`:'Tiếp tục hành trình'}</h1>
      <p>{demo?'Minh họa phần thưởng · không cộng xu':completed?'Xu demo đã được ghi nhận một lần.': 'Hoàn thành nhiệm vụ để nhận xu demo.'}</p>
      {mission&&<p className="celebration-mission">{mission.title} · {place?.name}</p>}
      <a className="game-button" href={place?`#/nhiem-vu/${id}`:'#/kham-pha'}>Tiếp tục khám phá</a><a className="celebration-album" href="#/album">Xem kỷ niệm của bạn →</a>
    </div></main>
}
