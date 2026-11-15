import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import {localized,t} from './i18n/locale'
import { useAuth } from './AuthContext'
import { accountRequest } from './lib/accountFeatures'
import { showEventReminder } from './lib/eventReminders'
import { cityEvents, type CityEvent } from './data/events'
import { occurrenceFor, dueNotice, type Occurrence } from '../shared/event-policy.mjs'
import { EventContext, formatEventTime, inQuest, type EventState, type ActiveEventNotice } from './lib/eventContext'
import EventNotice from './EventNotice'

async function requestEvents(owner:string,body?:unknown){
 const value=await accountRequest<EventState>(owner,'/event-state',body)
 if(!value?.events?.decisions||!Number.isFinite(value.serverNow)||typeof value.enabled!=='boolean')throw Error(t('Dịch vụ sự kiện chưa sẵn sàng. Hãy tải lại hoặc thử lại sau.','The event service is unavailable. Reload or try again later.'))
 return value
}
export default function EventProvider({route,children}:{route:string;children:ReactNode}){
 const {user,status}=useAuth(),owner=status==='authenticated'?user?.id:undefined
 const [loaded,setLoaded]=useState<(EventState&{owner:string})|null>(null),[now,setNow]=useState(()=>Date.now()),[error,setError]=useState(''),[notice,setNotice]=useState<(ActiveEventNotice&{owner:string})|null>(null),[busy,setBusy]=useState(false)
 const state=loaded?.owner===owner?loaded:null,active=notice?.owner===owner?notice:null
 const offset=useRef(0),mounted=useRef(false),flight=useRef(false),shown=useRef(''),generation=useRef(0),lastApplied=useRef(0)
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false}},[])
 useEffect(()=>{generation.current++;lastApplied.current=0;shown.current=''},[owner])
 const apply=useCallback((value:EventState)=>{
  if(!mounted.current||value.serverNow<lastApplied.current)return
  lastApplied.current=value.serverNow;offset.current=value.serverNow-Date.now();setLoaded({...value,catalog:value.catalog?localized(value.catalog):undefined,owner:owner??''});setNow(value.serverNow);setError('')
 },[owner])
 const refresh=useCallback(async()=>{
  if(!owner||flight.current)return
  const token=generation.current
  try{const value=await requestEvents(owner);if(token===generation.current)apply(value)}catch(cause){if(mounted.current&&token===generation.current)setError(cause instanceof Error?cause.message:t('Chưa tải được lịch nhắc.','Could not load event reminders.'))}
 },[owner,apply])
 useEffect(()=>{void refresh();const tick=()=>{setNow(Date.now()+offset.current);if(!document.hidden)void refresh()};const timer=setInterval(tick,30000);const focus=()=>{if(!document.hidden)tick()};window.addEventListener('focus',focus);window.addEventListener('dana-event-preferences',focus);document.addEventListener('visibilitychange',focus);return()=>{clearInterval(timer);window.removeEventListener('focus',focus);window.removeEventListener('dana-event-preferences',focus);document.removeEventListener('visibilitychange',focus)}},[refresh])
 const activeValid=!!active&&(state?.catalog??cityEvents).some(event=>occurrenceFor(event,now)?.key===active.occurrence.key)
 const blocked=inQuest(route)||route==='#/chon-nhan-vat'||route==='#/'||route==='#/dang-nhap'||document.hidden
 useEffect(()=>{
  if(!owner||!state||!state.enabled||blocked||flight.current||activeValid&&active&&now<active.occurrence.start-(active.kind==='invite'?1800000:0))return
  const candidates=(state.catalog??cityEvents).flatMap(event=>{const occurrence=occurrenceFor(event,now);if(!occurrence||event.allDay||event.status!=='confirmed')return [];const kind=dueNotice(state.events.decisions[occurrence.key]||{},occurrence.start,now);return kind?[{event,occurrence,kind}]:[]}).sort((a,b)=>(a.kind==='reminder'?0:1)-(b.kind==='reminder'?0:1)||a.occurrence.start-b.occurrence.start)
  const candidate=candidates[0];if(!candidate||now-state.events.lastShown<300000)return
  flight.current=true;const token=++generation.current
  void requestEvents(owner,{action:'claim',eventId:candidate.event.id,key:candidate.occurrence.key}).then(value=>{if(!mounted.current||token!==generation.current)return;apply(value);if(value.notice)setNotice({...candidate,kind:value.notice,owner})}).catch(cause=>{if(mounted.current)setError(cause.message)}).finally(()=>{flight.current=false})
 },[owner,state,blocked,active,activeValid,now,apply])
 async function act(event:CityEvent,occurrence:Occurrence,action:'attend'|'later'|'remove'){
  if(!owner)throw Error(t('Hãy đăng nhập để lưu sự kiện và nhận lời nhắc.','Sign in to save events and receive reminders.'))
  ++generation.current
  const value=await requestEvents(owner,{eventId:event.id,key:occurrence.key,action});apply(value)
  if(mounted.current)setNotice(item=>item?.owner===owner&&item?.occurrence.key===occurrence.key?null:item)
 }
 const visible=activeValid&&!!active&&!blocked&&state?.enabled&&now<active.occurrence.start-(active.kind==='invite'?1800000:0)
 useEffect(()=>{if(!visible||!active)return;const key=`${owner}:${active.occurrence.key}:${active.kind}`;if(shown.current===key)return;shown.current=key;void showEventReminder(active.event.id,active.kind==='reminder'?t('Cuộc hẹn sắp bắt đầu','Your event starts soon'):active.event.title,`${active.event.location} (${formatEventTime(active.occurrence.start)})`)},[visible,active,owner])
 return <EventContext.Provider value={{catalog:state?.catalog??cityEvents,decisions:state?.events.decisions||{},now,enabled:state?.enabled??true,loading:!!owner&&!state&&!error,error,act,refresh:()=>void refresh()}}>{children}{visible&&active&&<aside className="ev-notice-position"><EventNotice {...active} now={now} busy={busy} error={error} onChoice={action=>{if(busy)return;setBusy(true);const operation=active.kind==='reminder'?Promise.resolve():act(active.event,active.occurrence,action);void operation.then(()=>setNotice(item=>item?.owner===owner?null:item)).catch(cause=>setError(cause.message)).finally(()=>setBusy(false))}}/></aside>}</EventContext.Provider>
}

