import { t } from './i18n/locale'
import { useState } from 'react'
import { cityEvents } from './data/events'
import EventNotice from './EventNotice'
import { dueNotice, decideEvent, claimNotice, type EventDecision } from '../shared/event-policy.mjs'
const base=Date.parse('2026-10-30T09:30:00+07:00'),occurrence={key:'demo',start:base,end:base+1200000}
const times=[['06:29',181],['06:30',180],['07:00',150],['08:00',90],['09:00',30],['09:10',20],['09:30',0]] as const
export default function EventDemo(){
 const [now,setNow]=useState(base-150*60000),[state,setState]=useState<EventDecision>({}),[playing,setPlaying]=useState(false),[dismissed,setDismissed]=useState(false),[log,setLog]=useState(t("Đăng nhập giả lập lúc 07:00. Thông báo đủ điều kiện xuất hiện."))
 const kind=dueNotice(state,base,now),event={...cityEvents[0],id:'cau-rong-phun-lua',title:t("Cầu Rồng phun lửa (demo 09:30)")}
 return <section className="ev-demo"><h2>{t("Phòng thử thông báo")}</h2><p>{t("Lịch giả lập Cầu Rồng lúc 09:30. Không thay lịch thật, không lưu tài khoản và không gửi thông báo hệ thống.")}</p><div className="ev-demo-times">{times.map(([label,minutes])=><button key={label} aria-pressed={now===base-minutes*60000} onClick={()=>{setNow(base-minutes*60000);setDismissed(false)}}>{label}</button>)}</div><label className="ev-demo-playing"><input type="checkbox" checked={playing} onChange={e=>setPlaying(e.target.checked)}/> {" " + t("Giả lập đang chơi quest (hoãn thông báo)")}</label>{kind&&!playing&&!dismissed?<EventNotice event={event} occurrence={occurrence} kind={kind} now={now} onChoice={choice=>{setState(kind==='reminder'?claimNotice(state,kind,now):decideEvent(state,choice,now));setDismissed(true);setLog(kind==='reminder'?t("Đã đọc lời nhắc. Không nhắc lại lần tổ chức này."):choice==='attend'?t("Đã lưu. Sẽ nhắc một lần từ 09:00 đến trước 09:30."):t("Để sau một giờ kể từ mốc hiện tại; dừng lời mời từ 09:00."))}}/>:<p className="ev-demo-status">{playing?t("Đang chơi quest: thông báo được hoãn."):now>=base?t("Sự kiện đã bắt đầu. Không gửi thông báo hết hạn."):t("Không có thông báo cần hiện ở mốc này.")}</p>}<p role="status">{log}</p><button className="ev-secondary" onClick={()=>{setState({});setNow(base-150*60000);setPlaying(false);setDismissed(false);setLog(t("Đã đặt lại bản demo lúc 07:00."))}}>{t("Thử lại từ đầu")}</button></section>
}

