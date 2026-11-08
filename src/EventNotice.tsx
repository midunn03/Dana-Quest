import './EventNotice.css'
import { t } from './i18n/locale'
import type {CityEvent} from './data/events'
import type {Occurrence} from '../shared/event-policy.mjs'
import {formatEventTime} from './lib/eventContext'
export default function EventNotice({event,occurrence,kind,now,onChoice,busy=false,error=''}:{event:CityEvent;occurrence:Occurrence;kind:'invite'|'reminder';now:number;onChoice:(action:'attend'|'later')=>void;busy?:boolean;error?:string}){
 return <section className="ev-notice" aria-label={t("Thông báo sự kiện")} aria-live="polite"><img src={`${import.meta.env.BASE_URL}photos/${event.image}.jpg`} alt=""/><div className="ev-notice-content"><button className="ev-notice-close" disabled={busy} aria-label={kind==='reminder'?t("Đóng lời nhắc"):t("Đóng và để sau một giờ")} onClick={()=>onChoice('later')}>{t("×")}</button><small>{kind==='reminder'?t("Sự kiện bạn đã lưu"):t("Có hẹn với Đà Nẵng")}</small><a href={`#/su-kien/${event.id}`} className="ev-notice-title">{event.title}</a><p>{event.location}<br/>{formatEventTime(occurrence.start)} {" " + t("(còn") + " "}{Math.max(1,Math.ceil((occurrence.start-now)/60000))} {" " + t("phút)")}</p>{kind==='invite'?<div className="ev-notice-actions"><button className="ev-primary" disabled={busy} onClick={()=>onChoice('attend')}>{t("Chắc chắn sẽ tham gia")}</button><button className="ev-secondary" disabled={busy} onClick={()=>onChoice('later')}>{t("Để sau đi")}</button></div>:<div className="ev-notice-actions"><a className="ev-primary" href={`#/su-kien/${event.id}`}>{t("Xem sự kiện")}</a><button className="ev-secondary" disabled={busy} onClick={()=>onChoice('later')}>{t("Đã hiểu")}</button></div>}{kind==='invite'&&<small>{t("Đóng hoặc để sau: nhắc lại sau một giờ, trước mốc 30 phút.")}</small>}{error&&<p role="alert">{t(error)}</p>}</div></section>
}


