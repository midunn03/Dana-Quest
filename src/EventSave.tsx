import { t } from './i18n/locale'
import {requestLogin} from './lib/authPrompt'
import { useState } from 'react'
import { useAuth } from './AuthContext'
import { useEvents } from './lib/eventContext'
import { type CityEvent } from './data/events'
import { type Occurrence } from '../shared/event-policy.mjs'
export default function EventSave({event,occurrence}:{event:CityEvent;occurrence:Occurrence}){
 const {user}=useAuth(),{decisions,act,loading}=useEvents(),[busy,setBusy]=useState(false),[error,setError]=useState('')
 const saved=decisions[occurrence.key]?.choice==='attend'
 if(!user)return <a className="ev-primary" href="#/dang-nhap" onClick={event=>{event.preventDefault();requestLogin()}}>{t("Đăng nhập để lưu sự kiện")}</a>
 return <div className="ev-save"><button className={saved?'ev-secondary':'ev-primary'} disabled={busy||loading} aria-pressed={saved} onClick={()=>{setBusy(true);setError('');void act(event,occurrence,saved?'remove':'attend').catch(cause=>setError(cause.message)).finally(()=>setBusy(false))}}>{busy?t("Đang lưu…"):saved?t("Đã lưu (bấm để bỏ lưu)"):t("Chắc chắn sẽ tham gia")}</button>{error&&<p role="alert">{t(error)}</p>}</div>
}


