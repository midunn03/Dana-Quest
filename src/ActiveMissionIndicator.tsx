import './ActiveMissionIndicator.css'
import { interpolate } from './i18n/locale'
import {t} from './i18n/locale'
import {getDestination} from './data/destinations'
import {getQuest} from './data/quests'
import {useProgress} from './lib/useProgress'
import {useQuestProgress} from './lib/useQuestProgress'

function MissionCard({ href, name, completed, total, label, title }: {
 href:string; name:string; completed:number; total:number; label:string; title?:string
}) {
 return <a className="active-mission-indicator" href={href} aria-label={label} title={title}>
  <span className="active-mission-icon" aria-hidden="true">⚑</span>
  <span className="active-mission-copy"><strong>{t("Tiếp tục quest", "Continue quest")}</strong><span className="active-mission-title">{name}</span></span>
  <small aria-label={`${t('Tiến độ','Progress')} ${completed}/${total}`}>{completed}/{total}</small>
  <span className="active-mission-arrow" aria-hidden="true">↗</span>
 </a>
}

export default function ActiveMissionIndicator(){
 const legacy=useProgress(),current=useQuestProgress()
 const active=Object.entries(current.state.quests).filter(([,run])=>!run.completedAt).sort((a,b)=>b[1].startedAt-a[1].startedAt)[0]
 if(active){const [id,run]=active,quest=getQuest(id);if(quest)return <MissionCard href={`#/quest/${id}/${run.arrivalConfirmedAt?'choi':'chi-duong'}`} name={quest.title} completed={run.completedCheckpointIds.length} total={quest.checkpoints.length} label={interpolate("Quest đang chơi: ${0}",[quest.title])} title={interpolate("Tiếp tục quest ${0}",[quest.title])}/>}
 if(legacy.loading||current.loading)return null
 const old=Object.entries(legacy.state.destinations).find(([id,run])=>!getQuest(id)&&run.started&&run.completed.length<run.selected.length)
 if(!old)return null
 const [id,run]=old,place=getDestination(id);return place?<MissionCard href={`#/nhiem-vu/${id}`} name={place.name} completed={run.completed.length} total={run.selected.length} label={interpolate("Tiến độ cũ tại ${0}",[place.name])}/>:null
}
