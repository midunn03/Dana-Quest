import './EventDetailsPage.css'
import { t } from './i18n/locale'
import { useState } from 'react'
import { cityEvents } from './data/events'
import { getDestination } from './data/destinations'
import { getQuest } from './data/quests'
import { useEvents, formatEventTime } from './lib/eventContext'
import EventSave from './EventSave'
import { occurrenceFor } from '../shared/event-policy.mjs'
import { copyAccountText } from './lib/accountFeatures'
export default function EventDetailsPage({id}:{id:string}){
 const {now,error,catalog=cityEvents}=useEvents(),event=catalog.find(item=>item.id===id),[message,setMessage]=useState('')
 if(!event)return <main className="ev-page ev-detail-page"><div className="ev-frame"><h1>{t("Không tìm thấy sự kiện")}</h1><a href="#/su-kien">{t("Về Sự kiện")}</a></div></main>
 const occurrence=occurrenceFor(event,now)
 const destination=event.destinationId?getDestination(event.destinationId):undefined
 const directionsHref=destination
  ?getQuest(destination.id)?`#/quest/${destination.id}/dan-duong`:`#/chi-duong/${destination.id}`
  :'#/map'
 return <main className="ev-page ev-detail-page"><div className="ev-frame"><a className="ev-back" href="#/su-kien">{t("‹ Tất cả sự kiện")}</a><div className="ev-detail-layout"><article><div className="ev-detail-photo"><img src={`${import.meta.env.BASE_URL}photos/${event.image}.jpg`} alt={event.destinationId?t("Cầu Rồng"):t("Ảnh minh họa Đà Nẵng")}/><span className="ev-badge">{!occurrence?t("Đã kết thúc"):occurrence.start<=now?t("Đang diễn ra"):event.status==='expected'?t("Lịch dự kiến"):t("Sắp diễn ra")}</span></div><p className="ev-category">{event.category} ({event.area})</p><h1>{event.title}</h1><p className="ev-detail-summary">{event.summary}</p><section className="ev-copy"><h2>{t("Trước khi bạn đến")}</h2><p>{event.tips}</p>{event.id.startsWith('presentation-')?<><h2>{t('Thông tin cuộc hẹn','Meeting information')}</h2><p>{t('Cuộc hẹn này do người tổ chức hành trình tạo cho tài khoản của bạn. Không phải vé vào cửa.','This meeting was created by the adventure organiser for your account. It is not an admission ticket.')}</p></>:<><h2>{t("Thông tin từ đơn vị tổ chức")}</h2><p>{t("Lịch và điều kiện tham gia có thể thay đổi. Kiểm tra nguồn trước khi khởi hành.")}</p><a className="ev-text-link" target="_blank" rel="noreferrer" href={event.sourceUrl}>{t("Xem nguồn chính thức ↗")}</a></>}</section></article><aside className="ev-detail-panel"><h2>{t("Cuộc hẹn của bạn")}</h2><dl><div><dt>{t("Thời gian")}</dt><dd>{occurrence&&!event.allDay?formatEventTime(occurrence.start):event.scheduleLabel}</dd></div><div><dt>{t("Địa điểm")}</dt><dd>{event.location}</dd></div><div><dt>{t("Chi phí")}</dt><dd>{event.price}</dd></div></dl>{occurrence&&<EventSave event={event} occurrence={occurrence}/>}<p className="ev-hint">{event.allDay||event.status!=='confirmed'?t("Chưa có lịch giờ chính xác nên chưa gửi lời nhắc tự động."):t("Lưu kế hoạch cá nhân và nhắc trước 30 phút khi bạn đang dùng website. Không phải đặt vé.")}</p><a className="ev-secondary" href={directionsHref}>{destination?t("Chỉ đường đi bộ trong Dana Quest →"):t("Mở bản đồ trong Dana Quest →")}</a>{event.destinationId&&<a className="ev-text-link" href={`#/dia-diem/${event.destinationId}`}>{t("Khám phá địa điểm trong Dana Quest")}</a>}<button className="ev-text-link" onClick={()=>void copyAccountText(location.href).then(ok=>setMessage(ok?t("Đã sao chép liên kết."):location.href))}>{t("Chia sẻ sự kiện")}</button>{message&&<p role="status">{message}</p>}{error&&<p role="alert">{t(error)}</p>}</aside></div></div></main>
}
